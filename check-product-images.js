const mongoose = require('mongoose');
const Product = require('./server/models/Product');
const fs = require('fs');
const path = require('path');
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

// 检查产品图片
async function checkProductImages() {
  try {
    // 获取所有产品
    const products = await Product.find({});
    console.log(`找到 ${products.length} 个产品`);
    
    const productImagesDir = path.join(__dirname, 'server', 'uploads', 'product_images');
    console.log(`产品图片目录: ${productImagesDir}`);
    
    // 遍历所有产品，查看图片URL
    products.forEach(product => {
      console.log(`\n产品ID: ${product._id}`);
      console.log(`产品名称: ${product.name}`);
      console.log(`主图片URL: ${product.images.main}`);
      console.log(`图库图片数量: ${product.images.gallery?.length || 0}`);
      
      // 检查主图片是否是本地URL
      if (product.images.main && product.images.main.includes('localhost') && product.images.main.includes('/uploads/product_images/')) {
        const filename = path.basename(product.images.main);
        const localPath = path.join(productImagesDir, filename);
        const fileExists = fs.existsSync(localPath);
        console.log(`本地文件路径: ${localPath}`);
        console.log(`文件是否存在: ${fileExists}`);
        
        if (!fileExists && product.images.main.includes('via.placeholder.com')) {
          console.log('这是占位符图片，不是用户上传的图片');
        } else if (!fileExists) {
          console.log('警告: 图片文件不存在，但URL不是占位符');
        }
      } else if (product.images.main && product.images.main.includes('picsum.photos')) {
        console.log('这是picsum.photos占位符图片');
      } else if (product.images.main && !product.images.main.includes('via.placeholder.com') && !product.images.main.includes('picsum.photos')) {
        console.log('这可能是用户上传的图片URL');
      }
    });
    
    // 列出上传目录中的所有文件
    try {
      const files = fs.readdirSync(productImagesDir);
      console.log(`\n上传目录中的文件 (${files.length}个):`);
      files.forEach(file => {
        const filePath = path.join(productImagesDir, file);
        const stats = fs.statSync(filePath);
        console.log(`${file} - ${stats.size} bytes - ${stats.mtime}`);
      });
    } catch (error) {
      console.error('读取上传目录失败:', error);
    }
    
  } catch (error) {
    console.error('检查产品图片时出错:', error);
  } finally {
    // 关闭数据库连接
    mongoose.connection.close();
  }
}

// 执行检查
async function main() {
  await connectDB();
  await checkProductImages();
}

main();