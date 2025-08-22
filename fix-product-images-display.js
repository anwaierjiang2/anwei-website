const mongoose = require('mongoose');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// 连接到MongoDB数据库
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/anwei', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB连接成功'))
.catch(err => {
  console.error('MongoDB连接失败:', err);
  process.exit(1);
});

// 定义产品模型
const Product = mongoose.model('Product', new mongoose.Schema({
  name: String,
  images: {
    main: String,
    gallery: [String]
  },
  isActive: Boolean
}), 'products');

// 修复产品图片URL
async function fixProductImages() {
  try {
    console.log('==== 产品图片显示问题修复 ====\n');
    
    // 获取所有活跃的产品
    const products = await Product.find({ isActive: true });
    console.log(`找到 ${products.length} 个活跃产品\n`);
    
    if (products.length === 0) {
      console.log('没有找到活跃产品，无需修复。');
      await mongoose.disconnect();
      return;
    }
    
    // 统计修复信息
    let fixedProductsCount = 0;
    let fixedImagesCount = 0;
    
    for (const product of products) {
      console.log(`处理产品: ${product.name} (ID: ${product._id})`);
      let productUpdated = false;
      
      // 检查并修复主图片URL
      if (product.images && product.images.main) {
        // 检查是否是picsum.photos占位图且可能有问题
        if (product.images.main.includes('picsum.photos') && 
            (product.images.main.includes('random=product') || 
             product.images.main.includes('random=68a587b4') || 
             product.images.main.includes('random=1755685745756'))) {
          
          // 生成新的唯一占位图URL，使用产品ID作为随机参数
          const newPlaceholderUrl = `https://picsum.photos/400/300?random=${product._id}`;
          
          console.log(`  修复主图片URL: 从 ${product.images.main} 修改为 ${newPlaceholderUrl}`);
          product.images.main = newPlaceholderUrl;
          productUpdated = true;
          fixedImagesCount++;
        }
        
        // 验证本地上传的图片URL格式是否正确
        if (product.images.main.startsWith('/uploads/')) {
          // 确保路径格式正确
          const correctPath = product.images.main.startsWith('/uploads/') 
            ? product.images.main 
            : `/uploads/${product.images.main.replace(/^\//, '')}`;
          
          if (correctPath !== product.images.main) {
            console.log(`  修正本地图片URL格式: 从 ${product.images.main} 修改为 ${correctPath}`);
            product.images.main = correctPath;
            productUpdated = true;
            fixedImagesCount++;
          }
        }
      }
      
      // 检查并修复图库图片URL
      if (product.images && product.images.gallery && product.images.gallery.length > 0) {
        for (let i = 0; i < product.images.gallery.length; i++) {
          const galleryImage = product.images.gallery[i];
          
          // 检查是否是picsum.photos占位图
          if (galleryImage.includes('picsum.photos')) {
            const newPlaceholderUrl = `https://picsum.photos/400/300?random=${product._id}-gallery-${i}`;
            console.log(`  修复图库图片 ${i+1} URL: 从 ${galleryImage} 修改为 ${newPlaceholderUrl}`);
            product.images.gallery[i] = newPlaceholderUrl;
            productUpdated = true;
            fixedImagesCount++;
          }
          
          // 验证本地上传的图片URL格式
          if (galleryImage.startsWith('/uploads/')) {
            const correctPath = galleryImage.startsWith('/uploads/') 
              ? galleryImage 
              : `/uploads/${galleryImage.replace(/^\//, '')}`;
            
            if (correctPath !== galleryImage) {
              console.log(`  修正图库图片 ${i+1} URL格式: 从 ${galleryImage} 修改为 ${correctPath}`);
              product.images.gallery[i] = correctPath;
              productUpdated = true;
              fixedImagesCount++;
            }
          }
        }
      }
      
      // 保存修改
      if (productUpdated) {
        await product.save();
        console.log('  产品图片信息已更新');
        fixedProductsCount++;
      } else {
        console.log('  产品图片无需修改');
      }
      
      console.log('------------------------');
    }
    
    // 输出修复总结
    console.log('\n==== 修复总结 ====');
    console.log(`成功修复了 ${fixedProductsCount} 个产品的 ${fixedImagesCount} 张图片URL`);
    
    // 提供前端修复建议
    console.log('\n==== 前端显示问题修复建议 ====');
    console.log('1. 修改 ProductImageCarousel.tsx 组件:');
    console.log('   - 增加图片加载失败的处理逻辑');
    console.log('   - 使用更可靠的占位图服务或本地占位图');
    console.log('   - 确保正确处理相对路径的图片URL');
    
    console.log('\n2. 用户端显示问题排查:');
    console.log('   - 清除浏览器缓存，特别是图片缓存');
    console.log('   - 检查浏览器控制台是否有跨域或图片加载错误');
    console.log('   - 确认前端应用正确处理了服务器返回的相对路径图片URL');
    
    console.log('\n3. 管理员上传流程优化:');
    console.log('   - 确保上传图片后点击"保存"按钮');
    console.log('   - 上传图片后检查预览是否正确显示');
    console.log('   - 如有必要，重新上传问题产品的图片');
    
  } catch (error) {
    console.error('修复过程中发生错误:', error);
  } finally {
    // 断开数据库连接
    await mongoose.disconnect();
    console.log('\n数据库连接已关闭');
  }
}

// 执行修复
fixProductImages();