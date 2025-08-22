const mongoose = require('mongoose');
const Product = require('./server/models/Product');
require('dotenv').config();

// 连接到MongoDB数据库
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/anwei', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB连接成功');
  } catch (error) {
    console.error('MongoDB连接失败:', error);
    process.exit(1);
  }
}

// 更新产品图片URL
async function updateProductImages() {
  try {
    // 查找所有使用via.placeholder.com的产品
    const products = await Product.find({
      'images.main': {
        $regex: 'via\.placeholder\.com',
        $options: 'i'
      }
    });

    console.log(`找到 ${products.length} 个需要更新的产品`);

    if (products.length === 0) {
      console.log('没有需要更新的产品');
      return;
    }

    // 批量更新产品图片URL
    const updatePromises = products.map(async (product) => {
      // 替换主图片URL
      const oldMainUrl = product.images.main;
      product.images.main = 'https://picsum.photos/300/200?random=product';
      
      // 如果gallery中也有placeholder图片，也进行替换
      product.images.gallery = product.images.gallery.map(image => 
        image.includes('via.placeholder.com') 
          ? 'https://picsum.photos/300/200?random=gallery' 
          : image
      );

      await product.save();
      console.log(`更新产品ID: ${product._id}, 产品名称: ${product.name}, 原URL: ${oldMainUrl}`);
    });

    await Promise.all(updatePromises);
    console.log('所有产品图片URL更新完成');

  } catch (error) {
    console.error('更新产品图片URL时出错:', error);
  } finally {
    // 关闭数据库连接
    mongoose.connection.close();
  }
}

// 执行更新操作
async function main() {
  await connectDB();
  await updateProductImages();
}

main();