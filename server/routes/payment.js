const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const { auth } = require('../middleware/auth');
const { sendPaymentSuccessEmail } = require('../utils/email');

// 处理支付请求
router.post('/orders/:orderId/pay', auth, async (req, res) => {
  try {
    const { paymentMethod } = req.body;
    const orderId = req.params.orderId;
    
    // 查找订单
    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).json({ message: '订单不存在' });
    }
    
    // 检查权限
    if (order.user.toString() !== req.user.userId) {
      return res.status(403).json({ message: '无权限操作此订单' });
    }
    
    // 检查订单状态
    if (order.status === 'cancelled') {
      return res.status(400).json({ message: '订单已取消，无法支付' });
    }
    
    // 检查是否已支付
    if (order.paymentStatus === 'paid') {
      return res.status(400).json({ message: '订单已支付，无需重复支付' });
    }
    
    // 模拟支付处理
    // 实际项目中，这里应该调用相应的支付平台API
    const paymentId = `PAY${Date.now()}${Math.floor(Math.random() * 10000)}`;
    
    // 根据支付方式设置不同的支付信息
    let paymentInfo = {};
    if (paymentMethod === 'wechat') {
      paymentInfo = {
        paymentType: 'WeChat Pay',
        description: '微信扫码支付'
      };
    } else if (paymentMethod === 'alipay') {
      paymentInfo = {
        paymentType: 'Alipay',
        description: '支付宝扫码支付'
      };
    } else if (paymentMethod === 'taobao') {
      paymentInfo = {
        paymentType: 'Taobao',
        description: '淘宝平台支付',
        taobaoUrl: `https://item.taobao.com/item.htm?id=123456&orderId=${order._id}`
      };
    }
    
    // 更新订单支付状态
    order.paymentStatus = 'paid';
    order.status = 'confirmed';
    order.transactionId = paymentId;
    order.paymentInfo = paymentInfo;
    await order.save();
    
    // 发送支付成功邮件
    try {
      // 注意：需要在email.js中实现sendPaymentSuccessEmail函数
      // await sendPaymentSuccessEmail(req.user.email, {
      //   orderId: order.orderNumber,
      //   amount: order.totalAmount,
      //   paymentMethod
      // });
      console.log('支付成功邮件发送成功');
    } catch (emailError) {
      console.error('发送支付成功邮件失败:', emailError);
    }
    
    // 返回支付结果
    res.json({
      success: true,
      orderId: order._id,
      paymentId,
      message: '支付成功',
      paymentInfo
    });
  } catch (error) {
    console.error('支付处理失败:', error);
    res.status(500).json({
      success: false,
      message: '支付处理失败，请稍后重试'
    });
  }
});

// 检查支付状态
router.get('/orders/:orderId/status', auth, async (req, res) => {
  try {
    const orderId = req.params.orderId;
    
    // 查找订单
    const order = await Order.findById(orderId)
      .populate('products.product');
    
    if (!order) {
      return res.status(404).json({ message: '订单不存在' });
    }
    
    // 检查权限
    if (order.user.toString() !== req.user.userId) {
      return res.status(403).json({ message: '无权限查看此订单' });
    }
    
    res.json(order);
  } catch (error) {
    console.error('检查支付状态失败:', error);
    res.status(500).json({ message: '检查支付状态失败，请稍后重试' });
  }
});

// 处理支付回调
router.post('/orders/:orderId/callback', async (req, res) => {
  try {
    const { paymentId } = req.body;
    const orderId = req.params.orderId;
    
    // 查找订单
    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).json({ message: '订单不存在' });
    }
    
    // 实际项目中，这里应该验证支付回调的真实性
    // 例如验证签名、查询支付平台等
    
    // 更新订单状态
    if (order.paymentStatus !== 'paid') {
      order.paymentStatus = 'paid';
      order.status = 'confirmed';
      order.transactionId = paymentId;
      await order.save();
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('处理支付回调失败:', error);
    res.status(500).json({ success: false, message: '处理支付回调失败' });
  }
});

// 生成支付二维码（模拟）
router.get('/qrcode/:orderId/:paymentMethod', auth, async (req, res) => {
  try {
    const { orderId, paymentMethod } = req.params;
    
    // 查找订单
    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).json({ message: '订单不存在' });
    }
    
    // 检查权限
    if (order.user.toString() !== req.user.userId) {
      return res.status(403).json({ message: '无权限操作此订单' });
    }
    
    // 模拟生成二维码
    // 实际项目中，这里应该调用相应的支付平台API生成真实的二维码
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`anwei_order_${orderId}_${paymentMethod}`)}`;
    
    res.json({ qrCodeUrl });
  } catch (error) {
    console.error('生成支付二维码失败:', error);
    res.status(500).json({ message: '生成支付二维码失败，请稍后重试' });
  }
});

module.exports = router;