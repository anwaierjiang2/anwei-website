const axios = require('axios');

// 使用当前服务器运行的端口
const PORT = 64317;
const API_URL = `http://localhost:${PORT}/api/chat`;

// 测试通义千问API调用
async function testChatRoute() {
  try {
    console.log(`正在测试API: ${API_URL}`);
    
    // 准备测试数据
    const testData = {
      messages: [
        { role: "user", content: "你好，我是Trae，能帮我打个招呼吗？" }
      ],
      model: "qwen-turbo"
    };
    
    console.log('发送的请求数据:', testData);
    
    // 发送请求
    const startTime = Date.now();
    const response = await axios.post(API_URL, testData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    const endTime = Date.now();
    
    // 输出结果
    console.log(`\n测试成功！`);
    console.log(`状态码: ${response.status}`);
    console.log(`响应时间: ${endTime - startTime}ms`);
    console.log(`响应数据:`, response.data);
    
    if (response.data.message) {
      console.log(`\nAI回复: ${response.data.message}`);
    }
    
    // 验证是否成功修复了API URL问题
    if (response.status === 200) {
      console.log(`\n🎉 恭喜！通义千问API调用已成功修复！`);
      console.log(`✅ 问题已解决：API URL路径重复的错误已修复`);
    }
  } catch (error) {
    console.error('\n测试失败:');
    if (error.response) {
      console.error(`状态码: ${error.response.status}`);
      console.error(`错误信息: ${error.response.data?.message || '未知错误'}`);
      console.error(`响应数据:`, error.response.data);
    } else if (error.request) {
      console.error('未收到响应，请检查服务器是否运行正常');
    } else {
      console.error('请求配置错误:', error.message);
    }
  }
}

// 运行测试
console.log('开始测试通义千问API调用...');
testChatRoute().then(() => {
  console.log('\n测试完成');
});