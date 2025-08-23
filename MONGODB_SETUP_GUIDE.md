# MongoDB 连接字符串快速获取指南

## 方案 1: 使用 Railway (推荐，国内可访问)

### 步骤：
1. 访问 https://railway.app/
2. 使用 GitHub 登录
3. 创建新项目
4. 添加 MongoDB 模板
5. 获取连接字符串

### 连接字符串格式：
```
mongodb://mongo:password@container-name.railway.internal:27017
```

## 方案 2: 使用国内阿里云 MongoDB

### 步骤：
1. 访问 https://www.aliyun.com/product/mongodb
2. 选择按量付费（可免费试用）
3. 创建实例
4. 获取内网连接地址

### 连接字符串格式：
```
mongodb://root:password@dds-xxx.mongodb.rds.aliyuncs.com:3717/anwei
```

## 方案 3: 本地 MongoDB + 免费内网穿透

### 安装 MongoDB：
```bash
# Windows (使用 chocolatey)
choco install mongodb

# 或下载安装包
# https://www.mongodb.com/try/download/community
```

### 启动服务：
```bash
# Windows
net start MongoDB

# 手动启动
mongod --dbpath C:\data\db
```

### 使用 Ngrok 暴露：
```bash
# 安装 ngrok
npm install -g ngrok

# 暴露 MongoDB 端口
ngrok tcp 27017
```

### 连接字符串：
```
mongodb://0.tcp.ngrok.io:port/anwei
```

## 方案 4: 临时使用示例连接字符串（仅测试）

如果只是想快速测试部署，可以暂时使用：
```
mongodb://localhost:27017/anwei
```

⚠️ 注意：这只适用于开发环境，生产环境会报错

## 推荐选择

**最推荐**: Railway (免费，稳定，国内可访问)
**备选**: 阿里云 MongoDB (付费但稳定)
**开发测试**: 本地 MongoDB + Ngrok