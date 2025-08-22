const mongoose = require('mongoose');
const Chat = require('./server/models/Chat');

// MongoDB连接字符串
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/anwei';

// 要检查的会话ID
const SESSION_ID_TO_CHECK = 'session_1757980345586_n4t721sh';

// 连接到MongoDB并检查会话
async function checkSession() {
  try {
    // 连接数据库
    await mongoose.connect(MONGODB_URI);
    console.log('成功连接到MongoDB数据库');

    // 查询指定会话ID的会话
    console.log(`\n查询会话ID: ${SESSION_ID_TO_CHECK}`);
    const session = await Chat.findOne({ sessionId: SESSION_ID_TO_CHECK });
    
    if (session) {
      console.log('找到会话:');
      console.log(`- ID: ${session._id}`);
      console.log(`- sessionId: ${session.sessionId}`);
      console.log(`- 用户ID: ${session.user}`);
      console.log(`- 管理员ID: ${session.admin || '未分配'}`);
      console.log(`- 状态: ${session.status}`);
      console.log(`- 创建时间: ${new Date(session.createdAt).toLocaleString()}`);
      console.log(`- 消息数量: ${session.messages.length}`);
    } else {
      console.log(`未找到会话ID: ${SESSION_ID_TO_CHECK}`);
      
      // 尝试查询最近的会话，看看格式是否匹配
      console.log('\n查询最近的5个会话:');
      const recentSessions = await Chat.find({}).sort({ createdAt: -1 }).limit(5);
      recentSessions.forEach((sess, index) => {
        console.log(`\n会话 ${index + 1}:`);
        console.log(`- ID: ${sess._id}`);
        console.log(`- sessionId: ${sess.sessionId}`);
        console.log(`- 用户ID: ${sess.user}`);
        console.log(`- 管理员ID: ${sess.admin || '未分配'}`);
        console.log(`- 状态: ${sess.status}`);
      });
    }

    // 关闭连接
    await mongoose.disconnect();
    console.log('\n已关闭MongoDB连接');
  } catch (error) {
    console.error('发生错误:', error);
    // 确保连接被关闭
    await mongoose.disconnect().catch(() => {});
  }
}

// 运行检查
checkSession();