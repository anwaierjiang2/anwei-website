import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MessageCircle, Phone, Mail, Send, Paperclip, Smile, ChevronLeft, User, Check, CheckCircle, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { initSocket, sendMessage, onNewMessage, offNewMessage, setAuthInfo } from '../utils/socket';

interface Message {
  _id: string;
  sender: 'user' | 'admin' | 'system';
  content: string;
  read: boolean;
  createdAt: string;
}

interface ChatSession {
  _id: string;
  sessionId: string;
  status: string;
  user?: { _id: string; username: string };
  admin?: { _id: string; username: string };
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

const CustomerServiceChat: React.FC = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSessionsList, setShowSessionsList] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 检查用户是否已登录
  const checkLoginStatus = useCallback(() => {
    const token = localStorage.getItem('userToken');
    setIsLoggedIn(!!token);
    return !!token;
  }, [setIsLoggedIn]);

  // 自动滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 加载会话列表
  const loadSessions = useCallback(async () => {
    try {
      const isUserLoggedIn = checkLoginStatus();
      
      if (!isUserLoggedIn) {
        setError('请先登录以使用客服聊天功能');
        setLoading(false);
        return;
      }
      
      setLoading(true);
      const token = localStorage.getItem('userToken');
      const response = await axios.get('/api/chat/sessions', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setSessions(response.data.sessions);
      // 暂时不需要计算和显示未读消息数
      setError(''); // 清除之前可能的错误信息
    } catch (err) {
      console.error('加载会话列表失败:', err);
      setError('加载会话列表失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  }, [checkLoginStatus, setError, setLoading, setSessions]);

  // 创建新会话
  const createNewSession = async (initialMessage?: string) => {
    try {
      const isUserLoggedIn = checkLoginStatus();
      
      if (!isUserLoggedIn) {
        setError('请先登录以创建客服会话');
        setLoading(false);
        return;
      }
      
      setLoading(true);
      const token = localStorage.getItem('userToken');
      const response = await axios.post('/api/chat/session', initialMessage ? { initialMessage } : {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      await loadSessions();
      // 直接打开新创建的会话
      if (response.data.sessionId) {
        openSession(response.data.sessionId);
      }
    } catch (err) {
      console.error('创建会话失败:', err);
      setError('创建会话失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 打开会话
  const openSession = async (sessionId: string) => {
    try {
      const isUserLoggedIn = checkLoginStatus();
      
      if (!isUserLoggedIn) {
        setError('请先登录以查看会话详情');
        setLoading(false);
        return;
      }
      
      setLoading(true);
      const token = localStorage.getItem('userToken');
      const response = await axios.get(`/api/chat/sessions/${sessionId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setCurrentSession(response.data.session);
      setShowSessionsList(false);
      setTimeout(scrollToBottom, 100);
      
      // 更新未读计数
      await loadSessions();
    } catch (err) {
      console.error('打开会话失败:', err);
      setError('打开会话失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 发送消息
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !currentSession) return;

    const content = newMessage.trim();
    
    try {
      const isUserLoggedIn = checkLoginStatus();
      
      if (!isUserLoggedIn) {
        setError('请先登录以发送消息');
        return;
      }

      setNewMessage('');

      // 模拟消息即时显示
      const tempMessage: Message = {
        _id: `temp-${Date.now()}`,
        sender: 'user',
        content,
        read: false,
        createdAt: new Date().toISOString()
      };

      // 更新当前会话消息
      if (currentSession) {
        const updatedSession = {
          ...currentSession,
          messages: [...currentSession.messages, tempMessage]
        };
        setCurrentSession(updatedSession);
        scrollToBottom();
      }

      // 通过WebSocket发送消息
      if (currentSession) {
        sendMessage(currentSession.sessionId, content, 'user', 'admin');
        
        // 同时通过API发送消息（作为备用）
        const token = localStorage.getItem('userToken');
        await axios.post(`/api/chat/sessions/${currentSession.sessionId}/messages`, { content }, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
      }
    } catch (err) {
      console.error('发送消息失败:', err);
      setError('发送消息失败，请稍后重试');
      // 恢复消息输入
      setNewMessage(content); // 使用之前保存的content变量，而不是已经被清空的newMessage
    }
  };

  // 处理回车键发送
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // 格式化日期时间
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return `昨天 ${date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays < 7) {
      const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
      return `${weekdays[date.getDay()]} ${date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
    }
  };

  // 获取最后一条消息预览
  const getLastMessagePreview = (messages: Message[]) => {
    if (!messages || messages.length === 0) {
      return '暂无消息';
    }
    const lastMessage = messages[messages.length - 1];
    const prefix = lastMessage.sender === 'user' ? '我: ' : '客服: ';
    const content = lastMessage.content.length > 20 ? `${lastMessage.content.slice(0, 20)}...` : lastMessage.content;
    return prefix + content;
  };

  // 组件加载时
  useEffect(() => {
    // 检查登录状态
    const isUserLoggedIn = checkLoginStatus();
    
    if (isUserLoggedIn) {
      // 获取用户信息
      const userInfo = localStorage.getItem('userInfo');
      const userToken = localStorage.getItem('userToken');
      
      if (userInfo && userToken) {
        try {
          const user = JSON.parse(userInfo);
          // 设置认证信息
          setAuthInfo(user._id, userToken);
        } catch (error) {
          console.error('解析用户信息失败:', error);
        }
      }
      
      // 初始化Socket连接
      initSocket().catch(error => {
        console.error('WebSocket初始化失败:', error);
      });
      
      // 加载会话列表
      loadSessions();
    }

    // 监听新消息
    const handleNewMessage = (data: any) => {
      console.log('收到新消息:', data);
      
      // 无论是否登录状态都处理新消息，因为登录状态可能已更新
      // 如果是当前会话的消息
      if (currentSession && data.sessionId === currentSession.sessionId) {
        // 立即更新UI，确保用户能实时看到消息
        const updatedSession = {
          ...currentSession,
          messages: [...currentSession.messages, data.message]
        };
        setCurrentSession(updatedSession);
        scrollToBottom();
      }
      
      // 更新会话列表
      loadSessions();
    };

    // 添加消息监听
    onNewMessage(handleNewMessage);

    // 清理函数
    return () => {
      // 使用offNewMessage来移除所有消息监听
      offNewMessage();
    };
  }, [currentSession, loadSessions, checkLoginStatus]);

  // 添加WebSocket连接状态监控
  useEffect(() => {
    // 每分钟检查一次连接状态，确保连接正常
    const checkInterval = setInterval(() => {
      // 尝试重新初始化Socket连接，这将自动处理重连逻辑
      initSocket().catch(error => {
        console.error('WebSocket连接检查失败:', error);
      });
    }, 60000);

    return () => clearInterval(checkInterval);
  }, []);

  // 确保组件加载时消息列表自动滚动到底部
  useEffect(() => {
    if (currentSession && currentSession.messages && currentSession.messages.length > 0) {
      setTimeout(scrollToBottom, 100);
    }
  }, [currentSession]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      
      <div className="container mx-auto px-4 py-8">
        {!isLoggedIn ? (
          <div className="max-w-2xl mx-auto text-center py-16">
            <div className="bg-white/5 border border-white/10 rounded-xl p-8">
              <User size={64} className="text-blue-400 mx-auto mb-6" />
              <h2 className="text-2xl font-bold mb-4">需要登录才能使用客服聊天</h2>
              <p className="text-gray-300 mb-8">登录后可以与客服进行实时沟通，查看历史会话记录</p>
              <button
                onClick={() => navigate('/login')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg transition-colors text-lg flex items-center justify-center mx-auto"
              >
                <User size={18} className="mr-2" />
                前往登录页面
              </button>
              {error && (
                <div className="mt-6 bg-red-500/20 border border-red-500/30 rounded-lg p-4">
                  <p className="text-red-300">{error}</p>
                </div>
              )}
            </div>
          </div>
        ) : showSessionsList ? (
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-3xl font-bold">客服会话</h1>
              <button
                onClick={() => createNewSession()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors flex items-center"
              >
                <MessageCircle size={18} className="mr-2" />
                开始新会话
              </button>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <p className="text-gray-400">加载会话中...</p>
              </div>
            ) : error ? (
              <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 mb-6">
                <p className="text-red-300">{error}</p>
              </div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-16">
                <MessageCircle size={64} className="text-gray-600 mx-auto mb-6" />
                <h3 className="text-xl font-semibold mb-4">暂无会话记录</h3>
                <p className="text-gray-400 mb-8">点击下方按钮开始与客服对话</p>
                <button
                  onClick={() => createNewSession()}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg transition-colors text-lg"
                >
                  开始新会话
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {sessions.map((session) => {
                  const unreadMessages = session.messages?.filter((msg: Message) => 
                    msg.sender !== 'user' && !msg.read
                  ).length || 0;
                  
                  return (
                    <div
                      key={session.sessionId}
                      onClick={() => openSession(session.sessionId)}
                      className={`p-4 rounded-xl cursor-pointer transition-all duration-300 hover:bg-white/10 border ${unreadMessages > 0 ? 'border-blue-500' : 'border-white/10'} bg-white/5`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <User size={20} className="mr-3 text-blue-400" />
                          <span className="font-medium">客服会话 #{session.sessionId.slice(-4)}</span>
                        </div>
                        <div className="flex items-center">
                          {unreadMessages > 0 && (
                            <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1 mr-2">
                              {unreadMessages}
                            </span>
                          )}
                          <span className="text-xs text-gray-400">
                            {formatDateTime(session.updatedAt)}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-300">
                        {getLastMessagePreview(session.messages || [])}
                      </p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className={`text-xs px-2 py-1 rounded-full ${session.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                          {session.status === 'active' ? '活跃中' : '等待中'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            {/* 聊天界面 */}
            <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
              {/* 聊天头部 */}
              <div className="bg-white/10 p-4 border-b border-white/10 flex items-center">
                <button 
                  onClick={() => {
                    setShowSessionsList(true);
                    setCurrentSession(null);
                  }}
                  className="p-2 rounded-full hover:bg-white/10 mr-2"
                >
                  <ChevronLeft size={20} />
                </button>
                <div className="flex items-center">
                  <User size={24} className="mr-3 text-blue-400" />
                  <div>
                    <h2 className="font-semibold">在线客服</h2>
                    <p className="text-xs text-green-400">
                      {currentSession?.status === 'active' ? '在线' : '等待客服接入'}
                    </p>
                  </div>
                </div>
              </div>

              {/* 聊天消息区域 */}
              <div className="h-[calc(100vh-280px)] overflow-y-auto p-4 space-y-6">
                {currentSession?.messages && currentSession.messages.map((message) => (
                  <div 
                    key={message._id} 
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[80%] ${message.sender === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
                      {message.sender !== 'user' && (
                        <span className="text-xs text-gray-400 mb-1 ml-4">客服</span>
                      )}
                      <div className={`p-3 rounded-lg ${message.sender === 'user' ? 'bg-blue-600 rounded-br-none' : 'bg-white/10 rounded-bl-none'}`}>
                        <p>{message.content}</p>
                      </div>
                      <div className={`flex items-center mt-1 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <span className="text-xs text-gray-500">
                          {formatDateTime(message.createdAt)}
                        </span>
                        {message.sender === 'user' && (
                          <span className={`ml-2 text-gray-500`}>
                            {message.read ? (
                              <CheckCircle size={12} className="text-green-500" />
                            ) : (
                              <Check size={12} />
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* 消息输入区域 */}
              <div className="p-4 border-t border-white/10">
                <div className="flex items-center space-x-3 mb-3">
                  <button className="p-2 rounded-full hover:bg-white/10 text-gray-400">
                    <Paperclip size={20} />
                  </button>
                  <button className="p-2 rounded-full hover:bg-white/10 text-gray-400">
                    <Smile size={20} />
                  </button>
                </div>
                <div className="flex items-center space-x-3">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="输入消息..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={loading}
                  />
                  <button
                    onClick={handleSendMessage}
                    className={`p-3 rounded-full bg-blue-600 hover:bg-blue-700 transition-colors ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                    disabled={loading || !newMessage.trim()}
                  >
                    <Send size={20} />
                  </button>
                </div>
              </div>
            </div>

            {/* 联系方式卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <Phone className="text-blue-400 mb-2" size={20} />
                <h3 className="text-sm font-semibold mb-1">电话咨询</h3>
                <p className="text-xs text-gray-400 mb-2">工作日 9:00-18:00</p>
                <p className="text-white text-lg">400-123-4567</p>
              </div>

              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <Mail className="text-blue-400 mb-2" size={20} />
                <h3 className="text-sm font-semibold mb-1">电子邮件</h3>
                <p className="text-xs text-gray-400 mb-2">工作时间内2小时回复</p>
                <p className="text-white text-lg">support@anwei.com</p>
              </div>

              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <Bell className="text-blue-400 mb-2" size={20} />
                <h3 className="text-sm font-semibold mb-1">服务时间</h3>
                <p className="text-xs text-gray-400 mb-2">在线客服工作时间</p>
                <p className="text-white text-lg">9:00-22:00 (工作日)</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerServiceChat;