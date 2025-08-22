// 测试修改后的聊天API接口
const http = require('http');

// 测试数据 - 直接使用prompt参数
const testData1 = JSON.stringify({
  prompt: "你好，这是一个测试消息",
  model: "qwen-turbo"
});

// 测试数据 - 使用messages数组
const testData2 = JSON.stringify({
  messages: [{"role":"user","content":"你好，这是使用messages数组的测试消息"}],
  model: "qwen-turbo"
});

// 创建HTTP请求选项
const options1 = {
  hostname: 'localhost',
  port: 32000,
  path: '/api/chat',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(testData1)
  }
};

const options2 = {
  hostname: 'localhost',
  port: 32000,
  path: '/api/chat',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(testData2)
  }
};

// 发送测试请求1 - 直接使用prompt参数
console.log('测试1 - 直接使用prompt参数:');
const req1 = http.request(options1, (res) => {
  console.log(`状态码: ${res.statusCode}`);
  console.log('响应头:', res.headers);
  res.on('data', (d) => {
    process.stdout.write(d);
    console.log('\n');
  });
});

req1.on('error', (e) => {
  console.error(`请求错误: ${e.message}`);
});

// 发送请求数据
req1.write(testData1);
req1.end();

// 延迟发送测试请求2
setTimeout(() => {
  console.log('\n测试2 - 使用messages数组:');
  const req2 = http.request(options2, (res) => {
    console.log(`状态码: ${res.statusCode}`);
    console.log('响应头:', res.headers);
    res.on('data', (d) => {
      process.stdout.write(d);
    });
  });

  req2.on('error', (e) => {
    console.error(`请求错误: ${e.message}`);
  });

  // 发送请求数据
  req2.write(testData2);
  req2.end();
}, 2000);