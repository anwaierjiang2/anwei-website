const express = require('express');
const Order = require('../models/Order');
const { auth, adminAuth } = require('../middleware/auth');
const { sendOrderConfirmationEmail } = require('../utils/email');
const router = express.Router();

// 获取用户订单 (需要登录)
router.get('/my-orders', auth, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.userId })
      .populate('products.product')
      .sort({ createdAt: -1 });

    res.json({ orders });
  } catch (error) {
    console.error('获取用户订单错误:', error);
    res.status(500).json({ message: '获取订单失败' });
  }
});

// 获取订单详情 (需要登录)
router.get('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('products.product')
      .populate('user', 'username email');

    if (!order) {
      return res.status(404).json({ message: '订单不存在' });
    }

    // 检查权限
    if (order.user._id.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: '无权限访问此订单' });
    }

    res.json({ order });
  } catch (error) {
    console.error('获取订单详情错误:', error);
    res.status(500).json({ message: '获取订单详情失败' });
  }
});

// 创建订单 (需要登录)
router.post('/', auth, async (req, res) => {
  try {
    const { products, paymentMethod, shippingAddress, notes } = req.body;

    // 计算总金额
    const totalAmount = products.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // 显式生成订单号
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const orderNumber = `ANW${year}${month}${day}${random}`;

    const order = new Order({
      orderNumber,
      user: req.user.userId,
      products,
      totalAmount,
      paymentMethod,
      shippingAddress,
      notes
    });

    await order.save();

    // 发送订单确认邮件
    try {
      await sendOrderConfirmationEmail(req.user.email, {
        orderId: order.orderNumber,
        productName: products.map(p => p.product.name).join(', '),
        price: totalAmount,
        createdAt: order.createdAt
      });
    } catch (emailError) {
      console.error('发送订单确认邮件失败:', emailError);
    }

    res.status(201).json(order);
  } catch (error) {
    console.error('创建订单错误:', error);
    res.status(500).json({ message: '创建订单失败' });
  }
});

// 更新订单状态 (仅管理员)
router.patch('/:id/status', adminAuth, async (req, res) => {
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

// 获取所有订单 (仅管理员)
router.get('/', adminAuth, async (req, res) => {
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

// 取消订单 (需要登录)
router.patch('/:id/cancel', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: '订单不存在' });
    }

    // 检查权限
    if (order.user.toString() !== req.user.userId) {
      return res.status(403).json({ message: '无权限取消此订单' });
    }

    // 已支付的订单不能取消
    if (order.paymentStatus === 'paid') {
      return res.status(400).json({ message: '已支付订单无法取消，请联系客服' });
    }

    // 已发货或已完成的订单不能取消
    if (order.status === 'shipped' || order.status === 'delivered') {
      return res.status(400).json({ message: '订单已发货或已完成，无法取消' });
    }

    order.status = 'cancelled';
    await order.save();

    res.json({ message: '订单取消成功', order });
  } catch (error) {
    console.error('取消订单错误:', error);
    res.status(500).json({ message: '取消订单失败' });
  }
});

// 更新支付状态 (仅管理员)
router.patch('/:id/payment-status', adminAuth, async (req, res) => {
  try {
    const { paymentStatus, transactionId } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      {
        paymentStatus,
        ...(transactionId && { transactionId })
      },
      { new: true }
    ).populate('user', 'email');

    if (!order) {
      return res.status(404).json({ message: '订单不存在' });
    }

    // 如果支付成功，更新订单状态为已确认
    if (paymentStatus === 'paid') {
      order.status = 'confirmed';
      await order.save();
    }

    res.json({ message: '支付状态更新成功', order });
  } catch (error) {
    console.error('更新支付状态错误:', error);
    res.status(500).json({ message: '更新支付状态失败' });
  }
});

// 添加物流信息 (仅管理员)
router.patch('/:id/shipping', adminAuth, async (req, res) => {
  try {
    const { logisticsCompany, trackingNumber, estimatedDeliveryDate } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: '订单不存在' });
    }

    // 更新物流信息
    order.logisticsInfo = {
      company: logisticsCompany,
      trackingNumber,
      estimatedDeliveryDate
    };

    // 如果订单状态不是已发货或已完成，则更新为已发货
    if (!['shipped', 'delivered'].includes(order.status)) {
      order.status = 'shipped';
    }

    await order.save();

    res.json({ message: '物流信息更新成功', order });
  } catch (error) {
    console.error('更新物流信息错误:', error);
    res.status(500).json({ message: '更新物流信息失败' });
  }
});

// 处理支付 (需要登录)
router.post('/:id/pay', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: '订单不存在' });
    }

    // 检查权限
    if (order.user.toString() !== req.user.userId) {
      return res.status(403).json({ message: '无权限支付此订单' });
    }

    // 模拟支付处理
    // 实际项目中，这里会调用第三方支付API进行真实支付
    const paymentMethod = req.body.paymentMethod || order.paymentMethod;
    const paymentId = `PAY${Date.now()}${Math.floor(Math.random() * 10000)}`;
    
    // 更新订单支付状态
    order.paymentStatus = 'paid';
    order.status = 'confirmed';
    order.transactionId = paymentId;
    
    await order.save();

    // 返回支付结果
    res.status(200).json({
      success: true,
      orderId: order._id,
      paymentId: paymentId,
      message: '支付成功'
    });
  } catch (error) {
    console.error('支付处理错误:', error);
    res.status(500).json({
      success: false,
      message: '支付处理失败，请稍后重试'
    });
  }
});

// 删除订单 (仅管理员)
router.delete('/:id', adminAuth, async (req, res) => {
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

module.exports = router;