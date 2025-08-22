const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { adminAuth } = require('../middleware/auth');
const Product = require('../models/Product');

// 确保产品图片上传目录存在
const productImagesDir = path.join(__dirname, '..', 'uploads', 'product_images');
if (!fs.existsSync(productImagesDir)) {
  fs.mkdirSync(productImagesDir, { recursive: true });
}

// 配置multer存储
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, productImagesDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = path.extname(file.originalname);
    // 使用产品名称或ID作为文件名的一部分
    const productIdentifier = req.body.productId || 'product';
    cb(null, `${productIdentifier}-${uniqueSuffix}${fileExtension}`);
  }
});

// 文件过滤器，只允许上传图片文件
const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('只允许上传图片文件'), false);
  }
};

// 创建multer实例
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB文件大小限制
  },
  fileFilter: fileFilter
});

// 上传产品图片
router.post('/upload', adminAuth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: '请选择要上传的图片' });
    }

    console.log('上传的文件信息:', req.file);
    console.log('产品ID:', req.body.productId);
    console.log('文件路径:', req.file.path);
    
    // 构建图片的URL路径 - 使用相对路径格式，避免跨域问题
    const imageUrl = `/uploads/product_images/${req.file.filename}`;
    
    // 如果提供了产品ID，更新产品的图片信息
    const { productId, type = 'main' } = req.body;
    if (productId) {
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ message: '产品不存在' });
      }
      
      // 确保images对象存在
      if (!product.images) {
        product.images = { main: '', gallery: [] };
      }
      
      if (type === 'main') {
        product.images.main = imageUrl;
      } else if (type === 'gallery') {
        // 如果是图库图片，添加到gallery数组
        if (!product.images.gallery) {
          product.images.gallery = [];
        }
        product.images.gallery.push(imageUrl);
      }
      
      await product.save();
      console.log('产品图片更新成功，图片URL:', imageUrl);
    }

    res.json({ message: '图片上传成功', imageUrl });
  } catch (error) {
    console.error('上传产品图片错误:', error);
    res.status(500).json({ message: '上传图片失败，请稍后重试' });
  }
});

// 删除产品图片
router.delete('/upload/:filename', adminAuth, async (req, res) => {
  try {
    const { filename } = req.params;
    const imagePath = path.join(productImagesDir, filename);
    
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
      res.json({ message: '图片删除成功' });
    } else {
      res.status(404).json({ message: '图片不存在' });
    }
  } catch (error) {
    console.error('删除产品图片错误:', error);
    res.status(500).json({ message: '删除图片失败' });
  }
});

module.exports = router;