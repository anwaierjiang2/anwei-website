#!/usr/bin/env node

/**
 * anwei网站生产环境启动脚本
 * 此脚本用于加载生产环境变量并启动服务器
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 检查是否安装了必要的依赖
function checkDependencies() {
  try {
    require('dotenv');
    require('express');
    require('mongoose');
    return true;
  } catch (err) {
    console.error('错误: 缺少必要的依赖，请先运行npm install');
    return false;
  }
}

// 检查Node.js版本
function checkNodeVersion() {
  const nodeVersion = process.version;
  const requiredMajorVersion = 16;
  const currentMajorVersion = parseInt(nodeVersion.split('.')[0].replace('v', ''));

  if (currentMajorVersion < requiredMajorVersion) {
    console.error(`错误: 需要Node.js ${requiredMajorVersion}+，当前版本是${nodeVersion}`);
    return false;
  }
  return true;
}

// 检查环境变量文件
function checkEnvFile() {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    console.log('已找到.env文件，正在加载环境变量...');
    require('dotenv').config();
    return true;
  } else {
    console.error('错误: 未找到.env文件，请先创建并配置环境变量');
    console.error('提示: 可以参考.env.production.example文件');
    return false;
  }
}

// 检查前端构建文件
function checkBuildFiles() {
  const buildPath = path.join(__dirname, 'client', 'build');
  if (fs.existsSync(buildPath)) {
    const indexHtmlPath = path.join(buildPath, 'index.html');
    if (fs.existsSync(indexHtmlPath)) {
      console.log('已找到前端构建文件');
      return true;
    }
  }
  console.error('错误: 未找到前端构建文件，请先运行npm run build');
  return false;
}

// 启动服务器
function startServer() {
  try {
    console.log('正在启动anwei网站服务器...');
    console.log(`服务器运行在端口: ${process.env.PORT || 5000}`);
    console.log(`环境: ${process.env.NODE_ENV || 'development'}`);

    // 启动服务器
    const server = require('./server/index.js');

    // 监听进程终止信号
    process.on('SIGINT', () => {
      console.log('正在关闭服务器...');
      process.exit(0);
    });

  } catch (err) {
    console.error('启动服务器时发生错误:', err);
    process.exit(1);
  }
}

// 主函数
function main() {
  console.log('===== anwei网站生产环境启动脚本 =====');

  // 检查Node.js版本
  if (!checkNodeVersion()) {
    process.exit(1);
  }

  // 检查依赖
  if (!checkDependencies()) {
    process.exit(1);
  }

  // 检查环境变量文件
  if (!checkEnvFile()) {
    process.exit(1);
  }

  // 检查前端构建文件
  if (!checkBuildFiles()) {
    process.exit(1);
  }

  // 启动服务器
  startServer();
}

// 执行主函数
main();