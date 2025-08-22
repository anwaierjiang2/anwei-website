const mongoose = require('mongoose');
const Chat = require('./server/models/Chat');
const User = require('./server/models/User');
require('dotenv').config();

// 要检查的会话ID
const sessionIdToCheck = 'session_1755860884109_x29gnthio';

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

// 检查会话权限
async function checkSessionPermission() {
  try {
    // 查询会话详情
    const chatSession = await Chat.findOne({ sessionId: sessionIdToCheck })
      .populate('user', 'username email role')
      .populate('admin', 'username email role')
      .lean();
    
    if (!chatSession) {
      console.log(`未找到会话: ${sessionIdToCheck}`);
      return;
    }
    
    console.log('\n=== 会话详情 ===');
    console.log(`会话ID: ${chatSession.sessionId}`);
    console.log(`会话状态: ${chatSession.status}`);
    console.log(`创建时间: ${chatSession.createdAt}`);
    console.log(`最近更新: ${chatSession.updatedAt}`);
    
    console.log('\n=== 用户信息 ===');
    if (chatSession.user) {
      console.log(`用户ID: ${chatSession.user._id}`);
      console.log(`用户名: ${chatSession.user.username}`);
      console.log(`用户邮箱: ${chatSession.user.email}`);
      console.log(`用户角色: ${chatSession.user.role}`);
    } else {
      console.log('无关联用户');
    }
    
    console.log('\n=== 管理员信息 ===');
    if (chatSession.admin) {
      console.log(`管理员ID: ${chatSession.admin._id}`);
      console.log(`管理员用户名: ${chatSession.admin.username}`);
      console.log(`管理员邮箱: ${chatSession.admin.email}`);
      console.log(`管理员角色: ${chatSession.admin.role}`);
    } else {
      console.log('无关联管理员');
    }
    
    console.log('\n=== 消息数量 ===');
    console.log(`总消息数: ${chatSession.messages.length}`);
    
    // 查询当前登录的管理员信息（从日志中看到的用户ID）
    const loggedInAdmin = await User.findById('68a4277549dfd9e0ba4956f9')
      .select('username email role')
      .lean();
    
    console.log('\n=== 当前登录管理员 ===');
    if (loggedInAdmin) {
      console.log(`管理员ID: ${loggedInAdmin._id}`);
      console.log(`用户名: ${loggedInAdmin.username}`);
      console.log(`邮箱: ${loggedInAdmin.email}`);
      console.log(`角色: ${loggedInAdmin.role}`);
    } else {
      console.log('未找到当前登录管理员');
    }
    
    // 分析权限问题
    console.log('\n=== 权限分析 ===');
    if (chatSession.admin && chatSession.admin._id.toString() === '68a4277549dfd9e0ba4956f9') {
      console.log('该管理员已分配到此会话，应有访问权限');
    } else {
      console.log('该管理员未分配到此会话');
      if (loggedInAdmin && loggedInAdmin.role === 'admin') {
        console.log('管理员应有权访问所有会话，除非系统有特殊限制');
        console.log('建议检查会话访问的权限控制逻辑');
      }
    }
    
    // 查询所有管理员账户
    const allAdmins = await User.find({ role: 'admin' })
      .select('username email role')
      .lean();
    
    console.log('\n=== 系统中的管理员 ===');
    allAdmins.forEach(admin => {
      console.log(`- ${admin.username} (ID: ${admin._id}, 邮箱: ${admin.email})`);
    });
    
  } catch (error) {
    console.error('检查会话权限时出错:', error);
  } finally {
    mongoose.disconnect();
    console.log('\n已断开数据库连接');
  }
}

// 主函数
async function main() {
  await connectDB();
  await checkSessionPermission();
}

// 执行主函数
main();