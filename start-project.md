# anwei网站项目启动指南

## 🚀 快速启动

### 1. 安装依赖
```bash
# 安装后端依赖
npm install

# 安装前端依赖
cd client
npm install
cd ..
```

### 2. 环境配置
创建 `.env` 文件在项目根目录：
```env
# 服务器配置
PORT=5000
NODE_ENV=development

# 数据库配置
MONGODB_URI=mongodb://localhost:27017/anwei

# JWT密钥
JWT_SECRET=your_jwt_secret_key_here

# 邮件配置
EMAIL_HOST=smtp.163.com
EMAIL_PORT=465
EMAIL_USER=13779447487@163.com
EMAIL_PASS=your_email_password

# 通义千问API配置
QWEN_API_KEY=your_qwen_api_key
QWEN_API_URL=https://dashscope.aliyuncs.com/api/v1

# 管理员账号
ADMIN_EMAIL=13779447487@163.com
ADMIN_PASSWORD=151979aT
```

### 3. 启动项目
```bash
# 同时启动前端和后端
npm run dev

# 或者分别启动
npm run server    # 启动后端 (端口5000)
npm run client    # 启动前端 (端口3000)
```

## 📁 项目结构

```
anwei网站/
├── client/                 # React前端
│   ├── src/
│   │   ├── pages/         # 页面组件
│   │   ├── components/    # 通用组件
│   │   └── App.tsx        # 主应用
│   ├── package.json       # 前端依赖
│   └── tailwind.config.js # Tailwind配置
├── server/                 # Node.js后端
│   ├── models/            # 数据模型
│   ├── routes/            # API路由
│   ├── middleware/        # 中间件
│   ├── utils/             # 工具函数
│   └── index.js           # 服务器入口
├── package.json            # 后端依赖
└── README.md              # 项目说明
```

## 🔧 技术特性

### 前端特性
- ✅ React 18 + TypeScript
- ✅ Tailwind CSS (科技感设计)
- ✅ Framer Motion (流畅动画)
- ✅ 响应式设计
- ✅ 本地存储聊天记录
- ✅ 代码高亮和复制

### 后端特性
- ✅ Express.js + MongoDB
- ✅ JWT认证
- ✅ 通义千问API集成
- ✅ 邮件服务
- ✅ 文件上传
- ✅ 限流和安全防护

### AI聊天功能
- ✅ 流式响应
- ✅ 多模型支持
- ✅ 聊天历史管理
- ✅ 代码高亮显示
- ✅ Markdown渲染
- ✅ 本地数据存储

## 🌐 访问地址

- **前端**: http://localhost:3000
- **后端**: http://localhost:5000
- **健康检查**: http://localhost:5000/health

## 📧 管理员账号

- **邮箱**: 13779447487@163.com
- **密码**: 151979aT

## 🔑 需要配置的API密钥

### 通义千问API
1. 访问 [阿里云DashScope](https://dashscope.aliyun.com/)
2. 创建API Key
3. 在 `.env` 文件中配置 `QWEN_API_KEY`

### 邮件服务
1. 登录163邮箱
2. 开启SMTP服务
3. 获取授权码
4. 在 `.env` 文件中配置邮箱信息

## 🚀 部署到Zeabur

### 1. 准备部署
```bash
# 构建前端
npm run build

# 提交代码到GitHub
git add .
git commit -m "准备部署到Zeabur"
git push origin main
```

### 2. Zeabur部署步骤
1. 访问 [Zeabur](https://zeabur.com/)
2. 连接GitHub仓库
3. 配置环境变量
4. 部署应用

### 3. 环境变量配置
在Zeabur中配置以下环境变量：
- `MONGODB_URI`: MongoDB连接字符串
- `JWT_SECRET`: JWT密钥
- `QWEN_API_KEY`: 通义千问API密钥
- `EMAIL_HOST`, `EMAIL_USER`, `EMAIL_PASS`: 邮件配置

## 🐛 常见问题

### 1. 端口被占用
```bash
# 查看端口占用
netstat -ano | findstr :5000
netstat -ano | findstr :3000

# 杀死进程
taskkill /PID <进程ID> /F
```

### 2. MongoDB连接失败
- 确保MongoDB服务已启动
- 检查连接字符串是否正确
- 确认数据库权限设置

### 3. 前端无法访问后端
- 检查代理配置 (`client/package.json` 中的 `proxy`)
- 确认后端服务正在运行
- 检查CORS配置

### 4. AI聊天无响应
- 检查通义千问API密钥配置
- 确认网络连接正常
- 查看后端日志错误信息

## 📞 技术支持

如有问题，请联系：
- **邮箱**: 13779447487@163.com
- **项目**: anwei团队

## 🎯 下一步开发计划

1. **完善工具导航页面**
2. **添加产品展示和购买功能**
3. **集成支付系统**
4. **完善后台管理系统**
5. **添加用户反馈功能**
6. **优化性能和用户体验**

---

**祝您使用愉快！** 🎉 