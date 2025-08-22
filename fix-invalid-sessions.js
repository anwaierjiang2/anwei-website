const mongoose = require('mongoose');
const Chat = require('./server/models/Chat');
require('dotenv').config();

// 连接数据库
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/anwei', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('成功连接到数据库');
  } catch (error) {
    console.error('数据库连接失败:', error);
    process.exit(1);
  }
}

// 检查并修复无效会话
async function checkAndFixInvalidSessions() {
  try {
    console.log('开始检查无效会话...');
    
    // 查找所有会话
    const allChats = await Chat.find({});
    console.log(`总共找到 ${allChats.length} 个会话`);
    
    // 找出无效会话
    const invalidChats = allChats.filter(chat => 
      !chat.sessionId || 
      !chat.sessionId.startsWith('session_') || 
      typeof chat.sessionId !== 'string'
    );
    
    console.log(`发现 ${invalidChats.length} 个无效会话`);
    
    // 为每个无效会话生成新的有效sessionId
    const fixedChats = [];
    const skippedChats = [];
    
    for (const chat of invalidChats) {
      console.log(`修复无效会话: ID=${chat._id}, 当前sessionId=${chat.sessionId}`);
      
      try {
        // 检查必需字段
        if (!chat.user || !chat.user._id) {
          console.warn(`跳过会话 ${chat._id}: 缺少必需的user字段`);
          skippedChats.push(chat._id);
          continue;
        }
        
        // 生成新的sessionId
        const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // 更新会话
        chat.sessionId = newSessionId;
        await chat.save();
        
        fixedChats.push({
          oldSessionId: chat.sessionId,
          newSessionId,
          chatId: chat._id
        });
      } catch (error) {
        console.error(`修复会话 ${chat._id} 时出错:`, error.message);
        skippedChats.push(chat._id);
      }
    }
    
    console.log(`跳过了 ${skippedChats.length} 个无法修复的会话`);
    
    console.log(`成功修复了 ${fixedChats.length} 个无效会话`);
    
    // 输出修复详情
    if (fixedChats.length > 0) {
      console.log('修复详情:');
      fixedChats.forEach(fixed => {
        console.log(`- 会话ID: ${fixed.chatId}, 旧sessionId: ${fixed.oldSessionId}, 新sessionId: ${fixed.newSessionId}`);
      });
    }
    
    // 统计所有有效会话
    const validChatsAfterFix = await Chat.find({
      sessionId: { $exists: true },
      $expr: { $regexMatch: { input: "$sessionId", regex: /^session_/ } }
    });
    
    console.log(`修复后有效会话数量: ${validChatsAfterFix.length}`);
    
  } catch (error) {
    console.error('修复无效会话时出错:', error);
  } finally {
    // 断开数据库连接
    mongoose.disconnect();
    console.log('已断开数据库连接');
  }
}

// 主函数
async function main() {
  await connectDB();
  await checkAndFixInvalidSessions();
}

// 执行主函数
main();