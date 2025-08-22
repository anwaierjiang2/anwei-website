const mongoose = require('mongoose');
const Product = require('./server/models/Product');
const fs = require('fs');
const path = require('path');

// 配置
const CONFIG = {
  MONGODB_URI: 'mongodb://localhost:27017/anwei'
};

// 检查产品图片URL和文件存在性
async function checkAllProductsImages() {
  try {
    console.log('==== 开始检查所有产品图片 ====');
    
    // 连接MongoDB
    await mongoose.connect(CONFIG.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ MongoDB连接成功');
    
    // 查询所有产品
    const products = await Product.find({ isActive: true }).sort({ updatedAt: -1 });
    console.log(`找到 ${products.length} 个活跃产品`);
    
    if (products.length === 0) {
      console.log('⚠️ 没有找到活跃产品');
      await mongoose.disconnect();
      return;
    }
    
    // 统计URL重复情况
    const urlCounts = {};
    const urlToProducts = {};
    
    console.log('\n==== 产品图片URL详情 ====');
    
    // 遍历所有产品
    for (const product of products) {
      const mainImageUrl = product.images?.main || '未设置';
      const galleryImages = product.images?.gallery || [];
      
      // 统计主图片URL重复情况
      if (urlCounts[mainImageUrl]) {
        urlCounts[mainImageUrl]++;
        urlToProducts[mainImageUrl].push(product.name);
      } else {
        urlCounts[mainImageUrl] = 1;
        urlToProducts[mainImageUrl] = [product.name];
      }
      
      // 打印产品信息
      console.log(`\n产品名称: ${product.name}`);
      console.log(`产品ID: ${product._id}`);
      console.log(`更新时间: ${new Date(product.updatedAt).toLocaleString('zh-CN')}`);
      console.log(`主图片URL: ${mainImageUrl}`);
      
      // 检查URL格式是否正确
      if (mainImageUrl && mainImageUrl.startsWith('/uploads/product_images/')) {
        console.log('  🔹 URL格式正确');
        
        // 检查文件是否存在
        const filePath = path.join(__dirname, 'server', mainImageUrl.substring(1)); // 移除开头的斜杠
        if (fs.existsSync(filePath)) {
          console.log(`  🔹 图片文件存在于服务器: ${filePath}`);
        } else {
          console.log(`  🔴 错误: 图片文件不存在于服务器: ${filePath}`);
        }
      } else if (mainImageUrl && mainImageUrl.startsWith('https://picsum.photos/')) {
        console.log('  🔸 提示: 此图片使用了占位图');
      } else if (mainImageUrl) {
        console.log('  🔴 错误: URL格式不正确');
      }
      
      // 打印图库图片信息
      if (galleryImages.length > 0) {
        console.log(`图库图片数量: ${galleryImages.length}`);
        galleryImages.forEach((galleryUrl, index) => {
          console.log(`  图库图片${index + 1}: ${galleryUrl}`);
        });
      }
    }
    
    // 显示URL重复统计
    console.log('\n==== URL重复统计 ====');
    const duplicateUrls = Object.entries(urlCounts).filter(([_, count]) => count > 1);
    
    if (duplicateUrls.length > 0) {
      console.log(`发现 ${duplicateUrls.length} 个重复的图片URL:`);
      duplicateUrls.forEach(([url, count]) => {
        console.log(`- URL: ${url}`);
        console.log(`  重复次数: ${count}`);
        console.log(`  使用此URL的产品: ${urlToProducts[url].join(', ')}`);
      });
    } else {
      console.log('✅ 没有发现重复的图片URL');
    }
    
    // 分析和建议
    console.log('\n==== 分析和建议 ====');
    if (duplicateUrls.length > 0) {
      console.log('问题分析: 多个产品使用了相同的图片URL，这可能是导致所有产品显示相同图片的原因。');
      console.log('解决方案:');
      console.log('1. 确保每个产品上传独立的图片文件');
      console.log('2. 检查管理员系统的产品图片更新逻辑，确保不会误将所有产品的图片设置为同一个URL');
      console.log('3. 可以使用以下脚本修复现有产品的图片URL问题');
    }
    
  } catch (error) {
    console.error('检查过程中出错:', error);
  } finally {
    // 断开MongoDB连接
    await mongoose.disconnect();
    console.log('\nMongoDB连接已关闭');
  }
}

// 运行检查
checkAllProductsImages().catch(err => {
  console.error('未捕获的错误:', err);
});