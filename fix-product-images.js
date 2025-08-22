const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

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

// 修复产品图片URL
async function fixProductImages() {
  try {
    // 获取所有使用相同占位图URL的活跃产品
    const products = await Product.find({
      isActive: true,
      'images.main': 'https://picsum.photos/300/200?random=product'
    });

    console.log(`找到 ${products.length} 个使用相同占位图的产品`);

    if (products.length === 0) {
      console.log('没有需要修复的产品');
      return;
    }

    // 为每个产品生成唯一的随机URL并更新
    const updatePromises = products.map(async (product, index) => {
      // 生成基于产品ID的唯一随机数
      const uniqueSeed = product._id.toString().substring(0, 5);
      
      // 主图片使用基于产品ID的随机URL
      const uniqueMainImage = `https://picsum.photos/300/200?random=${uniqueSeed}`;
      
      // 更新产品图片
      await Product.findByIdAndUpdate(product._id, {
        'images.main': uniqueMainImage
      });
      
      console.log(`产品 ${index + 1}/${products.length}: ${product.name}`);
      console.log(`  原URL: https://picsum.photos/300/200?random=product`);
      console.log(`  新URL: ${uniqueMainImage}`);
    });

    // 等待所有更新完成
    await Promise.all(updatePromises);
    console.log('\n所有产品图片URL已修复完成');
    
    // 生成修复报告
    generateFixReport(products.length);
  } catch (error) {
    console.error('修复产品图片URL时发生错误:', error);
  } finally {
    // 关闭数据库连接
    await mongoose.disconnect();
    console.log('MongoDB连接已关闭');
  }
}

// 生成修复报告
function generateFixReport(fixedCount) {
  const report = {
    timestamp: new Date().toISOString(),
    fixedProductsCount: fixedCount,
    description: '为使用相同占位图URL的产品生成了唯一的随机URL',
    solution: '每个产品的图片URL现在基于其ID生成唯一的随机值，确保不同产品显示不同的图片'
  };
  
  const reportDir = path.join(__dirname, 'fix-reports');
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir);
  }
  
  const reportPath = path.join(reportDir, `product-images-fix-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`修复报告已保存至: ${reportPath}`);
}

// 运行修复
async function runFix() {
  console.log('开始修复产品图片URL...\n');
  await connectMongoDB();
  await fixProductImages();
  console.log('\n修复过程已完成');
}

runFix();