const mongoose = require('mongoose');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const Product = require('./server/models/Product');
require('dotenv').config();

// 连接数据库
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/anwei', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB连接成功');
    return true;
  } catch (error) {
    console.error('MongoDB连接失败:', error);
    return false;
  }
}

// 检查产品图片关联
async function checkProductImageAssociation() {
  try {
    const connected = await connectDB();
    if (!connected) {
      console.error('数据库连接失败，无法检查产品图片关联');
      return;
    }

    console.log('\n==== 开始检查产品图片关联 ====\n');

    // 获取所有产品
    const products = await Product.find({ isActive: true }).sort({ updatedAt: -1 }).limit(10);
    console.log(`找到 ${products.length} 个活跃产品\n`);

    // 检查每个产品的图片
    for (const product of products) {
      console.log(`\n产品名称: ${product.name}`);
      console.log(`产品ID: ${product._id}`);
      console.log(`更新时间: ${new Date(product.updatedAt).toLocaleString()}`);
      
      // 检查主图
      if (product.images && product.images.main) {
        console.log(`主图片URL: ${product.images.main}`);
        
        // 检查图片是否为占位图
        if (product.images.main.includes('picsum.photos')) {
          console.log('  🔸 提示: 此图片使用了占位图，管理员可能尚未上传实际图片');
        } else {
          // 检查图片URL格式是否正确
          if (product.images.main.startsWith('/uploads/product_images/')) {
            console.log('  🔹 URL格式正确');
            
            // 检查图片文件是否存在于服务器
            const imagePath = path.join(__dirname, 'server', product.images.main);
            if (fs.existsSync(imagePath)) {
              console.log('  🔹 图片文件存在于服务器');
              
              // 尝试访问图片URL（需要服务器正在运行）
              try {
                const testUrl = `http://localhost:5000${product.images.main}`;
                const response = await axios.head(testUrl);
                console.log(`  🔹 图片URL可访问: ${response.status} ${response.statusText}`);
              } catch (error) {
                console.log('  🔸 警告: 无法访问图片URL，请确保服务器正在运行');
                console.log('  错误信息:', error.message);
              }
            } else {
              console.log('  🔴 错误: 图片文件不存在于服务器');
              console.log(`  文件路径: ${imagePath}`);
            }
          } else {
            console.log('  🔴 错误: 图片URL格式不正确，应该以 /uploads/product_images/ 开头');
          }
        }
      } else {
        console.log('  🔸 提示: 产品没有设置主图片');
      }
      
      // 检查图库图片
      if (product.images && product.images.gallery && product.images.gallery.length > 0) {
        console.log(`图库图片数量: ${product.images.gallery.length}`);
        product.images.gallery.forEach((url, index) => {
          console.log(`  图库图片 ${index + 1}: ${url}`);
          if (url.includes('picsum.photos')) {
            console.log('    🔸 提示: 此图片使用了占位图');
          }
        });
      }
      
      console.log('-'.repeat(60));
    }

    // 检查是否有产品使用了占位图
    const placeholderProducts = await Product.find({
      isActive: true,
      $or: [
        { 'images.main': { $regex: 'picsum.photos' } },
        { 'images.gallery': { $elemMatch: { $regex: 'picsum.photos' } } }
      ]
    });
    
    console.log('\n==== 检查结果总结 ====');
    console.log(`- 总活跃产品数: ${await Product.countDocuments({ isActive: true })}`);
    console.log(`- 使用占位图的产品数: ${placeholderProducts.length}`);
    console.log(`- 最近检查的产品数: ${products.length}`);
    
    console.log('\n==== 管理员操作指南 ====');
    console.log('1. 请确保在管理员界面上传产品图片后，点击保存按钮以保存更改');
    console.log('2. 上传图片后，系统会自动更新产品的图片URL');
    console.log('3. 如果上传的图片未显示，请检查图片URL格式是否正确');
    console.log('4. 如果图片URL正确但未显示，请确认服务器端文件是否存在');
    console.log('\n检查完成。如有问题，请查看详细日志。');

  } catch (error) {
    console.error('检查产品图片关联时出错:', error);
  } finally {
    mongoose.connection.close();
  }
}

// 执行检查
console.log('开始检查产品图片关联机制...');
checkProductImageAssociation();