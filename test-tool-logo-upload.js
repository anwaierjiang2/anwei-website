const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Tool = require('./server/models/Tool');

// 配置
const CONFIG = {
  BASE_URL: 'http://localhost:5000',
  ADMIN_TOKEN: '', // 请填入管理员JWT令牌
  TEST_TOOL_ID: '', // 请填入一个有效的工具ID
  TEST_IMAGE_PATH: path.join(__dirname, 'test-image.jpg')
};

// 等待函数
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 检查测试图片文件是否存在
function checkTestImage() {
  if (!fs.existsSync(CONFIG.TEST_IMAGE_PATH)) {
    console.error(`❌ 错误: 测试图片文件不存在: ${CONFIG.TEST_IMAGE_PATH}`);
    console.error('请在项目根目录下创建一个名为 test-image.jpg 的测试图片');
    process.exit(1);
  }
  console.log(`✅ 找到测试图片: ${CONFIG.TEST_IMAGE_PATH}`);
}

// 从.env文件加载管理员令牌
function loadAdminToken() {
  try {
    require('dotenv').config();
    if (process.env.ADMIN_JWT) {
      CONFIG.ADMIN_TOKEN = process.env.ADMIN_JWT;
      console.log('✅ 从.env文件加载管理员令牌成功');
    }
  } catch (error) {
    console.warn('从.env文件加载管理员令牌失败:', error.message);
  }
}

// 上传工具logo
async function uploadToolLogo() {
  console.log('\n==== 开始上传工具logo ====');
  
  const formData = new FormData();
  formData.append('logo', fs.createReadStream(CONFIG.TEST_IMAGE_PATH));
  formData.append('toolId', CONFIG.TEST_TOOL_ID);
  formData.append('toolName', 'test-tool');
  
  try {
    const response = await axios.post(`${CONFIG.BASE_URL}/api/toolUpload/upload`, formData, {
      headers: {
        ...formData.getHeaders(),
        'Authorization': `Bearer ${CONFIG.ADMIN_TOKEN}`
      }
    });
    
    console.log('✅ 上传成功！');
    console.log('返回的URL:', response.data.logoUrl);
    
    // 检查返回的URL格式是否为相对路径
    if (response.data.logoUrl.startsWith('/uploads/tool_logos/')) {
      console.log('✅ URL格式正确，是相对路径');
    } else {
      console.error('❌ 错误: URL格式不正确，不是相对路径');
    }
    
    return response.data.logoUrl;
  } catch (error) {
    console.error('❌ 上传失败:', error.response ? error.response.data : error.message);
    throw error;
  }
}

// 连接MongoDB并验证存储的URL
async function verifyStoredUrl(logoUrl) {
  console.log('\n==== 验证数据库中存储的URL ====');
  
  try {
    // 连接MongoDB
    await mongoose.connect('mongodb://localhost:27017/anwei', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ MongoDB连接成功');
    
    // 查找工具并验证logo URL
    const tool = await Tool.findById(CONFIG.TEST_TOOL_ID);
    if (!tool) {
      console.error(`❌ 错误: 找不到ID为 ${CONFIG.TEST_TOOL_ID} 的工具`);
      return;
    }
    
    console.log('工具名称:', tool.name);
    console.log('存储的logo URL:', tool.logo);
    
    // 检查存储的URL格式
    if (tool.logo.startsWith('/uploads/tool_logos/')) {
      console.log('✅ 数据库中存储的URL格式正确，是相对路径');
    } else {
      console.error('❌ 错误: 数据库中存储的URL格式不正确');
    }
    
  } catch (error) {
    console.error('❌ 验证过程中出错:', error);
  } finally {
    // 断开MongoDB连接
    await mongoose.disconnect();
  }
}

// 检查图片可访问性
async function checkImageAccessibility(logoUrl) {
  console.log('\n==== 检查图片可访问性 ====');
  
  try {
    const fullUrl = `${CONFIG.BASE_URL}${logoUrl}`;
    console.log('尝试访问图片:', fullUrl);
    
    const response = await axios.get(fullUrl, {
      responseType: 'arraybuffer'
    });
    
    if (response.status === 200) {
      console.log(`✅ 图片可访问，状态码: ${response.status}`);
      console.log(`   图片大小: ${response.data.length} 字节`);
    } else {
      console.error(`❌ 图片访问失败，状态码: ${response.status}`);
    }
  } catch (error) {
    console.error('❌ 访问图片时出错:', error.message);
  }
}

// 主函数
async function main() {
  console.log('==== 工具logo上传测试 ====');
  
  // 检查测试图片
  checkTestImage();
  
  // 加载管理员令牌
  loadAdminToken();
  
  // 如果没有提供必要的配置，提示用户
  if (!CONFIG.ADMIN_TOKEN) {
    console.error('❌ 错误: 请提供管理员JWT令牌');
    console.error('方法1: 在.env文件中设置ADMIN_JWT环境变量');
    console.error('方法2: 直接在脚本的CONFIG.ADMIN_TOKEN中填入令牌');
    process.exit(1);
  }
  
  if (!CONFIG.TEST_TOOL_ID) {
    console.error('❌ 错误: 请提供有效的工具ID');
    console.error('请在脚本的CONFIG.TEST_TOOL_ID中填入一个有效的工具ID');
    process.exit(1);
  }
  
  try {
    // 上传工具logo
    const logoUrl = await uploadToolLogo();
    
    // 等待一会儿，确保数据已保存到数据库
    await wait(1000);
    
    // 验证数据库中存储的URL
    await verifyStoredUrl(logoUrl);
    
    // 检查图片可访问性
    await checkImageAccessibility(logoUrl);
    
    console.log('\n==== 测试完成 ====');
    console.log('🎉 工具logo上传功能测试成功！');
    console.log('✅ 返回的URL格式为相对路径');
    console.log('✅ 用户端将能够正确显示管理员上传的本地图片');
  } catch (error) {
    console.error('\n❌ 测试失败，请检查以上错误信息');
    process.exit(1);
  }
}

// 运行主函数
main().catch(err => {
  console.error('未捕获的错误:', err);
  process.exit(1);
});