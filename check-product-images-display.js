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

// 检查产品图片URL
async function checkProductImages() {
  try {
    console.log('==== 产品图片显示问题检查 ====\n');
    
    // 获取所有活跃的产品
    const products = await Product.find({ isActive: true });
    console.log(`找到 ${products.length} 个活跃产品\n`);
    
    if (products.length === 0) {
      console.log('没有找到活跃产品，请先创建一些产品。');
      await mongoose.disconnect();
      return;
    }
    
    // 检查产品图片URL格式和文件存在性
    const productsWithIssues = [];
    const imageStats = {
      totalImages: 0,
      localImages: 0,
      placeholderImages: 0,
      externalImages: 0,
      missingImages: 0
    };
    
    for (const product of products) {
      console.log(`检查产品: ${product.name} (ID: ${product._id})`);
      const productIssues = {
        productId: product._id,
        productName: product.name,
        issues: []
      };
      
      // 检查主图片
      if (product.images && product.images.main) {
        imageStats.totalImages++;
        
        // 分析图片URL类型
        if (product.images.main.startsWith('/uploads/')) {
          imageStats.localImages++;
          // 检查服务器上文件是否存在
          const filePath = path.join(__dirname, 'server', product.images.main);
          const fileExists = fs.existsSync(filePath);
          
          if (!fileExists) {
            imageStats.missingImages++;
            productIssues.issues.push(`主图片文件不存在: ${filePath}`);
          }
        } else if (product.images.main.includes('picsum.photos')) {
          imageStats.placeholderImages++;
        } else {
          imageStats.externalImages++;
        }
        
        console.log(`  主图片URL: ${product.images.main}`);
        
        // 尝试从客户端角度访问图片URL
        try {
          const fullImageUrl = product.images.main.startsWith('/') 
            ? `http://localhost:5000${product.images.main}` 
            : product.images.main;
          
          const response = await axios.head(fullImageUrl, { timeout: 5000 });
          console.log(`  图片可访问: ${fullImageUrl} (状态码: ${response.status})`);
        } catch (error) {
          const errorMessage = error.code === 'ECONNREFUSED' 
            ? '服务器未启动，无法访问图片URL'
            : `图片URL访问失败: ${error.message}`;
          console.log(`  ${errorMessage}`);
          productIssues.issues.push(errorMessage);
        }
      } else {
        productIssues.issues.push('缺少主图片');
        console.log('  缺少主图片');
      }
      
      // 检查图库图片
      if (product.images && product.images.gallery && product.images.gallery.length > 0) {
        console.log(`  图库图片数量: ${product.images.gallery.length}`);
        
        for (let i = 0; i < product.images.gallery.length; i++) {
          const galleryImage = product.images.gallery[i];
          imageStats.totalImages++;
          
          if (galleryImage.startsWith('/uploads/')) {
            imageStats.localImages++;
            const filePath = path.join(__dirname, 'server', galleryImage);
            const fileExists = fs.existsSync(filePath);
            
            if (!fileExists) {
              imageStats.missingImages++;
              productIssues.issues.push(`图库图片 ${i+1} 文件不存在: ${filePath}`);
            }
          } else if (galleryImage.includes('picsum.photos')) {
            imageStats.placeholderImages++;
          } else {
            imageStats.externalImages++;
          }
          
          console.log(`  图库图片 ${i+1}: ${galleryImage}`);
        }
      }
      
      if (productIssues.issues.length > 0) {
        productsWithIssues.push(productIssues);
      }
      
      console.log('------------------------');
    }
    
    // 输出总结报告
    console.log('\n==== 图片状态统计 ====');
    console.log(`总图片数量: ${imageStats.totalImages}`);
    console.log(`本地上传图片数量: ${imageStats.localImages}`);
    console.log(`占位符图片数量: ${imageStats.placeholderImages}`);
    console.log(`外部链接图片数量: ${imageStats.externalImages}`);
    console.log(`缺失的本地图片数量: ${imageStats.missingImages}`);
    
    if (productsWithIssues.length > 0) {
      console.log('\n==== 问题产品列表 ====');
      productsWithIssues.forEach(product => {
        console.log(`\n产品名称: ${product.productName} (ID: ${product.productId})`);
        product.issues.forEach(issue => {
          console.log(`- ${issue}`);
        });
      });
    } else {
      console.log('\n所有产品图片URL检查通过，没有发现明显问题！');
    }
    
    // 提供解决方案建议
    console.log('\n==== 解决方案建议 ====');
    if (imageStats.missingImages > 0) {
      console.log('1. 缺失的本地图片问题:');
      console.log('   - 确保图片确实上传到了服务器的 uploads/product_images 目录');
      console.log('   - 检查文件权限是否正确');
      console.log('   - 尝试重新上传问题产品的图片');
    }
    
    console.log('\n2. 产品图片显示不一致问题排查:');
    console.log('   - 确保上传图片后点击了"保存"按钮');
    console.log('   - 检查浏览器控制台是否有图片加载错误');
    console.log('   - 清除浏览器缓存后刷新页面');
    console.log('   - 确认前端组件 ProductImageCarousel.tsx 正确处理了图片URL');
    console.log('   - 检查产品的 images 字段是否正确保存了上传的图片URL');
    
    console.log('\n3. 前端显示问题排查:');
    console.log('   - 确认服务器运行在 http://localhost:5000');
    console.log('   - 确认客户端运行在 http://localhost:3002');
    console.log('   - 确认 CORS 配置正确');
    
  } catch (error) {
    console.error('检查过程中发生错误:', error);
  } finally {
    // 断开数据库连接
    await mongoose.disconnect();
    console.log('\n数据库连接已关闭');
  }
}

// 执行检查
checkProductImages();