const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const initAdmin = async () => {
  try {
    // 连接数据库
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/anwei', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB连接成功');

    // 检查是否已存在管理员账号
    const existingAdmin = await User.findOne({ email: process.env.ADMIN_EMAIL });
    
    if (existingAdmin) {
      console.log('管理员账号已存在，更新密码...');
      existingAdmin.password = process.env.ADMIN_PASSWORD;
      existingAdmin.role = 'admin';
      await existingAdmin.save();
      console.log('管理员密码更新成功');
    } else {
      // 创建新的管理员账号
      const adminUser = new User({
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD,
        username: 'anwei_admin',
        role: 'admin',
        isActive: true
      });

      await adminUser.save();
      console.log('管理员账号创建成功');
    }

    console.log('初始化完成！');
    console.log(`管理员邮箱: ${process.env.ADMIN_EMAIL}`);
    console.log(`管理员密码: ${process.env.ADMIN_PASSWORD}`);

  } catch (error) {
    console.error('初始化失败:', error);
  } finally {
    await mongoose.disconnect();
    console.log('数据库连接已关闭');
  }
};

// 如果直接运行此脚本
if (require.main === module) {
  initAdmin();
}

module.exports = initAdmin; 