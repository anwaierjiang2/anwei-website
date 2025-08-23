// Vercel适配器 - 解决Vercel平台特定的配置问题
// @vercel/runtime: nodejs18.x

// 导出Express应用，供Vercel的无服务器函数使用
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
// 使用平台提供的端口，而不是硬编码的端口
const PORT = process.env.PORT || 5000;

// 配置 trust proxy，解决X-Forwarded-For头问题
app.set('trust proxy', 1);

// 中间件
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 提供静态文件服务
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'server', 'uploads')));
// 提供二维码静态资源服务
app.use('/qrcodes', express.static(path.join(__dirname, 'server', 'public', 'qrcodes')));

// 根据环境设置限流策略 - 只在生产环境启用
const isProduction = process.env.NODE_ENV === 'production';

// 数据库连接
let isConnected = false;
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/anwei', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000, // 5秒超时
  socketTimeoutMS: 45000, // 45秒socket超时
})
.then(() => {
  console.log('MongoDB连接成功');
  isConnected = true;
})
.catch(err => {
  console.error('MongoDB连接失败:', err.message);
  console.log('应用将以只读模式运行');
  isConnected = false;
});

// 路由
app.use('/api/auth', require('./server/routes/auth'));
app.use('/api/users', require('./server/routes/users'));
app.use('/api/tools', require('./server/routes/tools'));
app.use('/api/products', require('./server/routes/products'));
app.use('/api/productUpload', require('./server/routes/productUpload'));
app.use('/api/toolUpload', require('./server/routes/toolUpload'));
app.use('/api/orders', require('./server/routes/orders'));
app.use('/api/chat', require('./server/routes/chat'));
app.use('/api/feedback', require('./server/routes/feedback'));
app.use('/api/admin', require('./server/routes/admin'));
app.use('/api/contact', require('./server/routes/contact'));
app.use('/api', require('./server/routes/payment'));

// 仅在生产环境下启用限流中间件
if (isProduction) {
  const rateLimit = require('express-rate-limit');
  
  // 全局API限流
  const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 300, // 生产环境300个请求
    message: '请求过于频繁，请稍后再试'
  });

  // 认证路由限流
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 100, // 生产环境100个请求
    message: '认证请求过于频繁，请稍后再试'
  });

  // 应用限流中间件 - 注意中间件应用顺序
  app.use('/api/auth/', authLimiter);
  app.use('/api/', globalLimiter);
} else {
  console.log('开发环境下，已禁用所有限流中间件');
}

// 健康检查
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'anwei网站服务器运行正常',
    database: isConnected ? '已连接' : '未连接',
    timestamp: new Date().toISOString()
  });
});

// 根路径检查
app.get('/', (req, res) => {
  res.json({ 
    message: '欢迎访问 anwei 网站 API',
    status: 'running',
    database: isConnected ? '已连接' : '未连接'
  });
});

// 静态文件服务 - 在生产环境下提供React构建后的文件
if (process.env.NODE_ENV === 'production') {
  const clientBuildPath = path.join(__dirname, 'client', 'build');
  app.use(express.static(clientBuildPath));
  
  // SPA fallback路由
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
} else {
  // 开发环境下的API 404处理
  app.use('/api/*', (req, res) => {
    res.status(404).json({ message: '接口不存在' });
  });
}

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: '服务器内部错误' });
});

// 注意：在Vercel环境中，WebSocket不被支持，因此我们不启动WebSocket
// 仅在非Vercel环境中启动服务器监听
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  const server = app.listen(PORT, () => {
    const actualPort = server.address().port;
    console.log(`🚀 anwei网站服务器运行在端口 ${actualPort}`);
    console.log(`📧 管理员邮箱: ${process.env.ADMIN_EMAIL || '13779447487@163.com'}`);
  });
}

// 导出app，供Vercel的无服务器函数使用
module.exports = app;

// 注意：在Vercel环境中，WebSocket功能将不可用
// 如果需要实时通信功能，建议使用第三方服务如Pusher或Firebase