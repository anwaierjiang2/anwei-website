const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Chat = require('./server/models/Chat');
const User = require('./server/models/User');

// 加载环境变量
dotenv.config();

// 会话ID和目标管理员ID
const TARGET_SESSION_ID = 'session_1755860884109_x29gnthio'; // 用户尝试访问的会话ID
const TARGET_ADMIN_ID = '68a4277549dfd9e0ba4956f9'; // 当前登录的管理员ID (anwei_admin)

// 连接数据库
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB 连接成功');
  } catch (error) {
    console.error('MongoDB 连接失败:', error);
    process.exit(1);
  }
}

// 将会话分配给管理员
async function assignSessionToAdmin() {
  try {
    // 查找目标会话
    const chat = await Chat.findOne({
      sessionId: TARGET_SESSION_ID
    });

    if (!chat) {
      console.error('会话不存在:', TARGET_SESSION_ID);
      return;
    }

    // 查找目标管理员
    const admin = await User.findById(TARGET_ADMIN_ID);
    
    if (!admin) {
      console.error('管理员不存在:', TARGET_ADMIN_ID);
      return;
    }

    // 检查管理员角色
    if (admin.role !== 'admin') {
      console.error('用户不是管理员:', TARGET_ADMIN_ID);
      return;
    }

    // 分配会话
    chat.admin = TARGET_ADMIN_ID;
    chat.status = 'active';
    await chat.save();

    console.log(`\n会话分配成功!`);
    console.log(`- 会话ID: ${TARGET_SESSION_ID}`);
    console.log(`- 已分配给管理员: ${admin.username} (ID: ${admin._id})`);
    console.log(`- 会话状态: ${chat.status}`);
    console.log(`- 会话所属用户: ${chat.user}`);

  } catch (error) {
    console.error('分配会话错误:', error);
  } finally {
    // 断开数据库连接
    mongoose.disconnect();
  }
}

// 运行脚本
(async () => {
  console.log('开始将会话分配给管理员...');
  await connectDB();
  await assignSessionToAdmin();
})();