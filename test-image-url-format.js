const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// 加载环境变量
dotenv.config();

// 配置
const CONFIG = {
  BASE_URL: 'http://localhost:5000',
  ADMIN_TOKEN: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGE0Mjc3NTQ5ZGZkOWUwYmE0OTU2ZjkiLCJlbWFpbCI6IjEzNzc5NDQ3NDg3QDE2My5jb20iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NTU2ODM1NDgsImV4cCI6MTc1NTc2OTk0OH0.MBcPZh7WsCXXPC95ZtpD6ODpDRN-eDxrhE0cjr4laCQ',
  PRODUCT_ID: '68a5957bb25b8c8dc17ae1c3',
  TEST_IMAGE_PATH: path.join(__dirname, 'test-image.jpg')
};

// 连接到MongoDB
async function connectMongoDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/anwei', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB连接成功');
    
    // 定义简化的产品模型
    const productSchema = new mongoose.Schema({
      name: { type: String, required: true },
      images: { 
        main: String,
        gallery: [String]
      }
    }, { collection: 'products' });
    
    return mongoose.model('Product', productSchema);
  } catch (error) {
    console.error('MongoDB连接失败:', error);
    process.exit(1);
  }
}

// 测试上传API返回的URL格式
async function testUploadApi() {
  try {
    console.log('==== 测试图片URL格式 ====');
    
    // 连接数据库
    const Product = await connectMongoDB();
    
    // 检查测试图片是否存在
    if (!fs.existsSync(CONFIG.TEST_IMAGE_PATH)) {
      console.log('测试图片不存在，正在创建测试图片...');
      fs.writeFileSync(CONFIG.TEST_IMAGE_PATH, 'TEST_IMAGE_CONTENT', 'utf8');
    }
    
    // 上传图片并记录服务器返回的URL
    console.log('1. 上传图片并获取服务器返回的URL...');
    const formData = new FormData();
    formData.append('image', fs.createReadStream(CONFIG.TEST_IMAGE_PATH));
    formData.append('productId', CONFIG.PRODUCT_ID);
    formData.append('type', 'main');
    
    const response = await axios.post(`${CONFIG.BASE_URL}/api/productUpload/upload`, formData, {
      headers: {
        ...formData.getHeaders(),
        'Authorization': `Bearer ${CONFIG.ADMIN_TOKEN}`
      }
    });
    
    const serverResponseUrl = response.data.imageUrl;
    console.log(`   服务器返回的原始URL: ${serverResponseUrl}`);
    console.log(`   URL格式: ${serverResponseUrl.startsWith('/') ? '相对路径' : '完整URL'}`);
    
    // 直接通过MongoDB查询产品，查看图片URL格式
    console.log('\n2. 直接从数据库查询产品，查看图片URL...');
    const productAfterUpload = await Product.findById(CONFIG.PRODUCT_ID);
    console.log(`   数据库中的图片URL: ${productAfterUpload.images?.main || '无'}`);
    console.log(`   URL格式: ${productAfterUpload.images?.main?.startsWith('/') ? '相对路径' : '完整URL'}`);
    
    // 测试直接更新产品图片
    console.log('\n3. 测试直接更新产品图片...');
    const testUrl = '/uploads/test-url-format.jpg';
    await Product.findByIdAndUpdate(
      CONFIG.PRODUCT_ID,
      { 'images.main': testUrl },
      { new: true }
    );
    
    const productAfterUpdate = await Product.findById(CONFIG.PRODUCT_ID);
    console.log(`   更新后的图片URL: ${productAfterUpdate.images?.main || '无'}`);
    
    // 总结
    console.log('\n==== 测试总结 ====');
    console.log(`1. 服务器返回的URL: ${serverResponseUrl}`);
    console.log(`2. 数据库中存储的URL格式: ${productAfterUpload.images?.main?.startsWith('/') ? '相对路径 ✅' : '完整URL ❌'}`);
    
    if (serverResponseUrl.startsWith('/')) {
      console.log('\n🎉 服务器返回的是相对路径URL，符合预期格式！');
    } else {
      console.log('\n❌ 服务器返回的是完整URL，这可能是问题所在！');
    }
    
  } catch (error) {
    console.error('测试过程中发生错误:', error.message);
    console.log('错误详情:', error.response?.data);
  } finally {
    // 断开MongoDB连接
    mongoose.disconnect();
  }
}

// 运行测试
console.log('此脚本将帮助测试产品图片URL格式问题...');
testUploadApi().catch(console.error);