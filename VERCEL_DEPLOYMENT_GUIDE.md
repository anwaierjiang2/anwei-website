# anwei 网站 Vercel 部署指南 🚀

## 📋 部署前准备

### 1. 确保代码提交到 GitHub
```bash
# 提交所有更改
git add .
git commit -m "优化 Vercel 部署配置"
git push origin main
```

### 2. 准备数据库
推荐使用 **MongoDB Atlas** (免费额度足够开发使用)：
- 访问 [MongoDB Atlas](https://www.mongodb.com/atlas)
- 创建免费集群
- 获取连接字符串 (MONGODB_URI)

## 🚀 Vercel 部署步骤

### 步骤 1: 登录 Vercel
1. 访问 [Vercel官网](https://vercel.com/)
2. 点击 "Continue with GitHub" 使用 GitHub 账号登录

### 步骤 2: 导入项目
1. 在 Vercel 控制台点击 "New Project"
2. 选择 "Import Git Repository"
3. 找到你的 `anwei--main` 仓库并点击 "Import"

### 步骤 3: 配置项目设置
在项目配置页面:
- **Framework Preset**: 选择 "Other"
- **Root Directory**: 保持默认 "./"
- **Build Command**: 保持默认 (会使用 vercel.json 中的配置)
- **Output Directory**: 保持默认 (会使用 vercel.json 中的配置)

### 步骤 4: 配置环境变量 ⚙️
在 "Environment Variables" 部分添加以下变量：

#### 必需的环境变量:
```
NODE_ENV = production
VERCEL = 1
MONGODB_URI = your_mongodb_atlas_connection_string
JWT_SECRET = your_secure_jwt_secret
QWEN_API_KEY = your_qwen_api_key
EMAIL_HOST = smtp.163.com
EMAIL_PORT = 465
EMAIL_USER = your_email@163.com
EMAIL_PASS = your_email_password
ADMIN_EMAIL = your_admin_email
ADMIN_PASSWORD = your_admin_password
```

#### 可选的环境变量:
```
QWEN_API_URL = https://dashscope.aliyuncs.com/api/v1
FORCE_HTTPS = true
LOG_LEVEL = info
MAX_UPLOAD_SIZE = 20
CACHE_DURATION = 3600
DISABLE_WEBSOCKET = true
```

### 步骤 5: 开始部署
1. 确认所有配置正确
2. 点击 "Deploy" 按钮
3. 等待部署完成 (首次部署约 3-5 分钟)

## 📊 部署后验证

### 1. 检查部署状态
- 部署成功后，Vercel 会提供一个 URL
- 访问该 URL 确认网站正常加载

### 2. 测试核心功能
- ✅ 首页加载
- ✅ 用户注册/登录
- ✅ AI 聊天功能
- ✅ 产品浏览
- ✅ 工具导航
- ✅ 管理员后台

### 3. 检查 API 连接
打开浏览器开发者工具，访问 `/api/health` 检查后端服务状态。

## 🔧 常见问题解决

### 问题 1: 构建失败
**症状**: 部署时构建步骤失败
**解决方案**:
1. 检查 GitHub 代码是否最新
2. 确认 `package.json` 依赖是否正确
3. 查看构建日志的具体错误信息

### 问题 2: 数据库连接失败
**症状**: API 请求返回 500 错误
**解决方案**:
1. 确认 `MONGODB_URI` 环境变量正确
2. 检查 MongoDB Atlas 网络访问设置 (允许所有 IP: 0.0.0.0/0)
3. 验证数据库用户权限

### 问题 3: 环境变量不生效
**症状**: 功能异常，如登录失败、邮件发送失败
**解决方案**:
1. 在 Vercel 控制台检查环境变量是否正确设置
2. 重新部署项目使环境变量生效
3. 确认变量名称拼写正确

### 问题 4: 静态文件访问失败
**症状**: 图片、CSS 或 JS 文件加载失败
**解决方案**:
1. 检查 `vercel.json` 路由配置
2. 确认构建输出目录正确
3. 验证静态资源路径

### 问题 5: WebSocket 功能不可用
**说明**: Vercel 不支持 WebSocket
**替代方案**:
- 使用 HTTP 轮询实现实时功能
- 集成第三方实时服务 (如 Pusher、Socket.IO Cloud)
- 考虑迁移到支持 WebSocket 的平台

## 🔄 版本更新流程

### 自动部署
Vercel 已配置自动部署，当你推送代码到 GitHub 时会自动触发部署:
```bash
git add .
git commit -m "更新功能"
git push origin main
```

### 手动重新部署
在 Vercel 控制台的项目页面：
1. 点击 "Deployments" 标签
2. 点击最新部署旁的 "..." 菜单
3. 选择 "Redeploy"

## 🌐 自定义域名 (可选)

### 添加自定义域名
1. 在 Vercel 项目设置中点击 "Domains"
2. 输入你的域名
3. 按照提示配置 DNS 记录
4. 等待 SSL 证书自动生成

## 📈 性能优化建议

1. **图片优化**: 使用 WebP 格式，启用 CDN
2. **缓存策略**: 利用 Vercel 的边缘缓存
3. **数据库优化**: 为常用查询添加索引
4. **监控**: 使用 Vercel Analytics 监控性能

## 🆘 获取帮助

如果遇到问题：
1. 查看 Vercel 部署日志
2. 检查浏览器开发者工具控制台
3. 参考 [Vercel 官方文档](https://vercel.com/docs)
4. 联系技术支持

---

🎉 **恭喜！** 你的 anwei 网站现在应该已成功部署到 Vercel 平台！

访问你的部署 URL，开始享受你的全栈应用吧！