const mongoose = require('mongoose');
const dotenv = require('dotenv');
const axios = require('axios');

// 加载环境变量
dotenv.config();

// 连接到MongoDB
async function connectMongoDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/anwei-website');
    console.log('MongoDB连接成功');
  } catch (error) {
    console.error('MongoDB连接失败:', error);
    process.exit(1);
  }
}

// 产品模型
const Product = mongoose.model('Product', {
  name: String,
  images: {
    main: String,
    gallery: [String]
  },
  isActive: Boolean
});

// 检查产品图片URL
async function checkProductImages() {
  try {
    // 获取所有活跃产品
    const products = await Product.find({ isActive: true });
    console.log(`找到 ${products.length} 个活跃产品`);
    
    // 统计URL使用情况
    const urlStats = {};
    
    // 存储有问题的产品
    const problematicProducts = [];
    
    // 遍历所有产品
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      const mainImageUrl = product.images?.main;
      
      console.log(`\n产品 ${i + 1}/${products.length}: ${product.name}`);
      console.log(`  ID: ${product._id}`);
      console.log(`  主图片URL: ${mainImageUrl}`);
      console.log(`  图库图片数量: ${product.images?.gallery?.length || 0}`);
      
      // 统计URL出现次数
      if (mainImageUrl) {
        if (!urlStats[mainImageUrl]) {
          urlStats[mainImageUrl] = 0;
        }
        urlStats[mainImageUrl]++;
        
        // 检查URL格式
        if (mainImageUrl.includes('picsum.photos') && !mainImageUrl.includes('random=')) {
          console.log('  警告: 占位图URL没有随机参数，可能导致多个产品显示相同图片');
          problematicProducts.push({
            id: product._id,
            name: product.name,
            url: mainImageUrl,
            issue: '占位图URL没有随机参数'
          });
        } else if (mainImageUrl.includes('picsum.photos') && mainImageUrl.includes('random=product')) {
          console.log('  警告: 使用了统一的random参数，可能导致多个产品显示相同图片');
          problematicProducts.push({
            id: product._id,
            name: product.name,
            url: mainImageUrl,
            issue: '使用了统一的random参数'
          });
        }
      } else {
        console.log('  警告: 缺少主图片URL');
        problematicProducts.push({
          id: product._id,
          name: product.name,
          url: null,
          issue: '缺少主图片URL'
        });
      }
      
      // 检查图片URL是否可访问
      if (mainImageUrl && mainImageUrl.startsWith('http')) {
        try {
          const response = await axios.head(mainImageUrl, { timeout: 3000 });
          console.log(`  图片可访问状态: ${response.status} ${response.statusText}`);
        } catch (error) {
          console.log(`  警告: 图片访问失败: ${error.message}`);
          problematicProducts.push({
            id: product._id,
            name: product.name,
            url: mainImageUrl,
            issue: '图片访问失败'
          });
        }
      } else if (mainImageUrl) {
        // 相对路径，假设服务器正在运行
        const fullUrl = `http://localhost:5000${mainImageUrl}`;
        try {
          const response = await axios.head(fullUrl, { timeout: 3000 });
          console.log(`  完整图片URL: ${fullUrl}`);
          console.log(`  图片可访问状态: ${response.status} ${response.statusText}`);
        } catch (error) {
          console.log(`  警告: 图片访问失败: ${error.message}`);
          problematicProducts.push({
            id: product._id,
            name: product.name,
            url: mainImageUrl,
            issue: '图片访问失败'
          });
        }
      }
    }
    
    // 输出URL统计结果
    console.log('\n===== URL统计结果 =====');
    Object.entries(urlStats).forEach(([url, count]) => {
      console.log(`${url}: ${count} 个产品使用`);
      if (count > 1) {
        console.log(`  警告: 该URL被多个产品使用，可能导致显示相同图片`);
      }
    });
    
    // 输出问题产品总结
    console.log('\n===== 问题产品总结 =====');
    if (problematicProducts.length === 0) {
      console.log('没有发现问题产品');
    } else {
      console.log(`发现 ${problematicProducts.length} 个问题产品:`);
      problematicProducts.forEach(product => {
        console.log(`- ${product.name} (ID: ${product.id}): ${product.issue}`);
      });
    }
    
    // 提供解决建议
    console.log('\n===== 解决建议 =====');
    if (problematicProducts.length > 0) {
      console.log('1. 为问题产品上传独立的本地图片文件');
      console.log('2. 确保占位图URL包含产品特定的随机参数');
      console.log('3. 检查前端代码，确保图片URL正确渲染');
    } else {
      console.log('所有产品图片URL看起来正常，请检查前端代码是否有图片显示问题');
    }
  } catch (error) {
    console.error('检查产品图片时发生错误:', error);
  } finally {
    // 关闭数据库连接
    await mongoose.disconnect();
    console.log('\nMongoDB连接已关闭');
  }
}

// 运行检查
async function runCheck() {
  console.log('开始检查所有活跃产品的图片URL...\n');
  await connectMongoDB();
  await checkProductImages();
  console.log('\n检查完成');
}

runCheck();