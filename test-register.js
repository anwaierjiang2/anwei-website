// 测试注册API的脚本
const testRegister = async () => {
  try {
    console.log('开始测试注册API...');
    
    // 准备测试数据
    const testUser = {
      username: `testuser_${Date.now()}`,
      email: `test_${Date.now()}@example.com`,
      password: 'Test123456'
    };
    
    console.log('测试用户数据:', testUser);
    
    // 发送注册请求
    const response = await fetch('http://localhost:50006/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testUser)
    });
    
    // 获取响应数据
    const data = await response.json();
    
    console.log('响应状态码:', response.status);
    console.log('响应数据:', data);
    
    if (response.ok) {
      console.log('✅ 注册测试成功!');
    } else {
      console.error('❌ 注册测试失败:', data.message || '未知错误');
    }
  } catch (error) {
    console.error('❌ 注册测试发生异常:', error);
  }
};

testRegister();