// 测试聊天会话API的脚本
const axios = require('axios');
const { exec } = require('child_process');

// 设置测试环境
const BASE_URL = 'http://localhost:5000/api';

// 先尝试登录获取token
async function loginAndTestChatAPIs() {
  try {
    console.log('===== 测试聊天会话API =====');
    console.log('1. 尝试登录获取认证令牌...');
    
    // 尝试使用测试账户登录
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'test@example.com',
      password: 'password123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ 登录成功，获取到token');
    
    // 设置axios默认headers
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    // 测试会话列表API
    await testSessionsList();
    
    // 测试创建会话API
    await testCreateSession();
    
  } catch (error) {
    console.error('❌ 登录失败，尝试使用已保存的token...', error.response?.data || error.message);
    
    // 尝试读取本地保存的token
    const fs = require('fs');
    if (fs.existsSync('./test-token.txt')) {
      const savedToken = fs.readFileSync('./test-token.txt', 'utf8');
      console.log('使用已保存的token继续测试');
      axios.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
      
      // 测试会话列表API
      await testSessionsList().catch(err => console.error('会话列表API测试失败:', err));
      
      // 测试创建会话API
      await testCreateSession().catch(err => console.error('创建会话API测试失败:', err));
    } else {
      console.error('❌ 没有找到保存的token，请手动登录并保存token到test-token.txt文件');
      console.error('请先在浏览器登录，然后打开控制台，输入 localStorage.getItem(\'token\') 并复制结果到test-token.txt');
      
      // 尝试不使用认证直接测试API（可能会失败，但可以查看错误信息）
      console.log('\n尝试不使用认证直接测试API...');
      delete axios.defaults.headers.common['Authorization'];
      
      try {
        await testSessionsList();
      } catch (err) {
        console.error('会话列表API测试失败（无认证）:', err.response?.data || err.message);
      }
    }
  }
}

// 测试获取会话列表
async function testSessionsList() {
  console.log('\n2. 测试获取会话列表API...');
  const response = await axios.get(`${BASE_URL}/chat/sessions`);
  console.log('✅ 会话列表API调用成功');
  console.log('会话数量:', response.data.sessions.length);
  if (response.data.sessions.length > 0) {
    console.log('第一个会话示例:', JSON.stringify(response.data.sessions[0], null, 2).substring(0, 200) + '...');
  }
}

// 测试创建新会话
async function testCreateSession() {
  console.log('\n3. 测试创建新会话API...');
  const response = await axios.post(`${BASE_URL}/chat/session`, {
    initialMessage: '您好，我需要一些帮助'
  });
  console.log('✅ 创建会话API调用成功');
  console.log('新会话ID:', response.data.sessionId);
  
  // 如果创建成功，尝试获取该会话详情
  if (response.data.sessionId) {
    console.log('\n4. 测试获取会话详情API...');
    const sessionDetail = await axios.get(`${BASE_URL}/chat/sessions/${response.data.sessionId}`);
    console.log('✅ 会话详情API调用成功');
    console.log('会话详情:', JSON.stringify(sessionDetail.data.session, null, 2).substring(0, 300) + '...');
    
    // 尝试发送消息
    console.log('\n5. 测试发送消息到会话API...');
    const messageResponse = await axios.post(`${BASE_URL}/chat/sessions/${response.data.sessionId}/messages`, {
      content: '这是一条测试消息'
    });
    console.log('✅ 发送消息API调用成功');
    console.log('消息发送结果:', messageResponse.data);
  }
}

// 执行测试
loginAndTestChatAPIs().then(() => {
  console.log('\n===== 测试完成 =====');
}).catch(err => {
  console.error('\n❌ 测试过程中发生错误:', err);
  console.log('\n===== 测试结束 =====');
});