const mongoose = require('mongoose');

const aiChatHistorySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  messages: [{
    role: {
      type: String,
      enum: ['user', 'assistant'],
      required: true
    },
    content: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    model: String
  }],
  model: {
    type: String,
    default: 'qwen-turbo'
  }
}, {
  timestamps: true
});

// 创建用户索引
aiChatHistorySchema.index({ user: 1 });
// 创建时间索引
aiChatHistorySchema.index({ updatedAt: -1 });

module.exports = mongoose.model('AIChatHistory', aiChatHistorySchema);