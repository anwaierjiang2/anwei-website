// Vercel API 入口文件
try {
  const app = require('../vercel-adapter');
  module.exports = app;
} catch (error) {
  console.error('Error loading vercel-adapter:', error);
  
  // 如果主应用加载失败，提供一个简单的备用响应
  module.exports = (req, res) => {
    res.status(200).json({
      message: 'anwei网站 API 服务正在启动中...',
      status: 'initializing',
      error: error.message
    });
  };
}