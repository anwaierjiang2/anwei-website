// Vercel构建脚本 - 确保所有依赖正确安装

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('开始Vercel构建流程...');

try {
  // 清理npm缓存，避免缓存问题
  console.log('清理npm缓存...');
  execSync('npm cache clean --force', { stdio: 'inherit' });

  // 安装根目录依赖
  console.log('安装根目录依赖...');
  execSync('npm install', { stdio: 'inherit' });

  // 切换到client目录
  process.chdir(path.join(__dirname, 'client'));
  
  // 清理client目录npm缓存
  console.log('清理client目录npm缓存...');
  execSync('npm cache clean --force', { stdio: 'inherit' });

  // 单独安装react-scripts，确保它被正确安装
  console.log('单独安装react-scripts...');
  execSync('npm install react-scripts@5.0.1 --legacy-peer-deps', { stdio: 'inherit' });

  // 安装client目录的其他依赖
  console.log('安装client目录其他依赖...');
  execSync('npm install --legacy-peer-deps', { stdio: 'inherit' });

  // 确保react-scripts命令可用
  console.log('检查react-scripts是否可用...');
  execSync('npx react-scripts --version', { stdio: 'inherit' });

  // 执行构建命令
  console.log('执行构建命令...');
  execSync('npm run build', { stdio: 'inherit' });

  // 检查构建结果
  const buildPath = path.join(__dirname, 'client', 'build');
  if (fs.existsSync(buildPath)) {
    console.log('构建成功！build目录已创建。');
  } else {
    console.error('构建失败！build目录不存在。');
    process.exit(1);
  }

  console.log('Vercel构建流程完成！');
  process.exit(0);
} catch (error) {
  console.error('构建过程中发生错误:', error);
  process.exit(1);
}