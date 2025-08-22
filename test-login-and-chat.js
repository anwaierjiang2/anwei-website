// 登录测试脚本，用于获取认证token并测试客服聊天功能
const axios = require('axios');
const fs = require('fs');

const API_URL = 'http://localhost:3001';
const USER_EMAIL = 'test@example.com';
const USER_PASSWORD = 'password123';

async function testLoginAndChat() {
  console.log('====== 开始测试登录和客服聊天功能 ======');
  
  try {
    // 尝试登录
    console.log('1. 尝试登录用户...');
    let loginResponse;
    try {
      loginResponse = await axios.post(`${API_URL}/api/auth/login`, {
        email: USER_EMAIL,
        password: USER_PASSWORD
      });
      console.log('✓ 登录成功！');
    } catch (loginError) {
      // 如果登录失败，尝试注册新用户
      console.log('登录失败，尝试注册新用户...');
      try {
        await axios.post(`${API_URL}/api/auth/register`, {
          username: 'testuser',
          email: USER_EMAIL,
          password: USER_PASSWORD
        });
        console.log('✓ 用户注册成功！');
        
        // 再次尝试登录
        loginResponse = await axios.post(`${API_URL}/api/auth/login`, {
          email: USER_EMAIL,
          password: USER_PASSWORD
        });
        console.log('✓ 登录成功！');
      } catch (registerError) {
        console.error('✗ 用户注册失败:', registerError.response?.data?.message || registerError.message);
        console.log('\n请手动注册或使用现有账号登录');
        return;
      }
    }
    
    // 获取token
    const token = loginResponse.data.token;
    console.log('✓ 获取到认证token:', token.substring(0, 20) + '...');
    
    // 保存token到临时文件，方便测试
    fs.writeFileSync('./temp_token.txt', token);
    console.log('✓ token已保存到temp_token.txt');
    
    // 测试获取会话列表
    console.log('\n2. 测试获取会话列表...');
    const sessionsResponse = await axios.get(`${API_URL}/api/chat/sessions`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✓ 会话列表获取成功！会话数量:', sessionsResponse.data.sessions.length);
    
    // 创建新会话
    console.log('\n3. 创建新的客服会话...');
    const createSessionResponse = await axios.post(`${API_URL}/api/chat/session`, 
      { initialMessage: '你好，我想咨询产品信息' },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const sessionId = createSessionResponse.data.sessionId;
    console.log('✓ 会话创建成功！会话ID:', sessionId);
    
    // 获取会话详情
    console.log('\n4. 获取会话详情...');
    const sessionDetailResponse = await axios.get(`${API_URL}/api/chat/sessions/${sessionId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✓ 会话详情获取成功！消息数量:', sessionDetailResponse.data.session.messages.length);
    
    // 发送消息
    console.log('\n5. 发送测试消息...');
    const messageContent = '这是一条测试消息，测试客服聊天功能是否正常工作';
    const sendMessageResponse = await axios.post(`${API_URL}/api/chat/sessions/${sessionId}/messages`,
      { content: messageContent },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log('✓ 消息发送成功！');
    
    // 再次获取会话详情，确认消息已发送
    console.log('\n6. 确认消息已发送...');
    const updatedSessionResponse = await axios.get(`${API_URL}/api/chat/sessions/${sessionId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✓ 消息已成功发送，当前消息数量:', updatedSessionResponse.data.session.messages.length);
    
    console.log('\n====== 测试总结 ======');
    console.log('✓ 客服聊天功能测试成功！');
    console.log('✓ 所有API调用正常工作');
    console.log('\n请使用以下token在浏览器中测试:');
    console.log(token);
    console.log('\n使用方法:');
    console.log('1. 打开浏览器开发者工具 (F12)');
    console.log('2. 切换到Console选项卡');
    console.log('3. 输入: localStorage.setItem("userToken", "' + token + '")');
    console.log('4. 刷新客服聊天页面');
  } catch (error) {
    console.error('✗ 测试过程中发生错误:', error.response?.data?.message || error.message);
    if (error.response) {
      console.error('状态码:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
  }
}

console.log('开始测试登录和客服聊天功能...');
testLoginAndChat().then(() => {
  console.log('\n测试完成');
});