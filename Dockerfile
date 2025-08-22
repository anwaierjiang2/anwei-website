# 使用Node.js官方镜像作为基础镜像
FROM node:18-alpine AS builder

# 设置工作目录
WORKDIR /app

# 复制项目根目录下的package.json和package-lock.json
COPY package*.json ./

# 安装后端依赖
RUN npm install

# 复制client目录下的package.json和package-lock.json
COPY client/package*.json client/

# 安装前端依赖
RUN cd client && npm install

# 复制所有项目文件
COPY . .

# 构建前端应用
RUN cd client && npm run build

# 生产环境镜像
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 复制package.json和package-lock.json
COPY package*.json ./

# 只安装生产依赖
RUN npm install --production

# 从构建阶段复制构建好的前端文件
COPY --from=builder /app/client/build ./client/build

# 复制服务器代码
COPY server/ ./server/

# 复制启动脚本
COPY start-production.js .

# 暴露端口
EXPOSE 5000

# 设置环境变量
ENV NODE_ENV=production

# 启动应用
CMD ["node", "start-production.js"]