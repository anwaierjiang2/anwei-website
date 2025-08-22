const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { adminAuth } = require('../middleware/auth');
const Tool = require('../models/Tool');
const upload = require('../utils/upload'); // 使用现有的工具logo上传配置

// 确保工具logo上传目录存在
const toolLogosDir = path.join(__dirname, '..', 'uploads', 'tool_logos');
if (!fs.existsSync(toolLogosDir)) {
  fs.mkdirSync(toolLogosDir, { recursive: true });
}

// 上传工具logo
router.post('/upload', adminAuth, upload.single('logo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: '请选择要上传的logo图片' });
    }

    console.log('上传的logo文件信息:', req.file);
    console.log('工具ID:', req.body.toolId);
    console.log('文件路径:', req.file.path);
    
    // 构建logo的URL路径 - 使用相对路径格式，避免跨域问题
    const logoUrl = `/uploads/tool_logos/${req.file.filename}`;
    
    // 如果提供了工具ID，更新工具的logo信息
    const { toolId } = req.body;
    if (toolId) {
      const tool = await Tool.findById(toolId);
      if (!tool) {
        return res.status(404).json({ message: '工具不存在' });
      }
      
      // 更新工具的logo URL
      tool.logo = logoUrl;
      await tool.save();
      console.log('工具logo更新成功，图片URL:', logoUrl);
    }

    res.json({ message: 'logo上传成功', logoUrl });
  } catch (error) {
    console.error('上传工具logo错误:', error);
    res.status(500).json({ message: '上传logo失败，请稍后重试' });
  }
});

// 删除工具logo
router.delete('/upload/:filename', adminAuth, async (req, res) => {
  try {
    const { filename } = req.params;
    const logoPath = path.join(toolLogosDir, filename);
    
    if (fs.existsSync(logoPath)) {
      fs.unlinkSync(logoPath);
      res.json({ message: 'logo删除成功' });
    } else {
      res.status(404).json({ message: 'logo不存在' });
    }
  } catch (error) {
    console.error('删除工具logo错误:', error);
    res.status(500).json({ message: '删除logo失败' });
  }
});

module.exports = router;