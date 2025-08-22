const express = require('express');
const Feedback = require('../models/Feedback');
const { auth, adminAuth } = require('../middleware/auth');
const { sendFeedbackReplyNotification } = require('../utils/email');
const router = express.Router();

// 提交反馈 (公开)
router.post('/', async (req, res) => {
  try {
    const { name, email, subject, message, type } = req.body;

    const feedback = new Feedback({
      name,
      email,
      subject,
      message,
      type
    });

    await feedback.save();

    res.status(201).json({ message: '反馈提交成功，我们会尽快处理' });
  } catch (error) {
    console.error('提交反馈错误:', error);
    res.status(500).json({ message: '提交反馈失败，请稍后重试' });
  }
});

// 获取用户反馈 (需要登录)
router.get('/my-feedback', auth, async (req, res) => {
  try {
    const feedback = await Feedback.find({ user: req.user.userId })
      .sort({ createdAt: -1 });

    res.json({ feedback });
  } catch (error) {
    console.error('获取用户反馈错误:', error);
    res.status(500).json({ message: '获取反馈失败' });
  }
});

// 获取所有反馈 (仅管理员)
router.get('/', adminAuth, async (req, res) => {
  try {
    const { status, type, page = 1, limit = 20 } = req.query;
    const query = {};

    if (status) {
      query.status = status;
    }

    if (type) {
      query.type = type;
    }

    const skip = (page - 1) * limit;
    const feedback = await Feedback.find(query)
      .populate('user', 'username email')
      .populate('adminReply.adminId', 'username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Feedback.countDocuments(query);

    res.json({
      feedback,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('获取反馈列表错误:', error);
    res.status(500).json({ message: '获取反馈列表失败' });
  }
});

// 获取反馈详情 (仅管理员)
router.get('/:id', adminAuth, async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id)
      .populate('user', 'username email')
      .populate('adminReply.adminId', 'username');

    if (!feedback) {
      return res.status(404).json({ message: '反馈不存在' });
    }

    res.json({ feedback });
  } catch (error) {
    console.error('获取反馈详情错误:', error);
    res.status(500).json({ message: '获取反馈详情失败' });
  }
});

// 回复反馈 (仅管理员)
router.post('/:id/reply', adminAuth, async (req, res) => {
  try {
    const { message } = req.body;
    const feedback = await Feedback.findById(req.params.id);

    if (!feedback) {
      return res.status(404).json({ message: '反馈不存在' });
    }

    feedback.adminReply = {
      message,
      adminId: req.user.userId,
      repliedAt: new Date()
    };

    feedback.status = 'resolved';
    await feedback.save();
    
    // 检查是否为生产环境且反馈有邮箱
    const isProduction = process.env.NODE_ENV === 'production';
    if (isProduction && feedback.email) {
      try {
        // 发送反馈回复通知邮件给用户
        await sendFeedbackReplyNotification(
          feedback.email,
          feedback.subject,
          message
        );
        console.log('准备发送反馈回复通知给用户:', feedback.email);
      } catch (emailError) {
        console.error('发送反馈回复通知邮件失败:', emailError);
        // 邮件发送失败不应影响主要业务逻辑
      }
    } else {
      // 开发环境：只记录日志，不实际发送邮件
      console.log('准备发送反馈回复通知给用户:', feedback.email);
    }

    res.json({ message: '回复成功', feedback });
  } catch (error) {
    console.error('回复反馈错误:', error);
    res.status(500).json({ message: '回复失败' });
  }
});

// 更新反馈状态 (仅管理员)
router.patch('/:id/status', adminAuth, async (req, res) => {
  try {
    const { status, priority } = req.body;
    const updateData = {};

    if (status) {
      updateData.status = status;
    }

    if (priority) {
      updateData.priority = priority;
    }

    const feedback = await Feedback.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!feedback) {
      return res.status(404).json({ message: '反馈不存在' });
    }

    res.json({ message: '状态更新成功', feedback });
  } catch (error) {
    console.error('更新反馈状态错误:', error);
    res.status(500).json({ message: '状态更新失败' });
  }
});

// 删除反馈 (仅管理员)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const feedback = await Feedback.findByIdAndDelete(req.params.id);
    if (!feedback) {
      return res.status(404).json({ message: '反馈不存在' });
    }

    res.json({ message: '反馈删除成功' });
  } catch (error) {
    console.error('删除反馈错误:', error);
    res.status(500).json({ message: '删除失败' });
  }
});

module.exports = router;