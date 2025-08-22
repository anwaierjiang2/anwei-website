const mongoose = require('mongoose');
const User = require('./server/models/User');

// 数据库连接配置
const mongoURI = 'mongodb://localhost:27017/anwei';

async function checkUsers() {
  try {
    // 连接数据库
    await mongoose.connect(mongoURI);
    console.log('数据库连接成功');

    // 查询所有用户
    const users = await User.find({}).select('username email createdAt role isActive');
    console.log(`找到 ${users.length} 个用户:`);
    users.forEach(user => {
      console.log(`- 用户名: ${user.username}, 邮箱: ${user.email}, 创建时间: ${user.createdAt}, 角色: ${user.role}, 是否激活: ${user.isActive}`);
    });

    // 查询最近注册的用户（按创建时间倒序）
    const recentUsers = await User.find({}).sort({ createdAt: -1 }).limit(5).select('username email createdAt role isActive');
    console.log('\n最近注册的5个用户:');
    recentUsers.forEach(user => {
      console.log(`- 用户名: ${user.username}, 邮箱: ${user.email}, 创建时间: ${user.createdAt}, 角色: ${user.role}, 是否激活: ${user.isActive}`);
    });

  } catch (error) {
    console.error('查询用户数据失败:', error);
  } finally {
    // 断开数据库连接
    mongoose.connection.close();
  }
}

// 执行查询
checkUsers();