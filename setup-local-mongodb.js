// 本地 MongoDB 设置脚本
const mongoose = require('mongoose');

// 本地 MongoDB 连接字符串
const LOCAL_MONGODB_URI = 'mongodb://localhost:27017/anwei';

// 连接测试
async function testLocalConnection() {
  try {
    await mongoose.connect(LOCAL_MONGODB_URI);
    console.log('✅ 本地 MongoDB 连接成功');
    
    // 创建测试数据
    const testConnection = mongoose.connection;
    console.log('数据库名称:', testConnection.name);
    
    await mongoose.disconnect();
    console.log('✅ 连接测试完成');
  } catch (error) {
    console.error('❌ 本地 MongoDB 连接失败:', error.message);
    console.log('\n请确保：');
    console.log('1. MongoDB 服务已启动');
    console.log('2. 端口 27017 未被占用');
    console.log('3. 没有设置用户名密码认证');
  }
}

// 使用内网穿透工具暴露到公网
function setupTunnel() {
  console.log('\n🌐 内网穿透设置建议：');
  console.log('1. 使用 ngrok:');
  console.log('   npm install -g ngrok');
  console.log('   ngrok tcp 27017');
  console.log('');
  console.log('2. 使用 frp (免费)');
  console.log('3. 使用 natapp (国内服务)');
  console.log('');
  console.log('⚠️  注意：生产环境不建议暴露本地数据库');
}

console.log('🚀 本地 MongoDB 配置助手');
console.log('============================');
testLocalConnection();
setupTunnel();