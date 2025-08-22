const { io } = require('socket.io-client');
const axios = require('axios');

// 测试WebSocket连接
async function testChatWebSocket() {
  try {
    console.log('=== 开始测试客服聊天WebSocket连接 ===');
    
    // 1. 首先进行管理员登录以获取token
    console.log('1. 尝试管理员登录...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/admin-login', {
      email: '13779447487@163.com', // 来自.env配置的管理员邮箱
      password: '151979aT'     // 来自.env配置的管理员密码
    });
    
    if (!loginResponse.data || !loginResponse.data.token) {
      console.error('登录失败，无法获取token');
      return;
    }
    
    const adminToken = loginResponse.data.token;
    console.log('登录成功，获取到token:', adminToken.substring(0, 20) + '...');
    
    // 2. 尝试获取会话列表以确认认证正常
    console.log('2. 尝试获取会话列表...');
    const sessionsResponse = await axios.get('http://localhost:5000/api/chat/admin/sessions', {
      headers: {
        Authorization: `Bearer ${adminToken}`
      }
    });
    
    console.log('会话列表获取成功，会话数量:', sessionsResponse.data.sessions.length);
    
    // 3. 初始化WebSocket连接
    console.log('3. 初始化WebSocket连接...');
    const socket = io('http://localhost:5000', {
      path: '/socket.io',
      transports: ['websocket'],
      reconnection: true,
      extraHeaders: {
        Authorization: `Bearer ${adminToken}`
      }
    });
    
    // 连接成功事件
    socket.on('connect', () => {
      console.log('WebSocket连接成功，socket ID:', socket.id);
      
      // 发送用户登录事件
      const adminInfo = JSON.parse(Buffer.from(adminToken.split('.')[1], 'base64').toString());
      console.log('发送user_login事件...');
      socket.emit('user_login', {
        userId: adminInfo.userId,
        token: adminToken
      });
      
      // 如果有会话，尝试发送测试消息
      if (sessionsResponse.data.sessions.length > 0) {
        const firstSession = sessionsResponse.data.sessions[0];
        console.log('4. 尝试发送测试消息到会话:', firstSession.sessionId);
        socket.emit('send_message', {
          sessionId: firstSession.sessionId,
          content: '这是一条测试消息',
          sender: 'admin',
          receiverId: firstSession.user._id,
          senderId: adminInfo.userId,
          timestamp: new Date().toISOString()
        });
      }
    });
    
    // 监听消息发送成功
    socket.on('message_sent', (data) => {
      console.log('消息发送成功:', data);
    });
    
    // 监听新消息
    socket.on('new_message', (data) => {
      console.log('接收到新消息:', data);
    });
    
    // 监听连接错误
    socket.on('connect_error', (error) => {
      console.error('WebSocket连接错误:', error);
    });
    
    // 监听断开连接
    socket.on('disconnect', (reason) => {
      console.log('WebSocket连接断开:', reason);
    });
    
    // 5秒后断开连接并结束测试
    setTimeout(() => {
      console.log('5. 断开WebSocket连接...');
      socket.disconnect();
      console.log('=== 测试结束 ===');
    }, 5000);
    
  } catch (error) {
    console.error('测试失败:', error.response?.data || error.message || error);
  }
}

testChatWebSocket();