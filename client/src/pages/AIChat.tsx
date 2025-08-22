import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Copy, Trash2, Download, Settings, MessageCircle, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { aiChatAPI } from '../services/apiService';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  model?: string;
}

interface ChatHistory {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  model?: string;
}

const AIChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState('qwen-turbo');
  const [chatHistories, setChatHistories] = useState<ChatHistory[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const navigate = useNavigate();

  // 返回首页
  const goToHome = () => {
    navigate('/');
  };

  // 加载聊天历史
  useEffect(() => {
    loadChatHistories();
  }, []);

  // 自动滚动到底部
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 从服务器加载聊天历史
  const loadChatHistories = async () => {
    try {
      const response = await aiChatAPI.getChatHistories();
      const histories = response.history || [];
      // 将字符串日期转换回Date对象
      const parsedHistories = histories.map((history: any) => ({
        id: history._id,
        title: history.title,
        messages: history.messages.map((msg: any) => ({
          id: msg._id || msg.id,
          role: msg.role,
          content: msg.content,
          timestamp: new Date(msg.timestamp),
          model: msg.model
        })),
        createdAt: new Date(history.createdAt),
        updatedAt: new Date(history.updatedAt),
        model: history.model
      }));
      setChatHistories(parsedHistories);
      
      // 备份到localStorage，作为网络问题时的后备
      localStorage.setItem('anwei_chat_histories_backup', JSON.stringify(parsedHistories));
    } catch (error) {
      console.error('从服务器加载聊天历史失败:', error);
      // 如果加载失败，可以继续使用localStorage中的备份数据
      const saved = localStorage.getItem('anwei_chat_histories_backup');
      if (saved) {
        try {
          const histories = JSON.parse(saved);
          setChatHistories(histories);
        } catch (backupError) {
          console.error('加载备份聊天历史失败:', backupError);
        }
      }
    }
  };

  // 保存聊天到历史记录（服务器）
  const saveToHistory = async (title: string) => {
    if (messages.length === 0) return;

    try {
      // 准备发送到服务器的数据
      const historyData = {
        title,
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp,
          model: msg.model
        })),
        model: selectedModel
      };

      let response;
      if (currentChatId) {
        // 如果已有聊天ID，更新现有聊天
        response = await aiChatAPI.updateChatHistory(currentChatId, historyData);
      } else {
        // 创建新的聊天历史
        response = await aiChatAPI.saveChatHistory(historyData);
      }

      // 更新本地状态
      const newHistoryId = response.history._id;
      
      // 重新加载所有聊天历史
      await loadChatHistories();
      
      // 如果是新建的聊天，设置为当前聊天
      if (!currentChatId) {
        setCurrentChatId(newHistoryId);
      }
    } catch (error) {
      console.error('保存聊天历史失败:', error);
      // 降级处理：在localStorage中备份
      const backupHistory = {
        id: currentChatId || Date.now().toString(),
        title,
        messages,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const currentBackups = JSON.parse(localStorage.getItem('anwei_chat_histories_backup') || '[]');
      const existingIndex = currentBackups.findIndex((h: any) => h.id === backupHistory.id);
      
      if (existingIndex >= 0) {
        currentBackups[existingIndex] = backupHistory;
      } else {
        currentBackups.push(backupHistory);
      }
      
      localStorage.setItem('anwei_chat_histories_backup', JSON.stringify(currentBackups));
      
      // 更新本地状态
      const updatedHistories = [...chatHistories];
      const existingLocalIndex = updatedHistories.findIndex(h => h.id === backupHistory.id);
      
      if (existingLocalIndex >= 0) {
        updatedHistories[existingLocalIndex] = backupHistory;
      } else {
        updatedHistories.push(backupHistory);
      }
      
      setChatHistories(updatedHistories);
    }
  };

  // 创建新聊天
  const createNewChat = async () => {
    // 如果当前有聊天记录，先保存到历史
    if (messages.length > 0) {
      const title = messages[0].content.slice(0, 30) + (messages[0].content.length > 30 ? '...' : '');
      await saveToHistory(title);
    }
    setMessages([]);
    setCurrentChatId(null);
  };

  // 加载特定的聊天历史
  const loadHistory = async (history: ChatHistory) => {
    try {
      const response = await aiChatAPI.getChatHistory(history.id);
      const serverHistory = response.history;
      
      // 将服务器数据转换为本地需要的格式
      const parsedMessages = serverHistory.messages.map((msg: any) => ({
        id: msg._id || msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: new Date(msg.timestamp),
        model: msg.model
      }));
      
      setMessages(parsedMessages);
      setCurrentChatId(serverHistory._id);
      setSelectedModel(serverHistory.model || 'qwen-turbo');
    } catch (error) {
      console.error('加载聊天历史失败:', error);
      // 降级处理：直接使用传入的history对象
      setMessages(history.messages);
      setCurrentChatId(history.id);
      if (history.model) {
        setSelectedModel(history.model);
      }
    }
    setShowSidebar(false);
  };

  // 删除历史聊天
  const deleteHistory = async (id: string) => {
    try {
      await aiChatAPI.deleteChatHistory(id);
      
      // 重新加载所有聊天历史
      await loadChatHistories();
      
      // 如果删除的是当前聊天，创建新聊天
      if (currentChatId === id) {
        setMessages([]);
        setCurrentChatId(null);
      }
    } catch (error) {
      console.error('删除聊天历史失败:', error);
      // 降级处理：仅更新本地状态
      const updatedHistories = chatHistories.filter(h => h.id !== id);
      setChatHistories(updatedHistories);
      
      // 更新本地备份
      const currentBackups = JSON.parse(localStorage.getItem('anwei_chat_histories_backup') || '[]');
      const filteredBackups = currentBackups.filter((h: any) => h.id !== id);
      localStorage.setItem('anwei_chat_histories_backup', JSON.stringify(filteredBackups));
      
      if (currentChatId === id) {
        setMessages([]);
        setCurrentChatId(null);
      }
    }
  };

  // 复制消息内容
  const copyMessage = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      // 可以添加一个提示
    } catch (error) {
      console.error('复制失败:', error);
    }
  };

  // 导出聊天记录
  const exportChat = () => {
    const chatData = {
      title: `anwei AI聊天记录_${new Date().toLocaleDateString()}`,
      messages,
      exportTime: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(chatData, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `anwei_chat_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 发送消息
  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      // 调用AI API
      const response = await aiChatAPI.sendMessage(
        newMessages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        selectedModel
      );

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.message,
        timestamp: new Date(),
        model: 'anwei模型'
      };

      const updatedMessages = [...newMessages, assistantMessage];
      setMessages(updatedMessages);

      // 如果是第一条消息，自动保存到历史记录
      if (updatedMessages.length === 2) {
        const title = userMessage.content.slice(0, 30) + (userMessage.content.length > 30 ? '...' : '');
        await saveToHistory(title);
      } else if (currentChatId) {
        // 如果已有聊天ID，更新现有聊天
        const title = messages.length > 0 ? messages[0].content.slice(0, 30) + (messages[0].content.length > 30 ? '...' : '') : '新对话';
        await saveToHistory(title);
      }

    } catch (error) {
      console.error('AI响应错误:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '抱歉，我遇到了一些问题。请稍后再试。',
        timestamp: new Date()
      };
      setMessages([...newMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // 处理回车键
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 text-white">
      {/* 头部 */}
      <header className="bg-dark-800/50 border-b border-dark-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={goToHome}
                className="p-2 rounded-lg hover:bg-dark-700 transition-colors"
              >
                <Home className="w-6 h-6" />
              </button>
              <button
                onClick={() => setShowSidebar(!showSidebar)}
                className="p-2 rounded-lg hover:bg-dark-700 transition-colors"
              >
                <MessageCircle className="w-6 h-6" />
              </button>
              <h1 className="text-2xl font-bold text-primary-400">anwei AI助手</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 rounded-lg hover:bg-dark-700 transition-colors"
              >
                <Settings className="w-6 h-6" />
              </button>
              <button
                onClick={createNewChat}
                className="px-4 py-2 bg-primary-500 hover:bg-primary-600 rounded-lg transition-colors"
              >
                新对话
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-80px)]">
        {/* 侧边栏 */}
        <AnimatePresence>
          {showSidebar && (
            <motion.aside
              initial={{ x: -300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="w-80 bg-dark-800/50 border-r border-dark-700 overflow-y-auto"
            >
              <div className="p-4">
                <h3 className="text-lg font-semibold mb-4">聊天历史</h3>
                <div className="space-y-2">
                  {chatHistories.map((history) => (
                    <div
                      key={history.id}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-dark-700 transition-colors cursor-pointer group"
                      onClick={() => loadHistory(history)}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{history.title}</p>
                        <p className="text-xs text-gray-400">
                          {history.updatedAt.toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteHistory(history.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded transition-all"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* 主聊天区域 */}
        <main className="flex-1 flex flex-col">
          {/* 消息列表 */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {messages.length === 0 ? (
              <div className="text-center py-20">
                <Bot className="w-20 h-20 text-primary-400 mx-auto mb-6" />
                <h2 className="text-2xl font-bold mb-4">欢迎使用 anwei AI助手</h2>
                <p className="text-gray-400 mb-8">
                  我是您的智能助手，可以帮助您解答问题、编写代码、分析数据等。
                  <br />
                  开始对话吧！
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  {[
                    "帮我写一个React组件",
                    "解释一下什么是人工智能",
                    "如何学习编程？",
                    "帮我优化这段代码"
                  ].map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => setInput(suggestion)}
                      className="px-4 py-2 bg-dark-700 hover:bg-dark-600 rounded-lg transition-colors text-sm"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex items-start space-x-3 max-w-4xl ${message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.role === 'user' 
                        ? 'bg-primary-500' 
                        : 'bg-accent-500'
                    }`}>
                      {message.role === 'user' ? (
                        <User className="w-5 h-5 text-white" />
                      ) : (
                        <Bot className="w-5 h-5 text-white" />
                      )}
                    </div>
                    
                    <div className={`rounded-2xl px-4 py-3 ${
                      message.role === 'user'
                        ? 'bg-primary-500 text-white'
                        : 'bg-dark-700 text-gray-100'
                    }`}>
                      <div className="prose prose-invert max-w-none">
                        <ReactMarkdown
                          components={{
                            code({ node, inline, className, children, ...props }) {
                              const match = /language-(\w+)/.exec(className || '');
                              return !inline && match ? (
                                <div className="relative group">
                                  <button
                                    onClick={() => copyMessage(String(children))}
                                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 bg-dark-600 rounded transition-opacity"
                                  >
                                    <Copy className="w-4 h-4" />
                                  </button>
                                  <SyntaxHighlighter
                                    style={tomorrow as any}
                                    language={match[1]}
                                    Pretag="div"
                                    {...props}
                                  >
                                    {String(children).replace(/\n$/, '')}
                                  </SyntaxHighlighter>
                                </div>
                              ) : (
                                <code className={className} {...props}>
                                  {children}
                                </code>
                              );
                            }
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
                      </div>
                      
                      {message.model && (
                        <div className="mt-2 text-xs text-gray-400">
                          使用模型: {message.model}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))
            )}
            
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-start"
              >
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-full bg-accent-500 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div className="bg-dark-700 rounded-2xl px-4 py-3">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* 输入区域 */}
          <div className="border-t border-dark-700 p-4">
            <div className="max-w-4xl mx-auto">
              <div className="flex space-x-4">
                <div className="flex-1">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="输入您的问题..."
                    className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    rows={1}
                    style={{ minHeight: '48px', maxHeight: '120px' }}
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement;
                      target.style.height = 'auto';
                      target.style.height = Math.min(target.scrollHeight, 120) + 'px';
                    }}
                  />
                </div>
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || isLoading}
                  className="px-6 py-3 bg-primary-500 hover:bg-primary-600 disabled:bg-dark-600 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center space-x-2"
                >
                  <Send className="w-5 h-5" />
                  <span>发送</span>
                </button>
              </div>
              
              <div className="mt-3 flex items-center justify-between text-sm text-gray-400">
                <div className="flex items-center space-x-4">
                  <span>模型: {selectedModel}</span>
                  <span>消息数: {messages.length}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={exportChat}
                    className="hover:text-primary-400 transition-colors"
                    title="导出聊天记录"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* 设置面板 */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
            onClick={() => setShowSettings(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-dark-800 rounded-2xl p-6 w-full max-w-md mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold mb-6">设置</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">AI模型</label>
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="qwen-turbo">anwei模型 - 快速版</option>
                    <option value="qwen-plus">anwei模型 - 增强版</option>
                    <option value="qwen-max">anwei模型 - 专业版</option>
                  </select>
                </div>
                
                <div className="pt-4 border-t border-dark-700">
                  <button
                    onClick={async () => {
                      try {
                        // 先尝试清除服务器上的聊天历史
                        await aiChatAPI.clearAllChatHistories();
                      } catch (error) {
                        console.error('清除服务器聊天历史失败:', error);
                      }
                      
                      // 清除本地存储
                      localStorage.clear();
                      window.location.reload();
                    }}
                    className="w-full px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
                  >
                    清除所有数据
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AIChat;