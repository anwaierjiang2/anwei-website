const axios = require('axios');

// 测试联系表单是否能正确保存数据到数据库
async function testContactForm() {
  try {
    const testData = {
      name: '测试用户',
      email: 'test@example.com',
      subject: '测试留言 - 保存到数据库',
      message: '这是一条测试留言，请确认是否能保存到数据库中'
    };

    const response = await axios.post('http://localhost:5000/api/contact', testData);
    
    console.log('测试结果:', response.status, response.data);
    console.log('请查看管理员系统的反馈列表，确认是否有这条测试留言。');
  } catch (error) {
    console.error('测试失败:', error.response?.status, error.response?.data || error.message);
  }
}

testContactForm();