const mongoose = require('mongoose');
const Feedback = require('./server/models/Feedback');

// 连接数据库
async function connectDB() {
  try {
    await mongoose.connect('mongodb://localhost:27017/anwei', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB连接成功');
  } catch (error) {
    console.error('MongoDB连接失败:', error);
    process.exit(1);
  }
}

// 查询最新的反馈数据
async function checkFeedbackData() {
  try {
    // 连接数据库
    await connectDB();
    
    // 查询最新的5条反馈数据
    const latestFeedback = await Feedback.find({})
      .sort({ createdAt: -1 })
      .limit(5);
    
    console.log('\n最新的5条反馈数据:');
    latestFeedback.forEach((feedback, index) => {
      console.log(`\n反馈 ${index + 1}:`);
      console.log(`ID: ${feedback._id}`);
      console.log(`姓名: ${feedback.name}`);
      console.log(`邮箱: ${feedback.email}`);
      console.log(`主题: ${feedback.subject}`);
      console.log(`消息: ${feedback.message.substring(0, 50)}...`);
      console.log(`类型: ${feedback.type}`);
      console.log(`状态: ${feedback.status}`);
      console.log(`创建时间: ${feedback.createdAt}`);
    });
    
    // 查询测试用户的反馈
    const testFeedback = await Feedback.findOne({
      email: 'test@example.com',
      subject: { $regex: '测试留言' }
    });
    
    if (testFeedback) {
      console.log('\n\n找到测试用户的反馈:');
      console.log(`ID: ${testFeedback._id}`);
      console.log(`姓名: ${testFeedback.name}`);
      console.log(`邮箱: ${testFeedback.email}`);
      console.log(`主题: ${testFeedback.subject}`);
      console.log(`消息: ${testFeedback.message}`);
      console.log(`类型: ${testFeedback.type}`);
      console.log(`状态: ${testFeedback.status}`);
      console.log(`创建时间: ${testFeedback.createdAt}`);
      console.log('\n✅ 测试成功! 反馈数据已成功保存到数据库中。');
    } else {
      console.log('\n❌ 未找到测试用户的反馈。');
    }
    
    // 关闭数据库连接
    await mongoose.disconnect();
  } catch (error) {
    console.error('查询反馈数据失败:', error);
    await mongoose.disconnect();
  }
}

checkFeedbackData();