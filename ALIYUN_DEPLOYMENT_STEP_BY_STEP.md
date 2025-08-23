# anwei网站阿里云详细部署指南（小白版）

这份指南专为对服务器部署不太熟悉的小白用户准备，我们会一步一步详细说明如何在阿里云服务器上部署anwei网站。

## 准备工作

在开始之前，你需要准备以下内容：
- 一个阿里云账号（如果没有，可以先注册）
- 一个域名（可选，如果没有域名，可以先使用IP地址访问）
- 基本的电脑操作能力

## 第一部分：阿里云服务器购买与配置

### 步骤1：登录阿里云官网

1. 打开浏览器，访问阿里云官网：https://www.aliyun.com/
2. 点击右上角的"登录"按钮，输入你的账号密码登录

### 步骤2：购买云服务器ECS

1. 登录成功后，在顶部搜索栏搜索"云服务器ECS"并点击进入
2. 点击"立即购买"按钮
3. 在配置页面，按以下步骤选择配置：

   **区域选择**：
   - 选择离你目标用户最近的区域（例如：华东1（杭州））
   - 可用区选择默认即可

   **实例规格**：
   - 点击"通用型"或"入门级"标签
   - 推荐选择：2核4G或4核8G内存的实例（例如：ecs.t6-c2m4.large）
   - 带宽：选择"按固定带宽"，建议2Mbps以上

   **镜像**：
   - 选择"公共镜像"
   - 操作系统：选择CentOS 7.x或Ubuntu 20.04 LTS
   - 系统盘：选择SSD云盘，40GB以上

   **存储**（可选）：
   - 可以添加一个数据盘，建议100GB

   **网络与安全组**：
   - 网络：选择默认的VPC网络
   - 安全组：选择默认安全组，后面我们会修改规则
   - 弹性公网IP：选择"分配固定公网IP"

   **登录凭证**：
   - 选择"自定义密码"
   - 设置一个安全的密码（请记住这个密码，后面登录服务器会用到）

   **实例名称**：
   - 给你的服务器起个名字，例如：anwei-server

4. 确认订单信息，点击"立即购买"并完成支付

### 步骤3：配置安全组规则

1. 购买成功后，返回ECS管理控制台
2. 在左侧菜单中，点击"实例与镜像" -> "实例"
3. 找到你刚刚购买的实例，点击其右侧的"管理"按钮
4. 在左侧菜单中，点击"本实例安全组"
5. 点击"配置规则"按钮
6. 点击"入方向" -> "添加安全组规则"
7. 依次添加以下规则（每添加一条点击"确定"）：
   - 端口范围：22，授权对象：0.0.0.0/0，描述：SSH远程连接
   - 端口范围：80，授权对象：0.0.0.0/0，描述：HTTP网站访问
   - 端口范围：443，授权对象：0.0.0.0/0，描述：HTTPS网站访问
   - 端口范围：5000，授权对象：0.0.0.0/0，描述：应用服务端口
   - 端口范围：27017，授权对象：0.0.0.0/0，描述：MongoDB数据库（如果只想内部访问，可以不添加）

## 第二部分：连接服务器

### 步骤1：获取服务器公网IP

1. 回到ECS实例管理页面
2. 在你的实例列表中，找到"公网IP地址"列，复制这个IP地址

### 步骤2：使用SSH工具连接服务器

对于Windows系统用户，我们推荐使用PuTTY工具连接服务器：

1. 下载并安装PuTTY（https://www.putty.org/）
2. 打开PuTTY软件
3. 在"Host Name (or IP address)"输入框中，粘贴你刚才复制的服务器公网IP
4. 确保"Port"设置为22
5. 点击"Open"按钮
6. 当出现"login as:"提示时，输入"root"
7. 当出现"Password:"提示时，输入你在购买服务器时设置的密码（输入时屏幕不会显示密码，这是正常的）
8. 成功登录后，你会看到类似`[root@your-server ~]#`的提示符

## 第三部分：安装必要的软件

### 步骤1：更新系统软件包

在命令行中输入以下命令，然后按回车键：

```bash
yum update -y
```

这个命令会更新服务器上的所有软件包到最新版本，可能需要等待几分钟。

### 步骤2：安装Node.js 16

输入以下命令安装Node.js：

```bash
curl -sL https://rpm.nodesource.com/setup_16.x | bash -
yum install -y nodejs
```

安装完成后，我们来验证一下是否安装成功：

```bash
node -v
npm -v
```

如果看到版本号输出，说明Node.js安装成功了。

### 步骤3：安装MongoDB数据库

输入以下命令安装MongoDB：

```bash
# 创建MongoDB源文件
touch /etc/yum.repos.d/mongodb-org-4.4.repo
cat << EOF > /etc/yum.repos.d/mongodb-org-4.4.repo
[mongodb-org-4.4]
name=MongoDB Repository
baseurl=https://repo.mongodb.org/yum/redhat/7/mongodb-org/4.4/x86_64/
gpgcheck=1
enabled=1
gpgkey=https://www.mongodb.org/static/pgp/server-4.4.asc
EOF

# 安装MongoDB
yum install -y mongodb-org

# 启动MongoDB并设置开机自启
systemctl start mongod
systemctl enable mongod
```

验证MongoDB是否安装成功：

```bash
systemctl status mongod
```

如果看到"active (running)"的字样，说明MongoDB已经成功启动了。

### 步骤4：安装Git

输入以下命令安装Git：

```bash
yum install -y git
```

验证Git是否安装成功：

```bash
git --version
```

## 第四部分：部署anwei网站

### 步骤1：创建项目目录

输入以下命令创建网站目录：

```bash
mkdir -p /data/www
cd /data/www
```

### 步骤2：克隆项目代码

输入以下命令克隆anwei网站的代码：

```bash
# 请将下面的URL替换为实际的代码仓库地址
git clone https://github.com/your-username/anwei-website.git
cd anwei-website
```

### 步骤3：安装项目依赖

首先安装根目录的依赖：

```bash
npm install --legacy-peer-deps --force
```

然后安装前端依赖：

```bash
cd client
npm install --legacy-peer-deps --force
cd ..
```

### 步骤4：构建前端项目

输入以下命令构建前端代码：

```bash
npm run build
```

这个命令会在`client/build`目录下生成优化后的前端静态文件。

### 步骤5：配置环境变量

首先，我们需要创建一个`.env`文件：

```bash
cp .env.production.example .env
```

然后，我们需要编辑这个文件来配置环境变量。这里我们使用nano编辑器：

```bash
nano .env
```

在打开的编辑器中，我们需要修改以下内容（使用键盘上的方向键移动光标）：

```
# 服务器配置
PORT=5000
NODE_ENV=production

# 数据库配置
MONGODB_URI=mongodb://localhost:27017/anwei

# JWT密钥（请使用一个安全的随机字符串，例如：abcdefghijklmnopqrstuvwxyz1234567890）
JWT_SECRET=your_secure_jwt_secret_key_here

# 邮件配置（可选，暂时可以不填）
#EMAIL_HOST=
#EMAIL_PORT=
#EMAIL_USER=
#EMAIL_PASS=

# 通义千问API配置（可选，暂时可以不填）
#QWEN_API_KEY=
```

修改完成后，按`Ctrl + O`保存文件，然后按`Ctrl + X`退出编辑器。

### 步骤6：初始化管理员账户

输入以下命令创建管理员账户：

```bash
node server/init-admin.js
```

执行完成后，控制台会显示一个默认的管理员用户名和密码，请妥善保存这个信息，后面登录后台管理系统会用到。

## 第五部分：使用PM2管理应用

### 步骤1：安装PM2

PM2是一个Node.js应用进程管理器，可以确保我们的网站一直在运行。输入以下命令安装PM2：

```bash
npm install -g pm2
```

### 步骤2：使用PM2启动网站

输入以下命令启动anwei网站：

```bash
# 先确保我们在项目根目录
cd /data/www/anwei-website

# 使用生产环境启动脚本
node start-production.js
```

这个脚本会自动检查环境变量、依赖和前端构建文件，然后启动服务器。

如果看到类似"服务器运行在端口: 5000"的提示，说明服务器已经成功启动了。

现在，我们可以使用PM2来管理这个进程：

```bash
# 按Ctrl + C停止当前运行的服务器

# 使用PM2启动
pm run build
npm run start:pm2

# 保存当前进程列表，实现开机自启
pm run build
npm run start:pm2

# 设置PM2开机自启
pm run build
npm run start:pm2
```

## 第六部分：配置Nginx作为反向代理

### 步骤1：安装Nginx

Nginx可以帮助我们更好地处理HTTP请求，提高网站性能。输入以下命令安装Nginx：

```bash
yum install -y nginx
systemctl start nginx
systemctl enable nginx
```

### 步骤2：配置Nginx代理

输入以下命令创建Nginx配置文件：

```bash
nano /etc/nginx/conf.d/anwei.conf
```

在打开的编辑器中，粘贴以下内容（请将`your-domain.com`替换为你的实际域名，如果没有域名，可以使用服务器的公网IP）：

```nginx
server {
    listen 80;
    server_name your-domain.com;  # 替换为你的域名或服务器IP

    location / {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 文件上传目录
    location /uploads/ {
        alias /data/www/anwei-website/server/uploads/;
    }

    # 二维码目录
    location /qrcodes/ {
        alias /data/www/anwei-website/server/public/qrcodes/;
    }
}
```

粘贴完成后，按`Ctrl + O`保存文件，然后按`Ctrl + X`退出编辑器。

### 步骤3：检查并重启Nginx

输入以下命令检查Nginx配置是否正确：

```bash
nginx -t
```

如果看到"nginx: configuration file /etc/nginx/nginx.conf test is successful"的提示，说明配置没有问题。

然后，输入以下命令重启Nginx：

```bash
systemctl restart nginx
```

## 第七部分：测试网站

现在，我们可以测试网站是否已经成功部署了。

1. 打开浏览器，输入你的域名或服务器IP地址
2. 如果一切正常，你应该能看到anwei网站的首页
3. 尝试点击一些链接，测试网站的功能是否正常
4. 访问`http://你的域名/admin`，使用之前初始化的管理员账户登录后台，检查管理功能

## 第八部分：常见问题与解决方案

### 问题1：无法访问网站

**可能原因**：
- 安全组规则未正确配置
- Nginx未启动
- 应用服务未启动

**解决方案**：
1. 检查安全组规则是否开放了80端口
2. 检查Nginx是否运行：`systemctl status nginx`
3. 检查应用服务是否运行：`pm2 list`

### 问题2：数据库连接失败

**可能原因**：
- MongoDB服务未启动
- `.env`文件中的数据库连接字符串配置错误

**解决方案**：
1. 检查MongoDB是否运行：`systemctl status mongod`
2. 检查`.env`文件中的MONGODB_URI配置

### 问题3：前端页面无法加载或样式错乱

**可能原因**：
- 前端项目未正确构建
- Nginx配置错误

**解决方案**：
1. 重新构建前端项目：`npm run build`
2. 检查Nginx配置文件

### 问题4：上传文件失败

**可能原因**：
- 文件权限问题
- Nginx配置中的文件路径错误

**解决方案**：
1. 检查uploads目录的权限：`chmod -R 755 /data/www/anwei-website/server/uploads`
2. 检查Nginx配置中的文件路径

## 第九部分：进阶配置（可选）

### 配置HTTPS

为了提高网站的安全性，我们建议配置HTTPS。阿里云提供了免费的SSL证书服务：

1. 登录阿里云控制台，搜索并进入"SSL证书"服务
2. 申请免费的SSL证书
3. 证书申请成功后，下载证书文件
4. 将证书文件上传到服务器
5. 修改Nginx配置文件，添加SSL相关配置

### 配置备份策略

为了防止数据丢失，我们建议定期备份数据库：

```bash
# 创建备份目录
mkdir -p /data/backup/mongodb

# 备份数据库
mongodump --db anwei --out /data/backup/mongodb/$(date +%Y%m%d)
```

你可以将这个命令添加到定时任务中，实现自动备份。

## 总结

通过以上步骤，你已经成功在阿里云服务器上部署了anwei网站。如果你在部署过程中遇到任何问题，请参考"常见问题与解决方案"部分，或者联系技术支持。

祝你使用愉快！