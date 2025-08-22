const express = require('express');
const Product = require('../models/Product');
const { auth, adminAuth } = require('../middleware/auth');
const router = express.Router();

// 获取所有产品 (公开)
router.get('/', async (req, res) => {
  try {
    const { category, search, page = 1, limit = 20, sort = 'createdAt' } = req.query;
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
    const sortOptions = {};
    sortOptions[sort] = sort === 'price' ? 1 : -1;

    const products = await Product.find(query)
      .populate('createdBy', 'username')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Product.countDocuments(query);

    res.json({
      products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('获取产品列表错误:', error);
    res.status(500).json({ message: '获取产品列表失败' });
  }
});

// 获取产品详情 (公开)
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('createdBy', 'username')
      .populate('reviews.user', 'username avatar');

    if (!product || !product.isActive) {
      return res.status(404).json({ message: '产品不存在' });
    }

    // 增加浏览次数
    product.viewCount += 1;
    await product.save();

    res.json({ product });
  } catch (error) {
    console.error('获取产品详情错误:', error);
    res.status(500).json({ message: '获取产品详情失败' });
  }
});

// 创建产品 (仅管理员)
router.post('/', adminAuth, async (req, res) => {
  try {
    const productData = {
      ...req.body,
      createdBy: req.user.userId
    };

    const product = new Product(productData);
    await product.save();

    res.status(201).json({ message: '产品创建成功', product });
  } catch (error) {
    console.error('创建产品错误:', error);
    res.status(500).json({ message: '创建产品失败' });
  }
});

// 更新产品 (仅管理员)
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ message: '产品不存在' });
    }

    res.json({ message: '产品更新成功', product });
  } catch (error) {
    console.error('更新产品错误:', error);
    res.status(500).json({ message: '更新产品失败' });
  }
});

// 删除产品 (仅管理员)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ message: '产品不存在' });
    }

    res.json({ message: '产品删除成功' });
  } catch (error) {
    console.error('删除产品错误:', error);
    res.status(500).json({ message: '删除产品失败' });
  }
});

// 产品评分 (需要登录)
router.post('/:id/review', auth, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: '产品不存在' });
    }

    // 检查用户是否已经评分
    const existingReview = product.reviews.find(
      review => review.user.toString() === req.user.userId
    );

    if (existingReview) {
      return res.status(400).json({ message: '您已经对此产品评分过了' });
    }

    // 添加评分
    product.reviews.push({
      user: req.user.userId,
      rating,
      comment
    });

    // 重新计算平均评分
    const totalRating = product.reviews.reduce((sum, review) => sum + review.rating, 0);
    product.rating = totalRating;
    product.ratingCount = product.reviews.length;

    await product.save();

    res.json({ message: '评分成功', product });
  } catch (error) {
    console.error('产品评分错误:', error);
    res.status(500).json({ message: '评分失败' });
  }
});

// 获取推荐产品
router.get('/featured/featured', async (req, res) => {
  try {
    const featuredProducts = await Product.find({ 
      isFeatured: true, 
      isActive: true 
    }).limit(6);

    res.json({ products: featuredProducts });
  } catch (error) {
    console.error('获取推荐产品错误:', error);
    res.status(500).json({ message: '获取推荐产品失败' });
  }
});

// 更新产品库存
router.put('/:id/stock', adminAuth, async (req, res) => {
  try {
    const { stock } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: '产品不存在' });
    }

    product.stock = stock;
    await product.save();

    res.json({ message: '库存更新成功', product });
  } catch (error) {
    console.error('更新库存错误:', error);
    res.status(500).json({ message: '更新库存失败' });
  }
});

// 增加产品销量
router.post('/:id/sale', adminAuth, async (req, res) => {
  try {
    const { quantity = 1 } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: '产品不存在' });
    }

    // 检查库存
    if (product.stock !== -1 && product.stock < quantity) {
      return res.status(400).json({ message: '库存不足' });
    }

    // 增加销量
    product.salesCount += quantity;

    // 更新库存
    if (product.stock !== -1) {
      product.stock -= quantity;
    }

    await product.save();

    res.json({ message: '销量更新成功', product });
  } catch (error) {
    console.error('更新销量错误:', error);
    res.status(500).json({ message: '更新销量失败' });
  }
});

module.exports = router;