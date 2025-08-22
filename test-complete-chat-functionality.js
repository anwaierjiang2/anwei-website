// 简化版聊天系统功能测试脚本
// 此脚本直接测试修复后的API端点功能，适用于已登录用户

async function runCompleteTests() {
  try {
    // 动态导入所需模块
    const fetch = (await import('node-fetch')).default;
    const fs = require('fs');
    const path = require('path');
    
    // 配置
    const API_URL = 'http://localhost:5000';
    const testTokenFile = path.join(__dirname, 'test-token.txt');
    
    let token = '';
    
    console.log('====== 开始简化版功能测试 ======');
    console.log('此测试假设您已经在浏览器中登录系统');
    
    // 步骤1: 检查test-token.txt文件是否存在
    if (!fs.existsSync(testTokenFile)) {
      console.log('请按照以下步骤操作:');
      console.log('1. 在浏览器中登录系统');
      console.log('2. 打开浏览器控制台 (F12)');
      console.log('3. 输入: localStorage.getItem(\'token\')');
      console.log('4. 复制输出的token值');
      console.log('5. 创建test-token.txt文件并粘贴token');
      console.log('6. 重新运行此脚本');
      return;
    }
    
    // 读取token
    try {
      token = fs.readFileSync(testTokenFile, 'utf8').trim();
      console.log('✓ 从文件读取到token');
    } catch (err) {
      console.error('读取token文件失败:', err);
      return;
    }
    
    if (!token) {
      console.error('✗ token文件为空，请填入有效的用户token');
      return;
    }
    
    // 步骤2: 验证token是否有效
    console.log('验证token有效性...');
    const userInfoResponse = await fetch(`${API_URL}/api/auth/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!userInfoResponse.ok) {
      console.error('✗ token无效，请更新test-token.txt中的token值');
      const errorData = await userInfoResponse.json();
      console.error('错误详情:', errorData.message || errorData);
      return;
    }
    
    const userInfo = await userInfoResponse.json();
    console.log(`✓ token有效，当前用户: ${userInfo.user.username || userInfo.user.email}`);
    
    // 测试1: 获取用户会话列表
    console.log('\n测试1: 获取用户会话列表...');
    const sessionsResponse = await fetch(`${API_URL}/api/chat/sessions`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!sessionsResponse.ok) {
      console.error('✗ 获取会话列表失败');
      const errorData = await sessionsResponse.json();
      console.error('错误详情:', errorData.message || errorData);
    } else {
      const sessionsData = await sessionsResponse.json();
      console.log(`✓ 获取会话列表成功，共 ${sessionsData.sessions.length} 个会话`);
    }
    
    // 测试2: 创建新会话
    console.log('\n测试2: 创建新会话...');
    const createSessionResponse = await fetch(`${API_URL}/api/chat/session`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        initialMessage: '你好，我需要帮助！' // 可选的初始消息
      })
    });
    
    let sessionId = '';
    if (!createSessionResponse.ok) {
      console.error('✗ 创建会话失败');
      const errorData = await createSessionResponse.json();
      console.error('错误详情:', errorData.message || errorData);
    } else {
      const sessionData = await createSessionResponse.json();
      sessionId = sessionData.sessionId;
      console.log(`✓ 创建会话成功，会话ID: ${sessionId}`);
    }
    
    // 测试3: 获取会话详情（如果成功创建了会话）
    if (sessionId) {
      console.log('\n测试3: 获取会话详情...');
      const sessionDetailsResponse = await fetch(`${API_URL}/api/chat/sessions/${sessionId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!sessionDetailsResponse.ok) {
        console.error('✗ 获取会话详情失败');
        const errorData = await sessionDetailsResponse.json();
        console.error('错误详情:', errorData.message || errorData);
      } else {
        const sessionDetails = await sessionDetailsResponse.json();
        console.log(`✓ 获取会话详情成功，会话状态: ${sessionDetails.session.status}`);
        console.log(`会话包含 ${sessionDetails.session.messages.length} 条消息`);
      }
    }
    
    // 测试4: 发送消息到会话（如果成功创建了会话）
    if (sessionId) {
      console.log('\n测试4: 发送消息到会话...');
      const sendMessageResponse = await fetch(`${API_URL}/api/chat/sessions/${sessionId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: `测试消息 ${new Date().toISOString()}`
        })
      });
      
      if (!sendMessageResponse.ok) {
        console.error('✗ 发送消息失败');
        const errorData = await sendMessageResponse.json();
        console.error('错误详情:', errorData.message || errorData);
      } else {
        const messageData = await sendMessageResponse.json();
        console.log('✓ 发送消息成功:', messageData.message);
      }
    }
    
    console.log('\n====== 测试完成 ======');
    console.log('提示: 请检查浏览器中的客户服务页面，确认所有功能是否正常工作。
    
  } catch (error) {
    console.error('测试过程中发生错误:', error);
    console.log('====== 测试失败 ======');
  }
}

// 运行测试
runCompleteTests();