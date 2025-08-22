// 直接测试通义千问API请求格式
const axios = require('axios');
require('dotenv').config();

async function testQwenApi() {
  try {
    const apiKey = process.env.QWEN_API_KEY;
    // 使用正确的通义千问API完整路径
    const apiUrl = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation';
    
    console.log('测试通义千问API请求格式...');
    console.log('API URL:', apiUrl);
    console.log('API Key:', apiKey ? '已配置' : '未配置');
    
    if (!apiKey) {
      console.error('请在.env文件中配置QWEN_API_KEY');
      return;
    }
    
    // 构建请求数据 - 使用正确的通义千问API格式
    const requestData = {
      model: 'qwen-turbo',
      input: {
        messages: [
          { role: 'user', content: '你好，这是一个测试消息' }
        ]
      },
      parameters: {
        temperature: 0.7,
        top_p: 0.8,
        max_tokens: 2048
      }
    };
    
    console.log('请求数据:', JSON.stringify(requestData, null, 2));
    
    // 发送请求
    const response = await axios.post(apiUrl, requestData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      }
    });
    
    console.log('响应状态码:', response.status);
    console.log('响应数据:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('请求出错:', error);
  }
}

testQwenApi();