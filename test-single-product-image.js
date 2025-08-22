const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// 加载环境变量
dotenv.config();

// 连接到MongoDB
autoConnectMongoDB();

// 产品模型
schema = new mongoose.Schema({
  name: { type: String, required: true },
  images: { 
    main: String,
    gallery: [String]
  },
  isActive: { type: Boolean, default: true }
}, { collection: 'products' });
const Product = mongoose.model('Product', schema);

// 配置
const CONFIG = {
  BASE_URL: 'http://localhost:5000', // 服务器地址
  ADMIN_TOKEN: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGE0Mjc3NTQ5ZGZkOWUwYmE0OTU2ZjkiLCJlbWFpbCI6IjEzNzc5NDQ3NDg3QDE2My5jb20iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NTU2ODM1NDgsImV4cCI6MTc1NTc2OTk0OH0.MBcPZh7WsCXXPC95ZtpD6ODpDRN-eDxrhE0cjr4laCQ', // 管理员令牌
  PRODUCT_ID: '68a5957bb25b8c8dc17ae1c3', // 要测试的产品ID（从检查脚本中获取）
  TEST_IMAGE_PATH: path.join(__dirname, 'test-image.jpg') // 测试图片路径
};

async function main() {
  console.log('==== 单个产品图片测试工具 ====');
  console.log('此工具将帮助您测试指定产品的图片上传和保存流程\n');

  // 检查配置
  if (!CONFIG.ADMIN_TOKEN) {
    console.error('错误: 请在CONFIG.ADMIN_TOKEN中设置管理员令牌');
    console.log('提示: 您可以从登录后的localStorage中获取adminToken');
    process.exit(1);
  }

  if (!CONFIG.PRODUCT_ID) {
    console.error('错误: 请在CONFIG.PRODUCT_ID中设置要测试的产品ID');
    console.log('提示: 您可以从产品管理页面的URL或数据库中获取产品ID');
    process.exit(1);
  }

  // 检查测试图片是否存在
  if (!fs.existsSync(CONFIG.TEST_IMAGE_PATH)) {
    console.log('测试图片不存在，正在创建测试图片...');
    createTestImage();
  }

  try {
    // 1. 检查产品是否存在
    console.log(`\n1. 正在检查产品 ${CONFIG.PRODUCT_ID}...`);
    const productBefore = await Product.findById(CONFIG.PRODUCT_ID);
    if (!productBefore) {
      console.error('错误: 找不到指定的产品');
      process.exit(1);
    }
    console.log(`   ✅ 找到产品: ${productBefore.name}`);
    console.log(`   当前主图片URL: ${productBefore.images?.main || '无'}`);

    // 2. 上传图片
    console.log('\n2. 正在上传测试图片...');
    const imageUrl = await uploadImage();
    console.log(`   ✅ 图片上传成功，URL: ${imageUrl}`);

    // 3. 更新产品图片
    console.log('\n3. 正在更新产品图片信息...');
    await updateProductImage(imageUrl);
    console.log('   ✅ 产品图片信息更新成功');

    // 4. 验证产品图片是否正确保存
    console.log('\n4. 正在验证产品图片是否正确保存...');
    const productAfter = await Product.findById(CONFIG.PRODUCT_ID);
    console.log(`   产品名称: ${productAfter.name}`);
    console.log(`   更新后的主图片URL: ${productAfter.images?.main || '无'}`);
    
    if (productAfter.images?.main === imageUrl) {
      console.log('   ✅ 验证成功: 产品图片已正确保存');
    } else {
      console.error('   ❌ 验证失败: 产品图片未正确保存');
      console.log('   预期URL:', imageUrl);
      console.log('   实际URL:', productAfter.images?.main || '无');
    }

    // 5. 检查图片是否可访问
    console.log('\n5. 正在检查图片是否可访问...');
    const isAccessible = await checkImageAccessibility(imageUrl);
    if (isAccessible) {
      console.log('   ✅ 图片可正常访问');
    } else {
      console.error('   ❌ 图片无法访问，请检查服务器配置');
    }

    // 总结
    console.log('\n==== 测试总结 ====');
    console.log('1. 图片上传功能正常');
    console.log(`2. 产品图片${productAfter.images?.main === imageUrl ? '已' : '未'}正确保存`);
    console.log(`3. 图片${isAccessible ? '可' : '不可'}正常访问`);
    
    if (productAfter.images?.main === imageUrl && isAccessible) {
      console.log('\n🎉 测试成功！产品图片应该可以在用户端正常显示了。');
    } else {
      console.log('\n❌ 测试未完全通过，请根据上述错误信息进行排查。');
    }

  } catch (error) {
    console.error('\n测试过程中发生错误:', error.message);
    console.log('请检查以下可能的问题:');
    console.log('1. 管理员令牌是否有效');
    console.log('2. 产品ID是否正确');
    console.log('3. 服务器是否正在运行');
    console.log('4. 网络连接是否正常');
  } finally {
    // 断开MongoDB连接
    mongoose.disconnect();
  }
}

async function uploadImage() {
  try {
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

    return response.data.imageUrl;
  } catch (error) {
    console.error('上传图片失败:', error.response?.data?.message || error.message);
    throw error;
  }
}

async function updateProductImage(imageUrl) {
  try {
    const response = await axios.put(`${CONFIG.BASE_URL}/api/products/${CONFIG.PRODUCT_ID}`, 
      {
        images: {
          main: imageUrl,
          gallery: []
        }
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${CONFIG.ADMIN_TOKEN}`
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('更新产品图片失败:', error.response?.data?.message || error.message);
    throw error;
  }
}

async function checkImageAccessibility(imageUrl) {
  try {
    const fullImageUrl = imageUrl.startsWith('http') ? imageUrl : `${CONFIG.BASE_URL}${imageUrl}`;
    const response = await axios.get(fullImageUrl, { responseType: 'stream' });
    return response.status === 200;
  } catch (error) {
    return false;
  }
}

function createTestImage() {
  // 创建一个简单的测试图片文件（纯文本内容，实际不会显示为图片，但可以测试上传流程）
  fs.writeFileSync(CONFIG.TEST_IMAGE_PATH, 'TEST_IMAGE_CONTENT', 'utf8');
  console.log(`   测试图片已创建: ${CONFIG.TEST_IMAGE_PATH}`);
}

function autoConnectMongoDB() {
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/anwei';
  
  mongoose.connect(mongoUri)
    .then(() => console.log('MongoDB连接成功'))
    .catch(err => console.error('MongoDB连接失败:', err));
}

// 运行主函数
main().catch(console.error);

// 帮助信息
console.log('\n请先编辑此脚本，配置以下信息:');
console.log('1. ADMIN_TOKEN: 管理员令牌');
console.log('2. PRODUCT_ID: 要测试的产品ID');
console.log('\n然后运行: node test-single-product-image.js');