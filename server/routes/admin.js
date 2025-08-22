const express = require('express');
const mongoose = require('mongoose');
const { adminAuth } = require('../middleware/auth');
const User = require('../models/User');
const Tool = require('../models/Tool');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Feedback = require('../models/Feedback');
const upload = require('../utils/upload');
const { sendAdminNotificationEmail } = require('../utils/email');
const router = express.Router();

// 获取仪表板数据
router.get('/dashboard', adminAuth, async (req, res) => {
  try {
    // 统计数据
    const userCount = await User.countDocuments();
    const toolCount = await Tool.countDocuments();
    const productCount = await Product.countDocuments();
    const orderCount = await Order.countDocuments();
    const feedbackCount = await Feedback.countDocuments();

    // 最近订单
    const recentOrders = await Order.find()
      .populate('user', 'username email')
      .sort({ createdAt: -1 })
      .limit(5);

    // 最近反馈
    const recentFeedback = await Feedback.find()
      .sort({ createdAt: -1 })
      .limit(5);

    // 用户增长趋势 (最近7天)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const userGrowth = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    res.json({
      stats: {
        userCount,
        toolCount,
        productCount,
        orderCount,
        feedbackCount
      },
      recentOrders,
      recentFeedback,
      userGrowth
    });
  } catch (error) {
    console.error('获取仪表板数据错误:', error);
    res.status(500).json({ message: '获取仪表板数据失败' });
  }
});

// 获取用户统计
router.get('/users/stats', adminAuth, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const adminUsers = await User.countDocuments({ role: 'admin' });

    // 用户角色分布
    const roleDistribution = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      totalUsers,
      activeUsers,
      adminUsers,
      roleDistribution
    });
  } catch (error) {
    console.error('获取用户统计错误:', error);
    res.status(500).json({ message: '获取用户统计失败' });
  }
});

// 获取工具统计
router.get('/tools/stats', adminAuth, async (req, res) => {
  try {
    const totalTools = await Tool.countDocuments();
    const activeTools = await Tool.countDocuments({ isActive: true });
    const featuredTools = await Tool.countDocuments({ isFeatured: true });

    // 分类分布
    const categoryDistribution = await Tool.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);

    // 最受欢迎的工具
    const popularTools = await Tool.find()
      .sort({ viewCount: -1 })
      .limit(10)
      .select('name viewCount clickCount');

    res.json({
      totalTools,
      activeTools,
      featuredTools,
      categoryDistribution,
      popularTools
    });
  } catch (error) {
    console.error('获取工具统计错误:', error);
    res.status(500).json({ message: '获取工具统计失败' });
  }
});

// 获取产品统计
router.get('/products/stats', adminAuth, async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments();
    const activeProducts = await Product.countDocuments({ isActive: true });
    const featuredProducts = await Product.countDocuments({ isFeatured: true });

    // 分类分布
    const categoryDistribution = await Product.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);

    // 最受欢迎的产品
    const popularProducts = await Product.find()
      .sort({ viewCount: -1 })
      .limit(10)
      .select('name viewCount salesCount price');

    res.json({
      totalProducts,
      activeProducts,
      featuredProducts,
      categoryDistribution,
      popularProducts
    });
  } catch (error) {
    console.error('获取产品统计错误:', error);
    res.status(500).json({ message: '获取产品统计失败' });
  }
});

// 获取订单统计
router.get('/orders/stats', adminAuth, async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({ status: 'pending' });
    const completedOrders = await Order.countDocuments({ status: 'delivered' });

    // 订单状态分布
    const statusDistribution = await Order.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // 支付方式分布
    const paymentDistribution = await Order.aggregate([
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 }
        }
      }
    ]);

    // 最近7天订单趋势
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const orderTrend = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    res.json({
      totalOrders,
      pendingOrders,
      completedOrders,
      statusDistribution,
      paymentDistribution,
      orderTrend
    });
  } catch (error) {
    console.error('获取订单统计错误:', error);
    res.status(500).json({ message: '获取订单统计失败' });
  }
});

// 获取反馈统计
router.get('/feedback/stats', adminAuth, async (req, res) => {
  try {
    const totalFeedback = await Feedback.countDocuments();
    const pendingFeedback = await Feedback.countDocuments({ status: 'pending' });
    const processingFeedback = await Feedback.countDocuments({ status: 'processing' });
    const resolvedFeedback = await Feedback.countDocuments({ status: 'resolved' });
    const closedFeedback = await Feedback.countDocuments({ status: 'closed' });

    // 反馈类型分布
    const typeAggregation = await Feedback.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      }
    ]);

    // 转换为前端期望的格式
    const bugCount = typeAggregation.find(item => item._id === 'bug')?.count || 0;
    const featureCount = typeAggregation.find(item => item._id === 'feature')?.count || 0;
    const suggestionCount = typeAggregation.find(item => item._id === 'suggestion')?.count || 0;
    const complaintCount = typeAggregation.find(item => item._id === 'complaint')?.count || 0;
    const otherCount = typeAggregation.find(item => item._id === 'other')?.count || 0;

    // 获取最近7天的每日反馈数据
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const dailyFeedback = [];
    const dateFormat = { year: 'numeric', month: '2-digit', day: '2-digit' };
    
    // 初始化最近7天的数据为0
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString('zh-CN', dateFormat);
      dailyFeedback.push({ date: dateStr, count: 0 });
    }
    
    // 查询实际数据并更新
    const dbDailyFeedback = await Feedback.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);
    
    // 更新实际数据
    dbDailyFeedback.forEach(item => {
      const dateStr = new Date(item._id).toLocaleDateString('zh-CN', dateFormat);
      const index = dailyFeedback.findIndex(d => d.date === dateStr);
      if (index !== -1) {
        dailyFeedback[index].count = item.count;
      }
    });

    res.json({
      totalFeedback,
      pendingFeedback,
      processingFeedback,
      resolvedFeedback,
      closedFeedback,
      dailyFeedback,
      bugCount,
      featureCount,
      suggestionCount,
      complaintCount,
      otherCount
    });
  } catch (error) {
    console.error('获取反馈统计错误:', error);
    res.status(500).json({ message: '获取反馈统计失败' });
  }
});

// 工具管理相关API

// 添加工具
router.post('/tools', adminAuth, async (req, res) => {
  try {
    const { name, description, category, url, logo, isActive, createdBy } = req.body;
    
    // 验证必填字段
    if (!name || !description || !category || !url) {
      return res.status(400).json({ message: '工具名称、描述、分类和URL是必填项' });
    }
    
    // 确保createdBy是有效的，优先使用当前登录用户的ID
    let creatorId = req.user.userId; // 使用当前登录管理员的ID作为默认值
    
    // 如果前端提供了createdBy
    if (createdBy) {
      // 检查createdBy是否是有效的ObjectId
      if (mongoose.isValidObjectId(createdBy)) {
        creatorId = createdBy;
      } else if (typeof createdBy === 'string') {
        // 如果createdBy是字符串，尝试将其作为email查找对应的用户
        try {
          const user = await User.findOne({ email: createdBy });
          if (user) {
            creatorId = user._id;
          } else {
            console.warn('未找到与邮箱对应的用户，使用默认的creatorId');
          }
        } catch (userFindError) {
          console.error('查找用户时出错:', userFindError);
        }
      }
    }
    
    const newTool = new Tool({
      name,
      description,
      category,
      url,
      logo: logo || '',
      isActive: isActive !== undefined ? isActive : true,
      createdBy: creatorId
    });
    
    await newTool.save();
    res.status(201).json({ message: '工具添加成功', tool: newTool });
  } catch (error) {
    console.error('添加工具错误:', error);
    res.status(500).json({ message: '添加工具失败' });
  }
});

// 获取所有工具（包括非活跃工具）
router.get('/tools', adminAuth, async (req, res) => {
  try {
    const { category, search, page = 1, limit = 20 } = req.query;
    const query = {};

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

// 更新工具状态
router.patch('/tools/:id/status', adminAuth, async (req, res) => {
  try {
    const { isActive } = req.body;
    const tool = await Tool.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true }
    );

    if (!tool) {
      return res.status(404).json({ message: '工具不存在' });
    }

    res.json({ message: '工具状态更新成功', tool });
  } catch (error) {
    console.error('更新工具状态错误:', error);
    res.status(500).json({ message: '更新工具状态失败' });
  }
});

// 工具图片上传API
router.post('/tools/upload-image', adminAuth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: '未上传图片文件' });
    }

    // 构建图片URL路径
    const imageUrl = `${req.protocol}://${req.get('host')}/uploads/tool_logos/${req.file.filename}`;

    res.json({
      message: '图片上传成功',
      imageUrl: imageUrl
    });
  } catch (error) {
    console.error('上传图片错误:', error);
    res.status(500).json({ message: '上传图片失败', error: error.message });
  }
});

// 全面更新工具信息
router.put('/tools/:id', adminAuth, async (req, res) => {
  try {
    const { name, description, category, url, logo, isActive, isFeatured } = req.body;
    
    // 验证必填字段
    if (!name || !description || !category || !url) {
      return res.status(400).json({ message: '工具名称、描述、分类和URL是必填项' });
    }
    
    // 准备更新数据
    const updateData = {
      name,
      description,
      category,
      url,
      logo: logo || '',
      isActive: isActive !== undefined ? isActive : true,
      updatedAt: Date.now()
    };
    
    // 如果提供了isFeatured字段，添加到更新数据中
    if (isFeatured !== undefined) {
      updateData.isFeatured = isFeatured;
    }
    
    const tool = await Tool.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
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

// 删除工具
router.delete('/tools/:id', adminAuth, async (req, res) => {
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

// 系统设置 - 获取配置
router.get('/settings', adminAuth, async (req, res) => {
  try {
    // 返回系统配置信息
    const systemSettings = {
      siteDescription: process.env.SITE_DESCRIPTION || '安威工具平台 - 提供各种实用工具和服务',
      maintenanceMode: process.env.MAINTENANCE_MODE === 'true',
      notificationSettings: {
        emailEnabled: true,
        pushEnabled: true
      },
      securitySettings: {
        passwordPolicy: {
          minLength: 8,
          requireUppercase: true,
          requireLowercase: true,
          requireNumber: true,
          requireSpecialChar: false
        },
        twoFactorEnabled: false,
        rateLimitSettings: {
          enabled: true,
          maxRequests: 100,
          timeWindow: 60
        }
      },
      performanceSettings: {
        maxUploadSize: 50,
        cacheDuration: 3600
      },
      systemInfo: {
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        uptime: process.uptime(),
        memory: process.memoryUsage()
      }
    };
    
    res.json({
      success: true,
      data: systemSettings
    });
  } catch (error) {
    console.error('获取系统设置错误:', error);
    res.status(500).json({
      success: false,
      message: '获取系统设置失败'
    });
  }
});

// 系统设置 - 保存配置
router.put('/settings', adminAuth, async (req, res) => {
  try {
    const settingsData = req.body;
    
    // 这里应该将设置保存到数据库或配置文件中
    // 当前仅作为模拟实现
    console.log('保存系统设置:', settingsData);
    
    // 对于生产环境，这里应该有实际的保存逻辑
    // 例如保存到数据库或环境变量文件
    
    // 模拟保存成功
    res.json({
      success: true,
      message: '系统设置保存成功',
      data: settingsData
    });
  } catch (error) {
    console.error('保存系统设置错误:', error);
    res.status(500).json({
      success: false,
      message: '保存系统设置失败'
    });
  }
});

// 获取系统信息
router.get('/system-info', adminAuth, async (req, res) => {
  try {
    const systemInfo = {
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      serverUptime: Math.floor(process.uptime() / 60) + ' 分钟',
      memoryUsage: `${Math.round(process.memoryUsage().rss / 1024 / 1024)} MB`,
      nodeVersion: process.version,
      timestamp: new Date().toISOString()
    };
    
    res.json({
      success: true,
      data: systemInfo
    });
  } catch (error) {
    console.error('获取系统信息错误:', error);
    res.status(500).json({
      success: false,
      message: '获取系统信息失败'
    });
  }
});

// 获取备份列表
router.get('/backups', adminAuth, async (req, res) => {
  try {
    // 模拟备份数据
    const backups = [
      {
        id: '1',
        name: '系统备份-20231215',
        createdAt: '2023-12-15T08:30:00Z',
        size: '128 MB',
        status: 'completed'
      },
      {
        id: '2',
        name: '系统备份-20231210',
        createdAt: '2023-12-10T14:45:00Z',
        size: '118 MB',
        status: 'completed'
      },
      {
        id: '3',
        name: '系统备份-20231205',
        createdAt: '2023-12-05T10:20:00Z',
        size: '135 MB',
        status: 'completed'
      }
    ];
    
    res.json({
      success: true,
      data: backups
    });
  } catch (error) {
    console.error('获取备份列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取备份列表失败'
    });
  }
});

// 创建备份
router.post('/backups/create', adminAuth, async (req, res) => {
  try {
    // 模拟创建备份
    const backupName = `系统备份-${new Date().toISOString().split('T')[0]}-${Date.now()}`;
    
    // 模拟备份过程
    setTimeout(() => {
      res.json({
        success: true,
        message: '备份创建成功',
        data: {
          id: Date.now().toString(),
          name: backupName,
          createdAt: new Date().toISOString(),
          size: `${Math.floor(Math.random() * 50) + 100} MB`,
          status: 'completed'
        }
      });
    }, 1000);
  } catch (error) {
    console.error('创建备份错误:', error);
    res.status(500).json({
      success: false,
      message: '创建备份失败'
    });
  }
});

// 恢复备份
router.post('/backups/:id/restore', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // 模拟恢复备份
    setTimeout(() => {
      res.json({
        success: true,
        message: `备份 ID: ${id} 恢复成功`
      });
    }, 1500);
  } catch (error) {
    console.error('恢复备份错误:', error);
    res.status(500).json({
      success: false,
      message: '恢复备份失败'
    });
  }
});

// 删除备份
router.delete('/backups/:id/delete', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // 模拟删除备份
    setTimeout(() => {
      res.json({
        success: true,
        message: `备份 ID: ${id} 删除成功`
      });
    }, 500);
  } catch (error) {
    console.error('删除备份错误:', error);
    res.status(500).json({
      success: false,
      message: '删除备份失败'
    });
  }
});

// 订单管理相关API

// 获取所有订单（管理员）
router.get('/orders', adminAuth, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = {};

    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;
    const orders = await Order.find(query)
      .populate('user', 'username email')
      .populate('products.product', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(query);

    res.json({
      orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('获取订单列表错误:', error);
    res.status(500).json({ message: '获取订单列表失败' });
  }
});

// 获取订单详情（管理员）
router.get('/orders/:id', adminAuth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('products.product')
      .populate('user', 'username email');

    if (!order) {
      return res.status(404).json({ message: '订单不存在' });
    }

    res.json({ order });
  } catch (error) {
    console.error('获取订单详情错误:', error);
    res.status(500).json({ message: '获取订单详情失败' });
  }
});

// 添加订单（管理员）
router.post('/orders', adminAuth, async (req, res) => {
  try {
    const { userName, email, shippingAddress, paymentMethod, status, items, totalAmount } = req.body;

    // 计算总金额
    const calculatedTotalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // 显式生成订单号
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const orderNumber = `ANW${year}${month}${day}${random}`;

    const order = new Order({
      orderNumber,
      user: null, // 暂时不关联用户
      userName,
      email,
      products: items.map(item => ({
        product: null, // 暂时不关联产品
        productName: item.productName,
        quantity: item.quantity,
        price: item.price
      })),
      totalAmount: totalAmount || calculatedTotalAmount,
      paymentMethod,
      status: status || 'pending',
      shippingAddress
    });

    await order.save();
    res.status(201).json(order);
  } catch (error) {
    console.error('创建订单错误:', error);
    res.status(500).json({ message: '创建订单失败' });
  }
});

// 更新订单状态（管理员）
router.patch('/orders/:id/status', adminAuth, async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('user', 'email');

    if (!order) {
      return res.status(404).json({ message: '订单不存在' });
    }

    res.json({ message: '订单状态更新成功', order });
  } catch (error) {
    console.error('更新订单状态错误:', error);
    res.status(500).json({ message: '更新订单状态失败' });
  }
});

// 删除订单（管理员）
router.delete('/orders/:id', adminAuth, async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: '订单不存在' });
    }
    
    res.json({ message: '订单删除成功' });
  } catch (error) {
    console.error('删除订单错误:', error);
    res.status(500).json({ message: '删除订单失败' });
  }
});

// 导出订单（管理员）
router.post('/orders/export', adminAuth, async (req, res) => {
  try {
    const { format = 'csv' } = req.body;
    let orders = [];
    
    // 如果请求体中提供了订单列表，则使用这些订单
    if (req.body.orders && req.body.orders.length > 0) {
      const orderIds = req.body.orders.map(order => order._id);
      orders = await Order.find({ _id: { $in: orderIds } })
        .populate('user', 'username email')
        .populate('products.product', 'name');
    } else {
      // 否则导出所有订单
      orders = await Order.find({})
        .populate('user', 'username email')
        .populate('products.product', 'name');
    }
    
    if (format === 'csv') {
      // 生成CSV文件
      let csvContent = '订单号,用户名,邮箱,总金额,状态,支付方式,下单时间,配送地址\n';
      
      orders.forEach(order => {
        const shippingAddress = order.shippingAddress ? 
          `${order.shippingAddress.name || ''},${order.shippingAddress.phone || ''},${order.shippingAddress.address || ''},${order.shippingAddress.city || ''},${order.shippingAddress.postalCode || ''}` : 
          '';
        
        csvContent += `${order.orderNumber},${order.user?.username || order.userName || ''},${order.user?.email || order.email || ''},${order.totalAmount},${order.status},${order.paymentMethod},${order.createdAt.toLocaleString('zh-CN')},"${shippingAddress}"\n`;
      });
      
      // 设置响应头，返回CSV文件
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="订单导出_${new Date().toLocaleDateString('zh-CN')}.csv"`);
      res.status(200).send(csvContent);
    } else {
      // 目前只支持CSV格式
      res.status(400).json({ message: '不支持的导出格式' });
    }
  } catch (error) {
    console.error('导出订单错误:', error);
    res.status(500).json({ message: '导出订单失败' });
  }
});

// 获取所有反馈（管理员）
router.get('/feedback', adminAuth, async (req, res) => {
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

// 回复反馈
router.post('/feedback/:id/reply', adminAuth, async (req, res) => {
  try {
    const { reply } = req.body;
    const feedback = await Feedback.findById(req.params.id);

    if (!feedback) {
      return res.status(404).json({ message: '反馈不存在' });
    }

    feedback.reply = reply;
    feedback.status = 'resolved';
    feedback.updatedAt = new Date();

    await feedback.save();
    
    // 为下一阶段实现邮件通知预留位置
    console.log('准备发送反馈回复通知给用户:', feedback.email);
    
    res.json({ message: '回复成功', feedback });
  } catch (error) {
    console.error('回复反馈错误:', error);
    res.status(500).json({ message: '回复失败' });
  }
});

// 更新反馈状态（管理员）
router.patch('/feedback/:id/status', adminAuth, async (req, res) => {
  try {
    const { status } = req.body;
    const feedback = await Feedback.findByIdAndUpdate(
      req.params.id,
      { status, updatedAt: new Date() },
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

// 导出反馈（管理员）
router.post('/feedback/export', adminAuth, async (req, res) => {
  try {
    const { format = 'csv' } = req.body;
    let feedback = [];
    
    // 获取所有反馈
    feedback = await Feedback.find({})
      .populate('user', 'username email');
    
    if (format === 'csv') {
      // 生成CSV文件
      let csvContent = 'ID,用户名,邮箱,反馈内容,评分,状态,类型,提交时间,更新时间,回复\n';
      
      feedback.forEach(item => {
        // 使用message字段，如果没有则使用content字段
        const content = (item.message || item.content || '').replace(/"/g, '""'); // 转义双引号
        const reply = item.reply ? item.reply.replace(/"/g, '""') : '';
        
        csvContent += `${item._id},${item.user?.username || item.name || ''},${item.user?.email || item.email || ''},"${content}",${item.rating || 0},${item.status},${item.type},${item.createdAt.toLocaleString('zh-CN')},${item.updatedAt.toLocaleString('zh-CN')},"${reply}"\n`;
      });
      
      // 设置响应头，返回CSV文件
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="反馈导出_${new Date().toLocaleDateString('zh-CN')}.csv"`);
      res.status(200).send(csvContent);
    } else {
      // 目前只支持CSV格式
      res.status(400).json({ message: '不支持的导出格式' });
    }
  } catch (error) {
    console.error('导出反馈错误:', error);
    res.status(500).json({ message: '导出反馈失败' });
  }
});

module.exports = router;