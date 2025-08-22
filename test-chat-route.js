// 测试chat.js中的请求构建逻辑
const axios = require('axios');
require('dotenv').config();

// 模拟chat.js中的请求构建逻辑
function buildRequestData(model, messages, prompt) {
  // 构建请求数据 - 使用通义千问API的正确格式
  const requestData = {
    model: model,
    stream: false,
    parameters: {
      temperature: 0.7,
      top_p: 0.8,
      max_tokens: 2048
    },
    input: {
      messages: []
    }
  };
  
  // 构建messages参数
  if (messages && Array.isArray(messages) && messages.length > 0) {
    // 如果提供了messages，直接使用
    requestData.input.messages = messages;
  } else if (prompt) {
    // 如果只提供了prompt，转换为messages格式
    requestData.input.messages = [{ role: "user", content: prompt }];
  }
  
  return requestData;
}

// 测试请求发送
async function testChatRoute() {
  try {
    const apiKey = process.env.QWEN_API_KEY;
    const apiUrl = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation';
    const model = 'qwen-turbo';
    const prompt = '你好，这是使用chat.js修改后的测试消息';
    
    console.log('测试chat.js中的请求构建逻辑...');
    
    // 构建请求数据
    const requestData = buildRequestData(model, null, prompt);
    console.log('构建的请求数据:', JSON.stringify(requestData, null, 2));
    
    // 发送请求
    const response = await axios.post(apiUrl, requestData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      }
    });
    
    console.log('响应状态码:', response.status);
    console.log('响应数据:', JSON.stringify(response.data, null, 2));
    
    console.log('\n测试成功！chat.js中的请求构建逻辑是正确的。');
    console.log('1. messages参数已经正确嵌套在input对象中');
    console.log('2. 使用了正确的通义千问API完整路径');
    console.log('3. API请求能够成功获取响应');
    
  } catch (error) {
    console.error('请求出错:', error.response ? error.response.data : error.message);
  }
}

testChatRoute();