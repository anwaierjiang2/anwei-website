# anwei网站部署指南

## 1. 环境准备

### 1.1 系统要求
- Node.js 16+ (推荐16.18.0)
- MongoDB 4.4+ 
- npm 8+或yarn
- 具备SSL证书(可选，推荐用于生产环境)

### 1.2 环境变量配置
在生产环境中，需要设置以下环境变量(可通过`.env`文件或系统环境变量设置)：

```
# 服务器配置
PORT=5000
NODE_ENV=production

# 数据库配置
MONGODB_URI=mongodb://[用户名:密码@]数据库地址:端口/数据库名

# JWT密钥(请使用安全的随机字符串)
JWT_SECRET=your_secure_jwt_secret

# 邮件配置
EMAIL_HOST=smtp.example.com
EMAIL_PORT=465
EMAIL_USER=your_email@example.com
EMAIL_PASS=your_email_password

# 通义千问API配置
QWEN_API_KEY=your_qwen_api_key
QWEN_API_URL=https://dashscope.aliyuncs.com/api/v1
```

> **注意**：生产环境中请不要使用开发环境的密钥和密码，确保所有敏感信息安全存储。

## 2. 项目构建

### 2.1 安装依赖
```bash
# 安装根目录依赖
npm install

# 安装前端依赖
cd client
npm install
cd ..
```

### 2.2 构建前端项目
```bash
# 构建生产环境前端代码
npm run build
```
这将在`client/build`目录下生成优化后的前端静态文件。

## 3. 数据库准备

### 3.1 数据库备份(可选)
如果是迁移现有数据，建议先备份：
```bash
mongodump --db anwei --out /path/to/backup
```

### 3.2 初始化管理员账户
首次部署需要初始化管理员账户：
```bash
node server/init-admin.js
```
这将创建一个默认管理员账户，用户名和密码会显示在控制台。

## 4. 部署步骤

### 4.1 生产环境启动
```bash
# 设置环境变量(或使用.env文件)
NODE_ENV=production

# 启动服务器
npm start
```

### 4.2 使用PM2进程管理(推荐)
为了确保应用稳定运行，推荐使用PM2：
```bash
# 安装PM2
npm install -g pm2

# 启动应用
pm run build
pm run start:pm2
```

### 4.3 Nginx配置(推荐)
使用Nginx作为反向代理：
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 重定向到HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name your-domain.com;

    # SSL证书配置
    ssl_certificate /path/to/ssl/fullchain.pem;
    ssl_certificate_key /path/to/ssl/privkey.pem;

    location / {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 文件上传目录
    location /uploads/ {
        alias /path/to/anwei-website/server/uploads/;
    }

    # 二维码目录
    location /qrcodes/ {
        alias /path/to/anwei-website/server/public/qrcodes/;
    }
}
```

## 5. 部署后检查

1. 访问`https://your-domain.com`，确保网站正常加载
2. 登录管理员账户，检查系统设置和数据是否正常
3. 测试核心功能：产品浏览、工具查看、用户注册/登录等
4. 检查API限流是否正常工作
5. 验证邮件通知功能

## 6. 常见问题

1. **数据库连接失败**：检查MONGODB_URI是否正确，MongoDB服务是否运行
2. **前端静态文件无法访问**：确保`npm run build`已执行，检查文件权限
3. **API请求报错**：检查环境变量是否设置正确，特别是JWT_SECRET
4. **端口冲突**：确保PORT环境变量设置的端口未被占用

## 7. 版本更新流程
1. 拉取最新代码
2. 安装依赖(`npm install`)
3. 构建前端(`npm run build`)
4. 重启服务器

希望这份指南能帮助您顺利部署anwei网站！如有任何问题，请联系技术支持。