const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: '访问被拒绝，请先登录' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ message: '用户不存在' });
    }

    if (!user.isActive) {
      return res.status(401).json({ message: '账户已被禁用' });
    }

    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: '登录已过期，请重新登录' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: '无效的登录凭证' });
    }
    
    console.error('认证中间件错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 管理员权限检查
const adminAuth = async (req, res, next) => {
  try {
    await auth(req, res, async () => {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: '需要管理员权限' });
      }
      next();
    });
  } catch (error) {
    // auth中间件已经处理了错误
  }
};

module.exports = { auth, adminAuth }; 