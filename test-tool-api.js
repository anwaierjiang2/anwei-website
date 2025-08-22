// 测试添加工具API
async function testAddTool() {
  try {
    // 动态导入node-fetch
    const fetch = (await import('node-fetch')).default;
    
    // 首先获取管理员token
    const loginResponse = await fetch('http://localhost:50000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: '13779447487@163.com', // 从.env文件中看到的管理员邮箱
        password: '151979aT' // 从.env文件中看到的管理员密码
      })
    });
    
    const loginData = await loginResponse.json();
    console.log('登录响应:', loginData);
    
    if (!loginResponse.ok || !loginData.token) {
      console.error('登录失败，无法获取token');
      return;
    }
    
    const token = loginData.token;
    
    // 测试添加工具API
    const addToolResponse = await fetch('http://localhost:50000/api/tools', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: '测试工具',
        description: '这是一个测试工具',
        category: '开发工具', // 使用有效的枚举值
        url: 'https://example.com/test-tool',
        isActive: true,
        createdBy: loginData.user.id // 添加创建者ID
      })
    });
    
    const addToolData = await addToolResponse.json();
    
    console.log('添加工具API状态码:', addToolResponse.status);
    console.log('添加工具响应:', addToolData);
    
    if (addToolResponse.ok) {
      console.log('✅ 添加工具成功!');
    } else {
      console.error('❌ 添加工具失败:', addToolData.message);
    }
    
  } catch (error) {
    console.error('测试过程中发生错误:', error);
  }
}

testAddTool();