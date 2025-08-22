const express = require('express');
const Tool = require('../models/Tool');
const { auth, adminAuth } = require('../middleware/auth');
const router = express.Router();

// 获取所有工具 (公开)
router.get('/', async (req, res) => {
  try {
    const { category, search, page = 1, limit = 20 } = req.query;
    const query = { isActive: true };

    // 分类筛选
    if (category) {
      query.category = category;
    }

    // 搜索功能
    if (search) {
      query.$text = { $search: search };
    }

    const skip = (page - 1) * limit;
    const tools = await Tool.find(query)
      .populate('createdBy', 'username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Tool.countDocuments(query);

    res.json({
      tools,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('获取工具列表错误:', error);
    res.status(500).json({ message: '获取工具列表失败' });
  }
});

// 获取工具详情 (公开)
router.get('/:id', async (req, res) => {
  try {
    const tool = await Tool.findById(req.params.id)
      .populate('createdBy', 'username')
      .populate('reviews.user', 'username avatar');

    if (!tool || !tool.isActive) {
      return res.status(404).json({ message: '工具不存在' });
    }

    // 增加浏览次数
    tool.viewCount += 1;
    await tool.save();

    res.json({ tool });
  } catch (error) {
    console.error('获取工具详情错误:', error);
    res.status(500).json({ message: '获取工具详情失败' });
  }
});

// 创建工具 (仅管理员)
router.post('/', adminAuth, async (req, res) => {
  try {
    const toolData = {
      ...req.body,
      createdBy: req.user.userId
    };

    const tool = new Tool(toolData);
    await tool.save();

    res.status(201).json({ message: '工具创建成功', tool });
  } catch (error) {
    console.error('创建工具错误:', error);
    res.status(500).json({ message: '创建工具失败' });
  }
});

// 更新工具 (仅管理员)
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const tool = await Tool.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!tool) {
      return res.status(404).json({ message: '工具不存在' });
    }

    res.json({ message: '工具更新成功', tool });
  } catch (error) {
    console.error('更新工具错误:', error);
    res.status(500).json({ message: '更新工具失败' });
  }
});

// 删除工具 (仅管理员)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const tool = await Tool.findByIdAndDelete(req.params.id);
    if (!tool) {
      return res.status(404).json({ message: '工具不存在' });
    }

    res.json({ message: '工具删除成功' });
  } catch (error) {
    console.error('删除工具错误:', error);
    res.status(500).json({ message: '删除工具失败' });
  }
});

// 工具评分 (需要登录)
router.post('/:id/rate', auth, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const tool = await Tool.findById(req.params.id);

    if (!tool) {
      return res.status(404).json({ message: '工具不存在' });
    }

    // 检查用户是否已经评分
    const existingReview = tool.reviews.find(
      review => review.user.toString() === req.user.userId
    );

    if (existingReview) {
      return res.status(400).json({ message: '您已经对此工具评分过了' });
    }

    // 添加评分
    tool.reviews.push({
      user: req.user.userId,
      rating,
      comment
    });

    // 重新计算平均评分
    const totalRating = tool.reviews.reduce((sum, review) => sum + review.rating, 0);
    tool.rating = totalRating;
    tool.ratingCount = tool.reviews.length;

    await tool.save();

    res.json({ message: '评分成功', tool });
  } catch (error) {
    console.error('工具评分错误:', error);
    res.status(500).json({ message: '评分失败' });
  }
});

// 增加工具点击次数
router.post('/:id/click', async (req, res) => {
  try {
    const tool = await Tool.findById(req.params.id);

    if (!tool || !tool.isActive) {
      return res.status(404).json({ message: '工具不存在' });
    }

    // 增加点击次数
    tool.clickCount += 1;
    await tool.save();

    res.json({ message: '点击记录成功', clickCount: tool.clickCount });
  } catch (error) {
    console.error('记录点击错误:', error);
    res.status(500).json({ message: '记录点击失败' });
  }
});

module.exports = router;