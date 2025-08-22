# GitHub仓库推送指南

## 准备工作

1. **确保已安装Git**
   - 检查是否安装了Git：打开命令提示符（CMD）并运行 `git --version`
   - 如果未安装，请访问 [Git官网](https://git-scm.com/downloads) 下载并安装

2. **创建GitHub账号**
   - 如果你还没有GitHub账号，请访问 [GitHub官网](https://github.com/) 注册

3. **在GitHub上创建新仓库**
   - 登录GitHub后，点击右上角的"+"图标，选择"New repository"
   - 为仓库命名（推荐使用"anwei-website"）
   - 选择仓库可见性（公开或私有）
   - 不要勾选"Initialize this repository with a README"、".gitignore"或"license"
   - 点击"Create repository"

## 推送代码步骤

### 1. 初始化Git仓库（如果尚未初始化）

打开命令提示符（CMD）或PowerShell，导航到项目根目录：

```bash
cd f:\开发项目\anwei网站
```

初始化Git仓库：

```bash
git init
```

### 2. 添加所有文件到暂存区

```bash
git add .
```

### 3. 提交更改

```bash
git commit -m "Initial commit of anwei website project"
```

### 4. 链接到GitHub仓库

复制GitHub仓库页面上的远程仓库URL（HTTPS或SSH链接），然后运行：

```bash
git remote add origin 你的GitHub仓库URL
```

例如：
```bash
git remote add origin https://github.com/你的用户名/anwei-website.git
```

### 5. 推送代码到GitHub

```bash
git push -u origin main
```

如果提示输入GitHub用户名和密码：
- 对于HTTPS链接：输入你的GitHub用户名和[个人访问令牌](https://github.com/settings/tokens)（不推荐使用密码）
- 对于SSH链接：确保你的SSH密钥已正确配置

## 常见问题及解决方案

### 1. 推送失败，提示权限被拒绝
- 确认你使用的凭据（用户名/密码或SSH密钥）有足够的权限访问该仓库
- 检查远程仓库URL是否正确

### 2. 找不到git命令
- 确认Git已正确安装
- 检查环境变量是否包含Git的安装路径
- 尝试重启命令提示符或PowerShell

### 3. 推送时出现冲突
- 如果你在GitHub上初始化了仓库，请先拉取远程变更：`git pull origin main --rebase`
- 解决任何合并冲突，然后再次提交和推送

### 4. 无法添加某些文件
- 检查`.gitignore`文件，确认是否有文件被忽略
- 如果你确实需要添加被忽略的文件，可以使用：`git add -f 文件名`

## 后续更新流程

当你对项目进行更改后，可以按照以下步骤更新GitHub仓库：

1. 添加更改的文件：
   ```bash
   git add .
   ```

2. 提交更改：
   ```bash
   git commit -m "描述你的更改"
   ```

3. 推送到GitHub：
   ```bash
   git push origin main
   ```

---

完成这些步骤后，你的anwei网站项目代码应该已成功推送到GitHub仓库。然后你就可以按照<mcfile name="ZEABUR_DEPLOYMENT.md" path="f:\开发项目\anwei网站\ZEABUR_DEPLOYMENT.md"></mcfile>中的步骤，将代码部署到Zeabur平台。