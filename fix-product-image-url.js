const mongoose = require('mongoose');
const Product = require('./server/models/Product');
require('dotenv').config();

// 配置
const CONFIG = {
  PRODUCT_ID: '68a5957bb25b8c8dc17ae1c3', // 要修复的产品ID
  TEST_FILENAME: 'test-product-image.jpg' // 测试文件名
};

// 连接到MongoDB
async function connectMongoDB() {
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

// 修复产品图片URL
async function fixProductImageUrl() {
  try {
    const connected = await connectMongoDB();
    if (!connected) {
      console.error('数据库连接失败，无法修复产品图片URL');
      return;
    }

    console.log('==== 开始修复产品图片URL ====');
    console.log(`正在处理产品ID: ${CONFIG.PRODUCT_ID}`);

    // 查找产品
    const product = await Product.findById(CONFIG.PRODUCT_ID);
    if (!product) {
      console.error('错误: 找不到指定的产品');
      return;
    }

    console.log(`产品名称: ${product.name}`);
    console.log(`当前主图片URL: ${product.images?.main || '无'}`);

    // 检查并修复URL格式
    if (product.images && product.images.main) {
      // 如果URL是完整URL格式，提取相对路径部分
      if (product.images.main.startsWith('http')) {
        const urlParts = product.images.main.split('/uploads/');
        if (urlParts.length > 1) {
          const relativePath = `/uploads/${urlParts[1]}`;
          console.log(`修复URL格式: ${product.images.main} -> ${relativePath}`);
          
          // 更新产品图片URL
          product.images.main = relativePath;
          await product.save();
          console.log('✅ 产品图片URL修复成功！');
        } else {
          console.log('⚠️ URL格式无法识别，无法自动修复');
        } 
      } else if (product.images.main.startsWith('/uploads/product_images/')) {
        console.log('✅ 图片URL格式已经正确，无需修复');
      } else {
        console.log('⚠️ 图片URL格式不标准，将修复为正确格式');
        
        // 修复为正确的格式：/uploads/product_images/[文件名]
        const correctPath = `/uploads/product_images/${CONFIG.TEST_FILENAME}`;
        console.log(`修复URL格式: ${product.images.main} -> ${correctPath}`);
        
        // 更新产品图片URL
        product.images.main = correctPath;
        await product.save();
        console.log('✅ 产品图片URL已修复为正确格式！');
      }
    } else {
      console.log('⚠️ 产品没有主图片，无需修复');
    }

    // 检查图库图片
    if (product.images && product.images.gallery && product.images.gallery.length > 0) {
      console.log(`\n修复图库图片URL (共${product.images.gallery.length}张):`);
      let fixedCount = 0;
      
      for (let i = 0; i < product.images.gallery.length; i++) {
        const galleryUrl = product.images.gallery[i];
        if (galleryUrl.startsWith('http')) {
          const urlParts = galleryUrl.split('/uploads/');
          if (urlParts.length > 1) {
            const relativePath = `/uploads/${urlParts[1]}`;
            console.log(`修复图库图片 ${i+1}: ${galleryUrl} -> ${relativePath}`);
            product.images.gallery[i] = relativePath;
            fixedCount++;
          }
        }
      }
      
      if (fixedCount > 0) {
        await product.save();
        console.log(`✅ 成功修复了${fixedCount}张图库图片URL！`);
      } else {
        console.log('✅ 所有图库图片URL格式已经正确，无需修复');
      }
    }

    console.log('\n==== 修复总结 ====');
    console.log('1. 产品图片URL已修复为相对路径格式');
    console.log('2. 现在前端应该能够正确显示产品图片了');
    console.log('3. 建议重新运行check-product-image-association.js检查修复效果');

  } catch (error) {
    console.error('修复过程中发生错误:', error);
  } finally {
    // 断开MongoDB连接
    mongoose.disconnect();
  }
}

// 运行修复
fixProductImageUrl().catch(console.error);