const express = require('express');
const axios = require('axios');
const Chat = require('../models/Chat');
const { auth, adminAuth } = require('../middleware/auth');
const router = express.Router();

// 通义千问API配置
// 通义千问API配置
const QWEN_API_URL = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation';
const QWEN_API_KEY = process.env.QWEN_API_KEY;

// 流式聊天接口
router.post('/stream', async (req, res) => {
  try {
    const { messages, prompt, model = 'qwen-turbo' } = req.body;
    console.log('接收到的请求参数(流式):', { messages, prompt, model });

    if (!QWEN_API_KEY) {
      return res.status(500).json({ message: 'AI服务未配置' });
    }

    // 构建请求数据 - 使用通义千问API的正确格式
    const requestData = {
      model: model,
      stream: true,
      parameters: {
        temperature: 0.7,
        top_p: 0.8,
        max_tokens: 2048
      },
      input: {
        messages: []
      }
    };
    
    // 构建messages参数
    if (messages && Array.isArray(messages) && messages.length > 0) {
      // 如果提供了messages，直接使用
      requestData.input.messages = messages;
    } else if (prompt) {
      // 如果只提供了prompt，转换为messages格式
      requestData.input.messages = [{ role: "user", content: prompt }];
    } else {
      return res.status(400).json({ message: '请输入对话内容' });
    }

    // 设置响应头，启用流式传输
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // 添加详细日志调试
    console.log('发送给AI API的数据(流式):', JSON.stringify(requestData, null, 2));

    // 调用通义千问API
    console.log(`调用API: ${QWEN_API_URL}`);
    console.log('请求头:', {
      'Authorization': `Bearer ${QWEN_API_KEY.slice(0, 5)}...`,
      'Content-Type': 'application/json'
    });
    
    const response = await axios.post(
      QWEN_API_URL,
      requestData,
      {
        headers: {
          'Authorization': `Bearer ${QWEN_API_KEY}`,
          'Content-Type': 'application/json',
          'X-DashScope-SSE': 'enable'
        },
        responseType: 'stream'
      }
    );

    // 流式传输响应
    response.data.on('data', (chunk) => {
      const lines = chunk.toString().split('\n');
      
      lines.forEach(line => {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            res.end();
            return;
          }
          
          try {
            const parsed = JSON.parse(data);
            if (parsed.choices && parsed.choices[0] && parsed.choices[0].delta) {
              const content = parsed.choices[0].delta.content;
              if (content) {
                res.write(content);
              }
            }
          } catch (e) {
            // 忽略解析错误
          }
        }
      });
    });

    response.data.on('end', () => {
      res.end();
    });

    response.data.on('error', (error) => {
      console.error('流式响应错误:', error);
      res.status(500).json({ message: 'AI响应出错' });
    });

  } catch (error) {
    console.error('AI聊天错误:', error);
    
    if (error.response) {
      // API错误响应
      const status = error.response.status;
      const message = error.response.data?.message || 'AI服务请求失败';
      
      if (status === 401) {
        return res.status(401).json({ message: 'AI服务认证失败，请检查API密钥' });
      } else if (status === 429) {
        return res.status(429).json({ message: 'AI服务请求过于频繁，请稍后再试' });
      } else if (status >= 500) {
        return res.status(503).json({ message: 'AI服务暂时不可用，请稍后再试' });
      } else {
        return res.status(status).json({ message });
      }
    }
    
    res.status(500).json({ message: 'AI服务连接失败，请稍后再试' });
  }
});

// 普通聊天接口（非流式）
router.post('/', async (req, res) => {
  try {
    const { messages, prompt, model = 'qwen-turbo' } = req.body;
    console.log('接收到的请求参数:', { messages, prompt, model });

    if (!QWEN_API_KEY) {
      return res.status(500).json({ message: 'AI服务未配置' });
    }

    // 构建请求数据 - 使用通义千问API的正确格式
    const requestData = {
      model: model,
      stream: false,
      parameters: {
        temperature: 0.7,
        top_p: 0.8,
        max_tokens: 2048
      },
      input: {
        messages: []
      }
    };
    
    // 构建messages参数
    if (messages && Array.isArray(messages) && messages.length > 0) {
      // 如果提供了messages，直接使用
      requestData.input.messages = messages;
    } else if (prompt) {
      // 如果只提供了prompt，转换为messages格式
      requestData.input.messages = [{ role: "user", content: prompt }];
    } else {
      return res.status(400).json({ message: '请输入对话内容' });
    }

    // 添加详细日志调试
    console.log('发送给AI API的数据:', JSON.stringify(requestData, null, 2));

    // 调用通义千问API
    const response = await axios.post(
      QWEN_API_URL,
      requestData,
      {
        headers: {
          'Authorization': `Bearer ${QWEN_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const result = response.data;
    
    // 添加详细的响应日志
    console.log('API响应状态码:', response.status);
    console.log('API完整响应数据:', JSON.stringify(result, null, 2));
    
    // 根据通义千问API的实际响应格式处理
    if (result.output && result.output.text) {
      res.json({
        message: result.output.text,
        usage: result.usage,
        model: 'anwei模型' // 对外显示为anwei模型
      });
    } else {
      res.status(500).json({ message: 'AI响应格式错误' });
    }

  } catch (error) {
    console.error('AI聊天错误:', error);
    
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.message || 'AI服务请求失败';
      
      if (status === 401) {
        return res.status(401).json({ message: 'AI服务认证失败，请检查API密钥' });
      } else if (status === 429) {
        return res.status(429).json({ message: 'AI服务请求过于频繁，请稍后再试' });
      } else if (status >= 500) {
        return res.status(503).json({ message: 'AI服务暂时不可用，请稍后再试' });
      } else {
        return res.status(status).json({ message });
      }
    }
    
    res.status(500).json({ message: 'AI服务连接失败，请稍后再试' });
  }
});

// 获取支持的模型列表
router.get('/models', (req, res) => {
  res.json({
    models: [
      {
        id: 'qwen-turbo',
        name: 'anwei模型 - 快速版',
        description: '快速响应的AI助手，适合日常对话和简单任务',
        maxTokens: 2048
      },
      {
        id: 'qwen-plus',
        name: 'anwei模型 - 增强版',
        description: '更强大的AI助手，适合复杂任务和创意工作',
        maxTokens: 4096
      },
      {
        id: 'qwen-max',
        name: 'anwei模型 - 专业版',
        description: '最强大的AI助手，适合专业工作和深度分析',
        maxTokens: 8192
      }
    ]
  });
});

// AI聊天历史管理
const AIChatHistory = require('../models/AIChatHistory');

// 获取用户的所有AI聊天历史
router.get('/ai-history', auth, async (req, res) => {
  try {
    const history = await AIChatHistory.find({ user: req.user.userId })
      .sort({ updatedAt: -1 })
      .select('-__v');
    res.json({ history });
  } catch (error) {
    console.error('获取聊天历史失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 创建新的AI聊天历史
router.post('/ai-history', auth, async (req, res) => {
  try {
    const { title, messages, model = 'qwen-turbo' } = req.body;
    
    if (!title || !messages || !Array.isArray(messages)) {
      return res.status(400).json({ message: '缺少必要的参数' });
    }
    
    const newHistory = new AIChatHistory({
      user: req.user.userId,
      title,
      messages,
      model
    });
    
    await newHistory.save();
    res.status(201).json({ history: newHistory });
  } catch (error) {
    console.error('创建聊天历史失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取特定的AI聊天历史
router.get('/ai-history/:id', auth, async (req, res) => {
  try {
    const history = await AIChatHistory.findOne({
      _id: req.params.id,
      user: req.user.userId
    }).select('-__v');
    
    if (!history) {
      return res.status(404).json({ message: '聊天历史不存在' });
    }
    
    res.json({ history });
  } catch (error) {
    console.error('获取聊天历史失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 更新AI聊天历史
router.put('/ai-history/:id', auth, async (req, res) => {
  try {
    const { title, messages, model } = req.body;
    
    const history = await AIChatHistory.findOneAndUpdate(
      {
        _id: req.params.id,
        user: req.user.userId
      },
      {
        $set: {
          ...(title && { title }),
          ...(messages && { messages }),
          ...(model && { model }),
          updatedAt: Date.now()
        }
      },
      { new: true, runValidators: true }
    ).select('-__v');
    
    if (!history) {
      return res.status(404).json({ message: '聊天历史不存在' });
    }
    
    res.json({ history });
  } catch (error) {
    console.error('更新聊天历史失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 删除AI聊天历史
router.delete('/ai-history/:id', auth, async (req, res) => {
  try {
    const history = await AIChatHistory.findOneAndDelete({
      _id: req.params.id,
      user: req.user.userId
    });
    
    if (!history) {
      return res.status(404).json({ message: '聊天历史不存在' });
    }
    
    res.json({ message: '聊天历史已删除' });
  } catch (error) {
    console.error('删除聊天历史失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 清除用户的所有AI聊天历史
router.delete('/ai-history', auth, async (req, res) => {
  try {
    await AIChatHistory.deleteMany({ user: req.user.userId });
    res.json({ message: '所有聊天历史已清除' });
  } catch (error) {
    console.error('清除聊天历史失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 客服聊天系统 API

// 1. 创建聊天会话
router.post('/session', auth, async (req, res) => {
  try {
    const { initialMessage } = req.body;
    const userId = req.user.userId;
    
    // 生成唯一的sessionId
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // 创建新会话
    const newChat = new Chat({
      sessionId,
      user: userId,
      messages: initialMessage ? [{ sender: 'user', content: initialMessage }] : [],
      status: 'waiting'
    });
    
    await newChat.save();
    
    res.json({ 
      message: '会话创建成功',
      sessionId: newChat.sessionId,
      chatId: newChat._id 
    });
  } catch (error) {
    console.error('创建会话错误:', error);
    res.status(500).json({ message: '创建会话失败' });
  }
});

// 2. 获取用户聊天会话列表
router.get('/sessions', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const sessions = await Chat.find({ user: userId })
      .sort({ updatedAt: -1 })
      .populate('admin', 'username')
      .lean();
    
    res.json({ sessions });
  } catch (error) {
    console.error('获取会话列表错误:', error);
    res.status(500).json({ message: '获取会话列表失败' });
  }
});

// 3. 获取会话详情和消息历史
router.get('/sessions/:sessionId', auth, async (req, res) => {
  try {
    console.time('get_session_details');
    const { sessionId } = req.params;
    const userId = req.user.userId;
    
    // 验证sessionId格式
    if (!sessionId || !sessionId.startsWith('session_') || typeof sessionId !== 'string') {
      console.error('无效的会话ID格式:', sessionId);
      return res.status(400).json({ 
        message: '会话ID格式无效',
        details: '有效的会话ID应以"session_"开头'
      });
    }
    
    // 优化查询：一次查询同时完成存在性检查和权限验证
    const session = await Chat.findOne({
      sessionId,
      $or: [
        { user: userId },
        { admin: userId }
      ]
    })
      .populate('admin', 'username')
      .lean(); // 使用lean()提高性能
    
    if (!session) {
      // 检查是否是会话不存在还是权限问题
      const sessionExists = await Chat.exists({ sessionId });
      
      if (!sessionExists) {
        console.warn(`会话ID不存在: ${sessionId}，用户: ${userId}，角色: ${req.user.role}`);
        return res.status(404).json({ 
          message: '会话ID不存在',
          sessionId: sessionId
        });
      } else {
        console.warn(`用户无权访问会话: 用户ID=${userId}, 会话ID=${sessionId}`);
        return res.status(403).json({ 
          message: '您没有权限访问该会话',
          sessionId: sessionId
        });
      }
    }

    // 标记消息为已读
    if (req.user.role === 'user') {
      // 用户读取消息
      await Chat.updateOne(
        { sessionId },
        { $set: { 'messages.$[elem].read': true } },
        { arrayFilters: [{ 'elem.sender': { $ne: 'user' } }] }
      );
      
      // 重新获取更新后的会话
      const updatedSession = await Chat.findOne({
        sessionId,
        $or: [
          { user: userId },
          { admin: userId }
        ]
      })
        .populate('admin', 'username')
        .lean();
      
      // 记录查询性能
    console.timeEnd('get_session_details');
    res.json({ session: updatedSession });
  } else if (req.user.role === 'admin') {
    // 管理员读取消息
    await Chat.updateOne(
      { sessionId },
      { $set: { 'messages.$[elem].read': true } },
      { arrayFilters: [{ 'elem.sender': 'user' }] }
    );
    
    // 重新获取更新后的会话
    const updatedSession = await Chat.findOne({
      sessionId,
      $or: [
        { user: userId },
        { admin: userId }
      ]
    })
      .populate('admin', 'username')
      .lean();
    
    // 记录查询性能
    console.timeEnd('get_session_details');
    res.json({ session: updatedSession });
  } else {
    // 记录查询性能
    console.timeEnd('get_session_details');
    res.json({ session });
  }
} catch (error) {
  console.error('获取会话详情错误:', error);
  res.status(500).json({ message: '获取会话详情失败' });
}
});

// 4. 发送消息
router.post('/sessions/:sessionId/messages', auth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { content } = req.body;
    const userId = req.user.userId;
    
    const chat = await Chat.findOne({
      sessionId,
      $or: [
        { user: userId },
        { admin: userId }
      ]
    });
    
    if (!chat) {
      return res.status(404).json({ message: '会话不存在' });
    }
    
    // 确定发送者类型
    const senderType = req.user.role === 'admin' ? 'admin' : 'user';
    
    // 添加消息
    chat.messages.push({
      sender: senderType,
      content,
      read: false
    });
    
    // 如果是管理员回复，更新会话状态
    if (senderType === 'admin') {
      chat.status = 'active';
      chat.admin = userId;
    }
    
    // 更新会话状态为活跃
    if (chat.status !== 'active' && senderType === 'user') {
      chat.status = 'active';
    }
    
    await chat.save();
    
    // 如果有管理员，发送通知
    if (chat.admin) {
      const io = require('../index');
      io.to(chat.admin.toString()).emit('new_message', {
        sessionId,
        message: chat.messages[chat.messages.length - 1],
        chatId: chat._id
      });
    }
    
    res.json({
      message: '消息发送成功',
      messageId: chat.messages[chat.messages.length - 1]._id
    });
  } catch (error) {
    console.error('发送消息错误:', error);
    res.status(500).json({ message: '发送消息失败' });
  }
});

// 5. 标记消息为已读
router.patch('/sessions/:sessionId/mark-read', auth, async (req, res) => {
  try {
    const { sessionId } = req.params;

    const chat = await Chat.findOne({
      sessionId,
      $or: [
        { user: req.user.userId },
        { admin: req.user.userId }
      ]
    });

    if (!chat) {
      return res.status(404).json({ message: '会话不存在' });
    }

    // 标记消息为已读
    if (req.user.role === 'user') {
      // 用户读取所有非用户发送的消息
      await Chat.updateOne(
        { sessionId },
        { $set: { 'messages.$[elem].read': true } },
        { arrayFilters: [{ 'elem.sender': { $ne: 'user' } }] }
      );
    } else if (req.user.role === 'admin') {
      // 管理员读取所有用户发送的消息
      await Chat.updateOne(
        { sessionId },
        { $set: { 'messages.$[elem].read': true } },
        { arrayFilters: [{ 'elem.sender': 'user' }] }
      );
    }

    res.json({ message: '消息已标记为已读' });
  } catch (error) {
    console.error('标记消息为已读错误:', error);
    res.status(500).json({ message: '标记消息为已读失败' });
  }
});

// 6. 关闭会话
router.patch('/sessions/:sessionId/close', auth, async (req, res) => {
  try {
    const { sessionId } = req.params;

    const chat = await Chat.findOne({
      sessionId,
      $or: [
        { user: req.user.userId },
        { admin: req.user.userId }
      ]
    });

    if (!chat) {
      return res.status(404).json({ message: '会话不存在' });
    }

    chat.status = 'closed';
    await chat.save();

    res.json({ message: '会话已关闭' });
  } catch (error) {
    console.error('关闭会话错误:', error);
    res.status(500).json({ message: '关闭会话失败' });
  }
});

// 7. 获取未读消息数量
router.get('/unread-count', auth, async (req, res) => {
  try {
    let unreadCount = 0;

    if (req.user.role === 'user') {
      // 用户获取未读管理员消息数量
      const chats = await Chat.find({
        user: req.user.userId,
        status: { $ne: 'closed' }
      });

      chats.forEach(chat => {
        chat.messages.forEach(message => {
          if (message.sender !== 'user' && !message.read) {
            unreadCount++;
          }
        });
      });
    } else if (req.user.role === 'admin') {
      // 管理员获取未读用户消息数量
      const chats = await Chat.find({
        admin: req.user.userId,
        status: { $ne: 'closed' }
      });

      chats.forEach(chat => {
        chat.messages.forEach(message => {
          if (message.sender === 'user' && !message.read) {
            unreadCount++;
          }
        });
      });
    }

    res.json({ unreadCount });
  } catch (error) {
    console.error('获取未读消息数量错误:', error);
    res.status(500).json({ message: '获取未读消息数量失败' });
  }
});

// 8. 管理员获取所有活跃会话
router.get('/admin/sessions', adminAuth, async (req, res) => {
  // 设置查询超时保护
  const timeoutPromise = new Promise((_, reject) => 
    setTimeout(() => reject(new Error('查询会话超时，请稍后重试')), 20000)
  );
  
  try {
    const { status = 'active', page = 1, limit = 20, search = '' } = req.query;
    const query = {
      status
    };

    // 添加性能优化日志
    console.time('admin_sessions_query');
    
    // 优化搜索查询性能 - 避免在messages.content上使用正则表达式
    if (search && search.trim()) {
      // 只在用户名和邮箱上进行搜索，避免在大型数组字段上搜索
      query.$or = [
        { 'user.username': { $regex: search.trim(), $options: 'i' } },
        { 'user.email': { $regex: search.trim(), $options: 'i' } }
      ];
    }

    const pageNum = Math.max(1, parseInt(page));
    const pageSize = Math.min(Math.max(1, parseInt(limit) || 20), 50); // 限制每页最大数量
    const skip = (pageNum - 1) * pageSize;
    
    // 并行执行查询和计数，提高性能
    const [chats, total] = await Promise.race([
      Promise.all([
        // 优化查询性能，只选择必要的字段
        Chat.find(query)
          .populate('user', 'username email')
          .populate('admin', 'username')
          .sort({ updatedAt: -1 })
          .skip(skip)
          .limit(pageSize)
          .lean() // 使用lean()提高查询性能
          .allowDiskUse(true), // 允许使用磁盘临时文件处理大型结果集
        
        // 只获取总数，避免额外的文档扫描
        Chat.countDocuments(query)
      ]),
      timeoutPromise
    ]);

    // 过滤并清洗会话数据，确保每个会话都有有效的sessionId
    const validChats = chats.filter(chat => 
      chat.sessionId && 
      chat.sessionId.startsWith('session_') && 
      typeof chat.sessionId === 'string'
    );

    // 记录查询性能
    console.timeEnd('admin_sessions_query');
    console.log(`管理员会话查询性能: 页码=${pageNum}, 每页=${pageSize}, 总数=${total}, 有效会话数=${validChats.length}`);

    res.json({
      sessions: validChats,
      pagination: {
        page: pageNum,
        limit: pageSize,
        total,
        pages: Math.ceil(total / pageSize)
      },
      totalPages: Math.ceil(total / pageSize) // 兼容旧客户端版本的响应字段
    });
  } catch (error) {
    console.error('管理员获取会话列表错误:', error);
    const errorMessage = error.message.includes('timeout') ? '获取会话超时，请减少筛选条件或稍后重试' : '获取会话列表失败';
    res.status(500).json({ message: errorMessage });
  }
});



// 12. 管理员分配会话
router.patch('/admin/sessions/:sessionId/assign', adminAuth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { adminId } = req.body;

    const chat = await Chat.findOne({
      sessionId
    });

    if (!chat) {
      return res.status(404).json({ message: '会话不存在' });
    }

    chat.admin = adminId;
    chat.status = 'active';
    await chat.save();

    res.json({ message: '会话已分配' });
  } catch (error) {
    console.error('分配会话错误:', error);
    res.status(500).json({ message: '分配会话失败' });
  }
});

module.exports = router;