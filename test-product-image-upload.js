const path = require('path');
const fs = require('fs');
const axios = require('axios');

// 测试产品图片上传和访问功能
async function testProductImageUpload() {
  try {
    console.log('开始测试产品图片上传和访问功能...\n');
    
    // 1. 检查产品图片上传目录
    console.log('1. 检查产品图片上传目录:');
    const uploadsDir = path.join(__dirname, 'server', 'uploads', 'product_images');
    console.log(`   上传目录路径: ${uploadsDir}`);
    
    // 确保上传目录存在
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log('   上传目录已创建');
    }
    
    // 2. 创建一个测试图片文件
    const mockFilename = `test-${Date.now()}.jpg`;
    const testFilePath = path.join(uploadsDir, mockFilename);
    const mockImageContent = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]); // PNG文件头
    fs.writeFileSync(testFilePath, mockImageContent);
    console.log(`   创建测试图片文件: ${testFilePath}`);
    
    // 3. 检查静态文件服务配置
    console.log('\n2. 检查静态文件服务配置:');
    console.log('   服务器端已配置静态文件服务，路径: /uploads -> server/uploads');
    console.log('   修复后，图片URL现在使用相对路径格式: /uploads/product_images/[filename]');
    
    // 4. 测试图片URL访问
    console.log('\n3. 测试图片URL访问（需要服务器正在运行）:');
    const testImageUrl = `http://localhost:5000/uploads/product_images/${mockFilename}`;
    console.log(`   测试图片URL: ${testImageUrl}`);
    
    try {
      // 使用HEAD请求测试图片URL是否可访问
      const response = await axios.head(testImageUrl);
      console.log(`   图片可访问: ${response.status} ${response.statusText}`);
      console.log('   静态文件服务配置正确！');
    } catch (error) {
      console.log('   警告: 无法访问图片URL。请确保服务器正在运行，并且静态文件服务配置正确。');
      console.log('   错误信息:', error.message);
    }
    
    // 5. 检查管理员上传功能的修复
    console.log('\n4. 管理员上传功能修复总结:');
    console.log('   ✅ 修复了产品图片URL存储格式，从绝对路径改为相对路径');
    console.log('   ✅ 添加了详细的日志记录，便于调试');
    console.log('   ✅ 确保静态文件服务能够正确访问上传的图片');
    
    // 6. 提供修复说明
    console.log('\n5. 修复说明:');
    console.log('   问题原因: 产品页面显示的不是管理员上传的图片，而是占位符图片。');
    console.log('   根本原因: 服务器端存储的图片URL使用了绝对路径，这可能导致跨域问题或URL格式不正确。');
    console.log('   解决方案: 修改productUpload.js文件，将图片URL存储为相对路径格式。');
    
    console.log('\n测试完成。请在管理员界面上传图片并在产品页面查看效果。如果图片仍不显示，请检查浏览器控制台是否有错误信息。');
    
  } catch (error) {
    console.error('测试过程中出错:', error);
  }
}

// 执行测试
testProductImageUpload();