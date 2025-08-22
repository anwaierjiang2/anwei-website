const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
// 使用固定端口，确保前后端能够正确通信
const PORT = 5000;

// 配置 trust proxy，解决X-Forwarded-For头问题
app.set('trust proxy', 1);

// 中间件
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 提供静态文件服务
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// 提供二维码静态资源服务
app.use('/qrcodes', express.static(path.join(__dirname, 'public', 'qrcodes')));

// 根据环境设置限流策略 - 只在生产环境启用
const isProduction = process.env.NODE_ENV === 'production';

// 数据库连接
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/anwei', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB连接成功'))
.catch(err => console.error('MongoDB连接失败:', err));

// 路由
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/tools', require('./routes/tools'));
app.use('/api/products', require('./routes/products'));
app.use('/api/productUpload', require('./routes/productUpload'));
app.use('/api/toolUpload', require('./routes/toolUpload'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/feedback', require('./routes/feedback'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/contact', require('./routes/contact'));
app.use('/api', require('./routes/payment'));

// 仅在生产环境下启用限流中间件
if (isProduction) {
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
  res.json({ status: 'OK', message: 'anwei网站服务器运行正常' });
});

// SPA路由支持 - 开发环境下的处理
const isDevelopment = process.env.NODE_ENV !== 'production';

// 静态文件服务 - 在生产环境下提供React构建后的文件
if (!isDevelopment) {
  const clientBuildPath = path.join(__dirname, '../client/build');
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

// 启动服务器
const server = app.listen(PORT, () => {
  const actualPort = server.address().port;
  console.log(`🚀 anwei网站服务器运行在端口 ${actualPort}`);
  console.log(`📧 管理员邮箱: ${process.env.ADMIN_EMAIL || '13779447487@163.com'}`);
});

// WebSocket 集成
const io = require('socket.io')(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// 用户会话映射
const userSockets = new Map();

// 连接WebSocket
io.on('connection', (socket) => {
  console.log('新的WebSocket连接:', socket.id);

  // 用户登录后关联socket - 支持auth和user_login两种事件，确保兼容性
  socket.on('auth', (data) => {
    if (data && data.userId) {
      userSockets.set(data.userId, socket.id);
      console.log(`用户 ${data.userId} 关联到socket ${socket.id}`);
      // 验证token
      if (data.token) {
        try {
          const jwt = require('jsonwebtoken');
          const decoded = jwt.verify(data.token, process.env.JWT_SECRET);
          // 这里可以添加更多的验证逻辑
        } catch (error) {
          console.error('Socket token验证失败:', error);
          // 可以选择断开连接或不执行任何操作
        }
      }
    }
  });
  
  // 兼容旧版本的user_login事件
  socket.on('user_login', (data) => {
    // 直接调用auth处理逻辑
    if (data && data.userId) {
      userSockets.set(data.userId, socket.id);
      console.log(`用户 ${data.userId} 关联到socket ${socket.id}`);
      // 验证token
      if (data.token) {
        try {
          const jwt = require('jsonwebtoken');
          const decoded = jwt.verify(data.token, process.env.JWT_SECRET);
          // 这里可以添加更多的验证逻辑
        } catch (error) {
          console.error('Socket token验证失败:', error);
          // 可以选择断开连接或不执行任何操作
        }
      }
    }
  });

  // 发送消息事件
  socket.on('send_message', async (data) => {
    try {
      const { sessionId, content, sender, receiverId } = data;
      const Chat = require('./models/Chat');
      const User = require('./models/User');

      // 保存消息到数据库
      const chat = await Chat.findOne({ sessionId });
      if (chat) {
        // 添加消息
        chat.messages.push({
          sender,
          content,
          read: false
        });
        await chat.save();

        // 通知接收者
        if (receiverId) {
          const receiverSocketId = userSockets.get(receiverId);
          if (receiverSocketId) {
            io.to(receiverSocketId).emit('new_message', {
              sessionId,
              message: chat.messages[chat.messages.length - 1],
              chatId: chat._id
            });
          }
        }

        // 发送确认
        socket.emit('message_sent', {
          success: true,
          messageId: chat.messages[chat.messages.length - 1]._id
        });
      }
    } catch (error) {
      console.error('发送消息错误:', error);
      socket.emit('message_error', { error: '消息发送失败' });
    }
  });

  // 断开连接
  socket.on('disconnect', () => {
    console.log('WebSocket断开连接:', socket.id);
    // 移除用户关联
    for (const [userId, socketId] of userSockets.entries()) {
      if (socketId === socket.id) {
        userSockets.delete(userId);
        console.log(`用户 ${userId} 断开连接`);
        break;
      }
    }
  });
});

// 导出io实例，以便其他地方使用
module.exports = io;