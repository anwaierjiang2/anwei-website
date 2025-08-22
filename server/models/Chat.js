const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  messages: [{
    sender: {
      type: String,
      enum: ['user', 'admin', 'system'],
      required: true
    },
    content: {
      type: String,
      required: true
    },
    read: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  status: {
    type: String,
    enum: ['active', 'waiting', 'closed'],
    default: 'active'
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

// 创建会话索引
chatSchema.index({ sessionId: 1 });
// 创建用户索引
chatSchema.index({ user: 1 });
// 创建管理员索引
chatSchema.index({ admin: 1 });
// 创建状态和更新时间的复合索引，优化管理员会话列表查询
chatSchema.index({ status: 1, updatedAt: -1 });
// 创建状态、更新时间和用户信息的复合索引，优化带搜索的管理员会话列表查询
chatSchema.index({ status: 1, updatedAt: -1, 'user.username': 1, 'user.email': 1 });

module.exports = mongoose.model('Chat', chatSchema);