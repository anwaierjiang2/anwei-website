// 管理员登录助手脚本
// 此脚本用于帮助管理员登录系统，获取token并保存到localStorage
// 运行方式：在浏览器控制台中执行

// 配置参数
const config = {
  apiUrl: 'http://localhost:5000', // 后端API地址
  adminEmail: '13779447487@163.com', // 管理员邮箱
  adminPassword: 'password123' // 默认密码，建议登录后修改
};

// 登录函数
async function adminLogin(email, password) {
  try {
    console.log(`正在尝试登录管理员账户: ${email}`);
    
    const response = await fetch(`${config.apiUrl}/api/auth/admin-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        password
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error('登录失败:', data.message);
      return {
        success: false,
        message: data.message
      };
    }
    
    // 保存token到localStorage
    localStorage.setItem('adminToken', data.token);
    
    console.log('管理员登录成功！token已保存到localStorage');
    console.log('用户信息:', data.user);
    
    return {
      success: true,
      data: data
    };
  } catch (error) {
    console.error('登录过程中发生错误:', error);
    return {
      success: false,
      message: '网络错误或服务器不可用'
    };
  }
}

// 检查登录状态函数
async function checkLoginStatus() {
  try {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      return { isLoggedIn: false, message: '未找到adminToken' };
    }
    
    const response = await fetch(`${config.apiUrl}/api/auth/verify`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (response.ok && data.valid) {
      console.log('当前已登录为管理员:', data.user.username);
      return { isLoggedIn: true, user: data.user };
    } else {
      localStorage.removeItem('adminToken');
      return { isLoggedIn: false, message: data.message || '登录已过期' };
    }
  } catch (error) {
    console.error('检查登录状态失败:', error);
    return { isLoggedIn: false, message: '网络错误' };
  }
}

// 导航到管理页面函数
goToAdminPage = () => {
  window.location.href = '/admin';
};

// 主函数
async function main() {
  console.log('===== 管理员登录助手 =====');
  
  // 先检查是否已登录
  const status = await checkLoginStatus();
  if (status.isLoggedIn) {
    console.log('您已经登录为管理员，可以直接访问管理页面。');
    console.log('\n提示: 输入 goToAdminPage() 跳转到管理页面。');
    return;
  }
  
  console.log('您当前未登录或登录已过期。');
  console.log(`\n默认使用管理员邮箱: ${config.adminEmail}`);
  console.log('如果这不是您的邮箱，请修改 config.adminEmail 后重新运行。');
  console.log('\n提示:');
  console.log('1. 输入 adminLogin("您的邮箱", "您的密码") 进行登录');
  console.log('2. 登录成功后，输入 goToAdminPage() 跳转到管理页面');
  
  // 也可以直接尝试使用默认配置登录
  console.log('\n是否尝试使用默认配置登录? (输入 y 确认)');
}

// 运行主函数
main();