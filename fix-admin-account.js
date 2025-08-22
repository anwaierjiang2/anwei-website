const mongoose = require('mongoose');
const User = require('./server/models/User');
require('dotenv').config();

async function fixAdminAccount() {
  try {
    // 连接数据库
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/anwei', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB连接成功');

    // 查找管理员账户
    const adminEmail = process.env.ADMIN_EMAIL || '13779447487@163.com';
    console.log(`查找管理员账户: ${adminEmail}`);
    
    const adminUser = await User.findOne({ email: adminEmail });
    
    if (adminUser) {
      console.log('当前管理员账户状态:');
      console.log(`- 角色: ${adminUser.role}`);
      console.log(`- 是否已激活: ${adminUser.isActive}`);
      console.log(`- 最近登录时间: ${adminUser.lastLogin}`);
      console.log(`- 创建时间: ${adminUser.createdAt}`);
      
      // 强制更新管理员账户状态
      adminUser.isActive = true;
      adminUser.role = 'admin';
      await adminUser.save();
      
      console.log('✅ 管理员账户已成功更新并激活!');
      console.log(`更新后状态: 角色=${adminUser.role}, 激活状态=${adminUser.isActive}`);
    } else {
      console.error('❌ 未找到管理员账户!');
      // 创建新的管理员账户
      const newAdmin = new User({
        email: adminEmail,
        password: process.env.ADMIN_PASSWORD || '151979aT',
        username: 'anwei_admin',
        role: 'admin',
        isActive: true
      });
      
      await newAdmin.save();
      console.log('✅ 新的管理员账户已创建!');
    }

  } catch (error) {
    console.error('操作失败:', error);
  } finally {
    await mongoose.disconnect();
    console.log('数据库连接已关闭');
  }
}

// 运行脚本
fixAdminAccount();