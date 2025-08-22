const express = require('express');
const router = express.Router();
const { sendAdminNotificationEmail } = require('../utils/email');
const Feedback = require('../models/Feedback');
const { auth } = require('../middleware/auth');

// 创建一个包装中间件，处理未登录用户的情况
const optionalAuth = (req, res, next) => {
  auth(req, res, (err) => {
    // 如果有错误（例如未登录），不要中断请求流程
    if (err) {
      // 设置req.user为null表示未登录
      req.user = null;
    }
    // 无论如何都继续处理请求
    next();
  });
};

// 联系我们 - 发送消息到管理员邮箱并保存到数据库
// 使用可选认证中间件，支持登录和未登录用户
router.post('/', optionalAuth, async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    // 验证输入
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ message: '请填写所有必填字段' });
    }

    try {
      // 检查请求体中是否指定了type，如果没有默认为'general'
      const feedbackType = req.body.type || 'general';
      
      // 创建反馈记录并保存到数据库
      const newFeedback = new Feedback({
        name,
        email,
        subject,
        message,
        type: feedbackType,
        status: 'pending',  // 默认状态为待处理
        createdAt: Date.now(),
        user: req.user?.userId || null // 如果用户已登录，关联用户ID
      });

      await newFeedback.save();
      console.log('成功保存反馈到数据库:', newFeedback._id);
    } catch (dbError) {
      console.error('保存反馈到数据库失败:', dbError);
      // 即使数据库保存失败，也继续流程，因为主要功能是用户留言
    }

    const isProduction = process.env.NODE_ENV === 'production';

    if (isProduction) {
      // 生产环境：准备邮件内容并发送
      const emailContent = `
        <p style="color: #475569; margin-bottom: 15px;">您收到了一条来自anwei网站的新联系消息：</p>
        <div style="background-color: #f1f5f9; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <p style="color: #475569; margin: 5px 0;"><strong>发件人：</strong>${name}</p>
          <p style="color: #475569; margin: 5px 0;"><strong>邮箱：</strong>${email}</p>
          <p style="color: #475569; margin: 5px 0;"><strong>主题：</strong>${subject}</p>
          <p style="color: #475569; margin: 15px 0 5px 0;"><strong>消息内容：</strong></p>
          <p style="color: #475569; margin: 5px 0; line-height: 1.6;">${message.replace(/\n/g, '<br>')}</p>
        </div>
        <p style="color: #64748b; font-size: 14px;">请及时回复用户的咨询。</p>
      `;

      // 发送邮件到管理员邮箱
      await sendAdminNotificationEmail('新的联系消息', emailContent);
    } else {
      // 开发环境：只记录日志，不实际发送邮件
      console.log('开发环境下收到新的联系消息:', {
        name,
        email,
        subject,
        message
      });
    }

    res.status(200).json({ message: '您的消息已成功发送，我们将尽快回复您！' });
  } catch (error) {
    console.error('发送联系消息失败:', error);
    res.status(500).json({ message: '发送消息失败，请稍后重试' });
  }
});

module.exports = router;