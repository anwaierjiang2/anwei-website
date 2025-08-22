const mongoose = require('mongoose');

// 配置
const CONFIG = {
  MONGODB_URI: 'mongodb://localhost:27017/anwei'
};

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
async function fixProductPlaceholders() {
  try {
    console.log('==== 开始修复产品占位图URL ====');
    
    // 连接MongoDB
    await mongoose.connect(CONFIG.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ MongoDB连接成功');
    
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
    let fixedCount = 0;
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      try {
        // 生成基于产品ID的唯一随机数
        const uniqueSeed = product._id.toString().substring(0, 8);
        
        // 主图片使用基于产品ID的随机URL
        const uniqueMainImage = `https://picsum.photos/300/200?random=${uniqueSeed}`;
        
        // 更新产品图片
        await Product.findByIdAndUpdate(product._id, {
          'images.main': uniqueMainImage
        });
        
        console.log(`产品 ${i + 1}/${products.length}: ${product.name}`);
        console.log(`  原URL: https://picsum.photos/300/200?random=product`);
        console.log(`  新URL: ${uniqueMainImage}`);
        fixedCount++;
      } catch (err) {
        console.error(`修复产品 ${product.name} 时出错:`, err);
      }
    }

    console.log(`\n共成功修复 ${fixedCount} 个产品图片URL`);
    
  } catch (error) {
    console.error('修复产品图片URL时发生错误:', error);
  } finally {
    // 关闭数据库连接
    await mongoose.disconnect();
    console.log('MongoDB连接已关闭');
  }
}

// 执行修复
fixProductPlaceholders();

// 同时，我们还需要更新管理后台添加产品的代码，防止新的问题产品被创建
console.log('\n==== 重要提示 ====');
console.log('请修改 ProductsManagement.tsx 文件中的 handleAddProduct 函数，将固定占位图URL改为生成唯一URL:');
console.log('原代码:');
console.log('images: {');
console.log('  main: newProduct.images?.main || "https://picsum.photos/300/200?random=product",');
console.log('  gallery: newProduct.images?.gallery || []');
console.log('}');
console.log('\n修改为:');
console.log('images: {');
console.log('  main: newProduct.images?.main || `https://picsum.photos/300/200?random=${Date.now()}`,');
console.log('  gallery: newProduct.images?.gallery || []');
console.log('}');