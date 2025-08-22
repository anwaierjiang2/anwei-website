const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  shortDescription: {
    type: String,
    required: true,
    maxlength: 200
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  originalPrice: {
    type: Number,
    min: 0
  },
  currency: {
    type: String,
    default: 'CNY',
    enum: ['CNY', 'USD']
  },
  images: {
    main: {
      type: String,
      required: true
    },
    gallery: [{
      type: String
    }]
  },
  category: {
    type: String,
    required: true,
    enum: ['网站建设', 'AI工具', '设计服务', '开发服务', '其他']
  },
  tags: [{
    type: String,
    trim: true
  }],
  features: [{
    title: String,
    description: String
  }],
  specifications: [{
    name: String,
    value: String
  }],
  isCustomizable: {
    type: Boolean,
    default: false
  },
  customizationOptions: [{
    name: String,
    description: String,
    additionalPrice: Number
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  stock: {
    type: Number,
    default: -1, // -1表示无限库存
    min: -1
  },
  viewCount: {
    type: Number,
    default: 0
  },
  salesCount: {
    type: Number,
    default: 0
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  ratingCount: {
    type: Number,
    default: 0
  },
  reviews: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    comment: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  taobaoLink: {
    type: String,
    default: ''
  },
  wechatQR: {
    type: String,
    default: ''
  },
  alipayQR: {
    type: String,
    default: ''
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// 搜索索引
productSchema.index({ name: 'text', description: 'text', tags: 'text' });

// 虚拟字段：折扣百分比
productSchema.virtual('discountPercentage').get(function() {
  if (this.originalPrice && this.originalPrice > this.price) {
    return Math.round(((this.originalPrice - this.price) / this.originalPrice) * 100);
  }
  return 0;
});

// 虚拟字段：平均评分
productSchema.virtual('averageRating').get(function() {
  return this.ratingCount > 0 ? (this.rating / this.ratingCount).toFixed(1) : 0;
});

// 确保虚拟字段被序列化
productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Product', productSchema); 