const http = require('http');

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/auth/admin-login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
};

const req = http.request(options, (res) => {
  console.log(`状态码: ${res.statusCode}`);
  console.log(`响应头: ${JSON.stringify(res.headers)}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('响应体:', data);
    try {
      const jsonData = JSON.parse(data);
      console.log('解析的JSON:', jsonData);
    } catch (error) {
      console.error('JSON解析错误:', error);
    }
  });
});

req.on('error', (error) => {
  console.error('请求错误:', error);
});

// 发送请求体
req.write(JSON.stringify({
  email: '13779447487@163.com',
  password: '151979aT'
}));
req.end();