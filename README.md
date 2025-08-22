# anwei网站

一个集成了高质量工具分享、AI聊天模型、产品展示和购买的综合平台。

## 功能特性

- 🛠️ 高质量工具分享导航
- 🤖 AI聊天模型（基于通义千问）
- 🛍️ 产品展示和购买系统
- 💳 微信/支付宝支付集成
- 👥 用户管理系统
- 📱 响应式设计，支持各种设备
- 🎨 科技感清洁设计风格

## 技术栈

- **前端**: React + TypeScript
- **后端**: Node.js + Express
- **数据库**: MongoDB
- **部署**: Zeabur

## 快速开始

1. 安装依赖
```bash
npm run install-all
```

2. 配置环境变量
```bash
cp .env.example .env
# 编辑 .env 文件，填入必要的配置信息
```

3. 启动开发服务器
```bash
npm run dev
```

4. 访问应用
- 前端: http://localhost:3000
- 后端: http://localhost:5000

## 项目结构

```
anwei网站/
├── client/                 # React前端
├── server/                 # Node.js后端
├── public/                 # 静态资源
├── docs/                   # 文档
└── README.md
```

## 环境变量配置

创建 `.env` 文件并配置以下变量：

```env
# 服务器配置
PORT=5000
NODE_ENV=development

# 数据库配置
MONGODB_URI=mongodb://localhost:27017/anwei

# JWT密钥
JWT_SECRET=your_jwt_secret

# 邮件配置
EMAIL_HOST=smtp.163.com
EMAIL_PORT=465
EMAIL_USER=13779447487@163.com
EMAIL_PASS=your_email_password

# 通义千问API配置
QWEN_API_KEY=your_qwen_api_key
QWEN_API_URL=https://dashscope.aliyuncs.com/api/v1

# 支付配置
WECHAT_QR_CODE=path_to_wechat_qr
ALIPAY_QR_CODE=path_to_alipay_qr
```

## 部署到Zeabur

1. 将代码推送到GitHub
2. 在Zeabur中连接GitHub仓库
3. 配置环境变量
4. 部署应用

## 许可证

MIT License 