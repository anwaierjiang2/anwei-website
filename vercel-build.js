// Vercel构建脚本 - 优化版

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('开始Vercel构建流程...');

try {
  // 设置NPM配置，增加构建稳定性
  process.env.NODE_ENV = 'production';
  
  // 安装根目录依赖
  console.log('安装根目录依赖...');
  execSync('npm install --legacy-peer-deps --force', { stdio: 'inherit' });

  // 切换到client目录
  const clientDir = path.join(__dirname, 'client');
  console.log(`切换到客户端目录: ${clientDir}`);
  process.chdir(clientDir);
  
  // 安装client目录依赖 - 不单独安装react-scripts
  console.log('安装客户端依赖...');
  execSync('npm install --legacy-peer-deps --force', { stdio: 'inherit' });
  
  // 直接使用node_modules中的react-scripts
  console.log('执行构建命令...');
  const reactScriptsPath = path.join(clientDir, 'node_modules', 'react-scripts', 'bin', 'react-scripts.js');
  if (fs.existsSync(reactScriptsPath)) {
    console.log(`找到react-scripts: ${reactScriptsPath}`);
    execSync(`node ${reactScriptsPath} build`, { stdio: 'inherit' });
  } else {
    console.log('未找到react-scripts.js，尝试使用npm run build');
    execSync('npm run build', { stdio: 'inherit' });
  }

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