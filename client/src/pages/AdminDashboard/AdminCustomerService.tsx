import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MessageCircle, Users, Search, ChevronDown, LogOut, Bell, Settings, Wrench, ShoppingBag, PieChart, XCircle, Send, Smile, Paperclip, Activity } from 'lucide-react';
import axios from 'axios';
import { initSocket, disconnectSocket, sendMessage, onNewMessage, offNewMessage, onMessageSent, offMessageSent, isSocketConnected, setAuthInfo, getSocket } from '../../utils/socket';
import { ChatSession, Message } from '../../types/index';

// Refresh组件定义
const Refresh: React.FC<{ size: number; className?: string }> = ({ size, className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M3 2v6h6" />
    <path d="M21 12A9 9 0 0 0 6 5.3L3 8" />
    <path d="M21 22v-6h-6" />
    <path d="M3 12a9 9 0 0 0 15 6.7l3-2.7" />
  </svg>
);

const AdminCustomerService: React.FC = () => {

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(20);
  // 引用变量
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const notificationSoundRef = useRef<HTMLAudioElement | null>(null);
  // 存储消息处理回调引用，用于精确清理
  const messageCallbackRef = useRef<(message: Message) => void>(() => {});
  const sentCallbackRef = useRef<(data: any) => void>(() => {});

  // 初始化声音通知
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Audio' in window) {
      notificationSoundRef.current = new Audio('/notification-sound.mp3');
    }
  }, []);

  // 播放通知声音
  const playNotificationSound = () => {
    if (notificationSoundRef.current) {
      try {
        notificationSoundRef.current.currentTime = 0;
        notificationSoundRef.current.play().catch(e => {
          console.error('播放提示音失败:', e);
        });
      } catch (e) {
        console.error('播放提示音失败:', e);
      }
    }
  };

  // 检查通知权限
  const checkNotificationPermission = () => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        if (permission === 'denied') {
          console.log('通知权限被拒绝');
        }
      });
    }
  };

  // 显示浏览器通知
  const showNotification = (data: any) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      if (!data.sessionId || typeof data.sessionId !== 'string') {
        console.error('通知数据中的会话ID格式无效:', data.sessionId);
        return;
      }
      
      const notificationOptions: NotificationOptions = {
        body: data.message?.content || '',
        icon: '/logo192.png',
        badge: '/logo512.png',
        tag: data.sessionId,
        requireInteraction: true,
        renotify: true
      };

      const notification = new Notification(
        `来自用户的新消息`,
        notificationOptions
      );

      notification.onclick = () => {
        window.focus();
        notification.close();
        loadSessionDetails(data.sessionId);
      };
    }
  };

  // 标记消息为已读
  const markMessagesAsRead = async (sessionId: string) => {
    try {
      await axios.patch(`/api/chat/sessions/${sessionId}/mark-read`, {}, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      
      setSessions(prev => prev.map(session => {
        if (session.sessionId === sessionId) {
          return {
            ...session,
            unreadCount: 0
          };
        }
        return session;
      }));
    } catch (err) {
      console.error('标记消息为已读失败:', err);
    }
  };

  // 加载会话列表
  const loadSessions = useCallback(async (page = 1, search = '', status = 'active') => {
    setLoading(true);
    try {
      // 防抖搜索请求，避免频繁请求
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      
      // 准备请求参数
      const requestParams = {
        page,
        limit,
        status,
        search: search.trim() // 去除搜索字符串前后空格
      };
      
      // 增加超时时间到30秒，改进查询性能
      const response = await axios.get('/api/chat/admin/sessions', {
        params: requestParams,
        headers: {
          Authorization: `Bearer ${localStorage.getItem('adminToken')}`
        },
        timeout: 30000 // 增加超时时间到30秒
      });
      
      if (!response.data) {
        throw new Error('服务器返回空数据');
      }
      
      // 检查并适配响应格式
      const sessionsData = response.data.sessions || response.data;
      
      if (!Array.isArray(sessionsData)) {
        throw new Error('返回的会话数据格式不正确');
      }
      
      // 额外验证每个会话对象的完整性
      const validSessions = sessionsData.filter((session: any) => 
        session && 
        session.sessionId && 
        typeof session.sessionId === 'string' &&
        session.user &&
        session.messages
      );
      
      // 适配不同的响应结构
      setSessions(validSessions);
      setTotalPages(response.data.pagination?.pages || response.data.totalPages || 1);
      setCurrentPage(page);
      setError(''); // 清除之前的错误
    } catch (err) {
      const errorMsg = err instanceof Error ? 
        (err.message.includes('timeout') ? '加载会话超时，请减少筛选条件或稍后重试' : err.message) : 
        '加载会话列表失败，请稍后重试';
      setError(errorMsg);
      console.error('加载会话列表失败:', err);
    } finally {
      setLoading(false);
    }
  }, [limit, setLoading, setSessions, setTotalPages, setCurrentPage, setError]);

  // 加载会话详情
  const loadSessionDetails = async (sessionId: string) => {
    try {
      // 增加超时时间到30秒
      const response = await axios.get(`/api/chat/sessions/${sessionId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('adminToken')}`
        },
        timeout: 30000 // 增加超时时间到30秒
      });
      
      if (!response.data || !response.data.session) {
        throw new Error('返回的会话详情数据格式不正确');
      }
      
      // 验证会话数据完整性
      const sessionData = response.data.session;
      if (!sessionData.sessionId || !sessionData.messages) {
        throw new Error('会话数据不完整');
      }
      
      setSelectedSession(sessionData);
      setTimeout(() => scrollToBottom(), 100);
      markMessagesAsRead(sessionId);
      setError(''); // 清除之前的错误
    } catch (err) {
      const errorMsg = err instanceof Error ? 
        (err.message.includes('timeout') ? '加载会话详情超时，请尝试刷新页面' : err.message) : 
        '加载会话详情失败，请稍后重试';
      setError(errorMsg);
      console.error('加载会话详情失败:', err);
    }
  };

  // 发送消息
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedSession || !newMessage.trim()) {
      return;
    }
    
    const adminInfo = JSON.parse(localStorage.getItem('adminInfo') || 'null');
    const adminToken = localStorage.getItem('adminToken');
    
    const messageContent = newMessage.trim();
    const newMessageObj: Message = {
      _id: `temp_${Date.now()}`,
      content: messageContent,
      sender: 'admin',
      read: true,
      createdAt: new Date().toISOString()
    };
    
    setSelectedSession(prev => prev ? {
      ...prev,
      messages: [...prev.messages, newMessageObj]
    } : null);
    
    setNewMessage('');
    
    scrollToBottom();
    
    if (isSocketConnected()) {
      sendMessage(
        selectedSession.sessionId,
        messageContent,
        'admin',
        selectedSession.user._id
      );
    } else {
      try {
        await axios.post(`/api/chat/sessions/${selectedSession.sessionId}/messages`, {
          content: messageContent
        }, {
          headers: {
            Authorization: `Bearer ${adminToken}`
          },
          timeout: 10000
        });
      } catch (err) {
        console.error('发送消息失败:', err);
        setError('发送消息失败，请稍后重试');
        setSelectedSession(prev => prev ? {
          ...prev,
          messages: prev.messages.filter(msg => msg._id !== newMessageObj._id)
        } : null);
        setNewMessage(messageContent);
      }
    }
  };

  // 关闭会话
  const handleCloseSession = async (sessionId: string) => {
    try {
      await axios.post(`/api/chat/admin/sessions/${sessionId}/close`, {}, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('adminToken')}`
        },
        timeout: 10000
      });
      
      setSessions(prev => prev.filter(session => session.sessionId !== sessionId));
      if (selectedSession && selectedSession.sessionId === sessionId) {
        setSelectedSession(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '关闭会话失败，请稍后重试');
      console.error('关闭会话失败:', err);
    }
  };

  // 滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 初始化WebSocket连接
  useEffect(() => {
    checkNotificationPermission();

    const adminToken = localStorage.getItem('adminToken');
    const adminInfo = JSON.parse(localStorage.getItem('adminInfo') || 'null');
    const userId = adminInfo?.id || '';

    if (userId && adminToken) {
      setAuthInfo(userId, adminToken);
    }

    // WebSocket连接状态监控，每分钟检查一次连接状态
    const connectionCheckTimer = setInterval(() => {
      if (!isSocketConnected() && userId && adminToken) {
        console.log('WebSocket连接已断开，尝试重新连接...');
        setConnectionStatus('connecting');
        initializeSocket().catch(err => {
          console.error('WebSocket重连失败:', err);
          setConnectionStatus('disconnected');
        });
      }
    }, 60000);

    const initializeSocket = async () => {
      try {
        if (userId && adminToken) {
          await initSocket();
          setConnectionStatus('connected');
          
          // 发送auth事件，将管理员与socket关联起来
          const socketInstance = getSocket();
          if (window.WebSocket && socketInstance && socketInstance.readyState === WebSocket.OPEN) {
            const authData = {
              type: 'auth',
              userId: userId,
              token: adminToken
            };
            socketInstance.send(JSON.stringify(authData));
            console.log('已发送auth事件，将管理员与socket关联');
          }
        } else {
          console.warn('认证信息不完整，无法初始化WebSocket连接');
          setConnectionStatus('disconnected');
        }
      } catch (error) {
        console.error('WebSocket初始化失败，将使用API进行通信:', error);
        setConnectionStatus('disconnected');
      }
    };

    const initTimer = setTimeout(() => {
      initializeSocket();
    }, 500);

    // 处理新消息，更新UI
    const handleNewMessage = (message: Message) => {
      console.log('收到新消息:', message);
      
      // 获取会话ID（从消息或发送数据中）
      const sessionId = (message as any).sessionId || '';
      
      if (!sessionId) {
        console.error('收到的消息缺少sessionId:', message);
        return;
      }
      
      // 如果当前选中的是该会话，更新消息列表
      if (selectedSession && selectedSession.sessionId === sessionId) {
        setSelectedSession(prev => prev ? {
          ...prev,
          messages: [...prev.messages, message]
        } : null);
        
        // 自动滚动到底部
        setTimeout(() => scrollToBottom(), 100);
        
        // 标记为已读
        markMessagesAsRead(sessionId);
      } else {
        // 如果不是当前会话，更新会话列表中的未读数
        setSessions(prev => prev.map(session => {
          if (session.sessionId === sessionId) {
            return {
              ...session,
              unreadCount: (session.unreadCount || 0) + 1,
              // 更新会话的最后一条消息
              messages: session.messages ? [...session.messages, message] : [message]
            };
          }
          return session;
        }));
      }
      
      // 播放通知音和显示通知
      playNotificationSound();
      showNotification({ sessionId, message });
    };

    // 保存回调引用用于精确清理
    messageCallbackRef.current = handleNewMessage;
    onNewMessage(handleNewMessage);

    const handleMessageSent = (data: any) => {
      console.log('消息发送成功:', data);
      
      // 如果有临时ID，替换为真实ID
      if (data.sessionId && data.messageId && data.tempId) {
        if (selectedSession && selectedSession.sessionId === data.sessionId) {
          setSelectedSession(prev => prev ? {
            ...prev,
            messages: prev.messages.map(msg => 
              msg._id === data.tempId ? { ...msg, _id: data.messageId } : msg
            )
          } : null);
        } else {
          // 处理非当前会话的消息ID替换
          setSessions(prev => prev.map(session => {
            if (session.sessionId === data.sessionId) {
              return {
                ...session,
                messages: session.messages ? session.messages.map(msg =>
                  msg._id === data.tempId ? { ...msg, _id: data.messageId } : msg
                ) : session.messages
              };
            }
            return session;
          }));
        }
      }
    };

    // 保存回调引用用于精确清理
    sentCallbackRef.current = handleMessageSent;
    onMessageSent(handleMessageSent);

    return () => {
      // 精确移除特定回调而不是全部
      offNewMessage();
      offMessageSent();
      disconnectSocket();
      clearTimeout(initTimer);
      clearInterval(connectionCheckTimer);
    };
  }, [selectedSession]);

  // 确保组件加载时消息列表自动滚动到底部
  useEffect(() => {
    if (selectedSession && selectedSession.messages && selectedSession.messages.length > 0) {
      setTimeout(scrollToBottom, 100);
    }
  }, [selectedSession]);

  // 加载初始数据
  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  // 搜索和筛选
  useEffect(() => {
    setCurrentPage(1);
    loadSessions(1, searchTerm, statusFilter);
  }, [searchTerm, statusFilter, loadSessions]);

  // 处理分页
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      loadSessions(page, searchTerm, statusFilter);
    }
  };

  // 处理会话选择
  const handleSessionSelect = (session: ChatSession) => {
    setSelectedSession(session);
    loadSessionDetails(session.sessionId);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* 顶部导航栏 */}
      <div className="bg-gray-800 border-b border-gray-700 py-4 px-6 flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <MessageCircle className="text-blue-400" size={24} />
          <h1 className="text-xl font-semibold">客服管理</h1>
        </div>
        <div className="flex items-center space-x-4">
          <button className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-full transition-all">
            <Bell size={20} />
          </button>
          <button className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-full transition-all">
            <Settings size={20} />
          </button>
          <div className="h-6 border-r border-gray-700"></div>
          <button className="flex items-center space-x-2 text-gray-400 hover:text-white transition-all">
            <LogOut size={18} />
            <span className="hidden md:inline">退出登录</span>
          </button>
        </div>
      </div>

      {/* 侧边导航 */}
      <div className="flex">
        <div className="w-64 bg-gray-800 border-r border-gray-700 h-[calc(100vh-64px)] flex-shrink-0">
          <div className="p-4">
            <div className="space-y-1">
              <button className="flex items-center w-full px-4 py-2 text-gray-300 hover:bg-blue-600/20 hover:text-blue-100 rounded-lg transition-all">
                <Activity size={18} className="mr-2" />
                <span>仪表盘</span>
              </button>
              <button className="flex items-center w-full px-4 py-2 bg-blue-600/20 text-blue-100 rounded-lg transition-all">
                <MessageCircle size={18} className="mr-2" />
                <span>客服消息</span>
              </button>
              <button className="flex items-center w-full px-4 py-2 text-gray-300 hover:bg-blue-600/20 hover:text-blue-100 rounded-lg transition-all">
                <Users size={18} className="mr-2" />
                <span>用户管理</span>
              </button>
              <button className="flex items-center w-full px-4 py-2 text-gray-300 hover:bg-blue-600/20 hover:text-blue-100 rounded-lg transition-all">
                <Wrench size={18} className="mr-2" />
                <span>工具管理</span>
              </button>
              <button className="flex items-center w-full px-4 py-2 text-gray-300 hover:bg-blue-600/20 hover:text-blue-100 rounded-lg transition-all">
                <ShoppingBag size={18} className="mr-2" />
                <span>产品管理</span>
              </button>
              <button className="flex items-center w-full px-4 py-2 text-gray-300 hover:bg-blue-600/20 hover:text-blue-100 rounded-lg transition-all">
                <PieChart size={18} className="mr-2" />
                <span>订单管理</span>
              </button>
            </div>
          </div>
        </div>

        {/* 主内容区域 */}
        <div className="flex-1 flex flex-col h-[calc(100vh-64px)]">
          {/* 搜索和筛选 */}
          <div className="p-4 bg-gray-800/50 border-b border-gray-700 flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0 md:space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="搜索用户、消息内容..."
                className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center space-x-3">
              <div className="relative">
                <select
                  className="appearance-none bg-gray-700 border border-gray-600 text-white rounded-lg py-2 pl-4 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="active">活跃会话</option>
                  <option value="waiting">等待中</option>
                  <option value="closed">已关闭</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
              </div>
              <button className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all">
                <Refresh size={18} />
              </button>
            </div>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* 会话列表 */}
            <div className="w-80 bg-gray-800/30 border-r border-gray-700 flex flex-col">
              <div className="overflow-y-auto flex-1">
                {loading ? (
                  <div className="p-6 space-y-4">
                    {Array(3).fill(0).map((_, index) => (
                      <div key={index} className="animate-pulse space-y-2">
                        <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : error ? (
                  <div className="p-6 text-center text-red-400">
                    {error}
                    <button 
                      className="mt-2 text-blue-400 hover:text-blue-300"
                      onClick={() => loadSessions(currentPage, searchTerm, statusFilter)}
                    >
                      重试
                    </button>
                  </div>
                ) : sessions.length === 0 ? (
                  <div className="p-6 text-center text-gray-400">
                    暂无会话
                  </div>
                ) : (
                  <div className="divide-y divide-gray-700">
                    {sessions.map((session) => {
                        // 确保session对象完整
                        if (!session || !session.sessionId || !session.user) {
                          return null;
                        }
                        return (
                          <div
                            key={session.sessionId}
                            className={`p-4 cursor-pointer hover:bg-gray-700/50 transition-all ${selectedSession && selectedSession.sessionId === session.sessionId ? 'bg-blue-600/20' : ''}`}
                            onClick={() => handleSessionSelect(session)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <h3 className="font-medium text-white truncate">{session.user.username || '未知用户'}</h3>
                                <p className="text-sm text-gray-400 truncate mt-1">
                                  {session.messages && session.messages.length > 0 
                                    ? `${session.messages[session.messages.length - 1]?.sender === 'admin' ? '我: ' : ''}${session.messages[session.messages.length - 1]?.content || ''}`
                                    : '暂无消息'}
                                </p>
                              </div>
                              {session.unreadCount && session.unreadCount > 0 && (
                                <span className="ml-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full flex-shrink-0">
                                  {session.unreadCount}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center justify-between mt-2">
                              <span className={`text-xs ${session.status === 'active' ? 'text-green-400' : session.status === 'waiting' ? 'text-yellow-400' : 'text-gray-400'}`}>
                                {session.status === 'active' ? '活跃' : session.status === 'waiting' ? '等待中' : '已关闭'}
                              </span>
                              <span className="text-xs text-gray-500">
                                {session.messages && session.messages.length > 0 && session.messages[session.messages.length - 1]?.createdAt 
                                  ? new Date(session.messages[session.messages.length - 1].createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                                  : session.createdAt ? new Date(session.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
              
              {/* 分页控件 */}
              {totalPages > 1 && !loading && (
                <div className="p-4 border-t border-gray-700 flex items-center justify-between">
                  <button
                    className={`px-3 py-1 rounded ${currentPage === 1 ? 'text-gray-500 cursor-not-allowed' : 'text-gray-300 hover:text-white hover:bg-gray-700'}`}
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    上一页
                  </button>
                  <div className="text-sm text-gray-400">
                    第 {currentPage} / {totalPages} 页
                  </div>
                  <button
                    className={`px-3 py-1 rounded ${currentPage === totalPages ? 'text-gray-500 cursor-not-allowed' : 'text-gray-300 hover:text-white hover:bg-gray-700'}`}
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    下一页
                  </button>
                </div>
              )}
            </div>

            {/* 聊天区域 */}
            {selectedSession ? (
              <div className="flex-1 flex flex-col">
                {/* 会话头部 */}
                <div className="p-4 bg-gray-800/50 border-b border-gray-700 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-lg font-semibold">
                        {selectedSession?.user?.username ? selectedSession.user.username.charAt(0).toUpperCase() : '?'}
                    </div>
                    <div className="ml-3">
                      <h2 className="font-medium text-white">{selectedSession?.user?.username || '未知用户'}</h2>
                      <div className="flex items-center mt-1">
                        <span className={`w-2 h-2 rounded-full ${selectedSession?.status === 'active' ? 'bg-green-400' : 'bg-gray-500'}`}></span>
                        <span className="text-xs text-gray-400 ml-1">
                            {selectedSession?.status === 'active' ? '在线' : selectedSession?.status === 'waiting' ? '等待中' : '已关闭'}
                          </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button 
                      className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                      onClick={() => selectedSession?.sessionId && loadSessionDetails(selectedSession.sessionId)}
                      disabled={!selectedSession?.sessionId}
                    >
                      <Refresh size={18} />
                    </button>
                    <button 
                      className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-all"
                      onClick={() => selectedSession?.sessionId && handleCloseSession(selectedSession.sessionId)}
                      disabled={!selectedSession?.sessionId}
                    >
                      <XCircle size={18} />
                    </button>
                  </div>
                </div>

                {/* 聊天消息 */}
                <div className="flex-1 overflow-y-auto p-4">
                  {selectedSession?.messages?.map((message) => (
                        <div key={message._id} className="mb-4">
                          <div 
                            className={`flex ${message?.sender === 'admin' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`max-w-[70%] ${message?.sender === 'admin' ? 'bg-blue-600/20 text-blue-100' : 'bg-gray-700 text-white'} p-3 rounded-lg`}>
                              <div className="text-sm mb-1 text-gray-400">
                                {message?.sender === 'admin' ? '我' : selectedSession?.user?.username || '未知用户'} · {message?.createdAt ? new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                              </div>
                              <div className="whitespace-pre-wrap">{message?.content || ''}</div>
                            </div>
                          </div>
                        </div>
                      )) || (
                        <div className="text-center text-gray-500 p-4">暂无消息</div>
                      )}
                  <div ref={messagesEndRef} />
                </div>

                {/* 消息输入框 */}
                <div className="p-4 border-t border-gray-700 bg-gray-800/50">
                  <form onSubmit={handleSendMessage}>
                    <div className="flex items-end space-x-2">
                      <div className="flex-1">
                        <textarea
                          placeholder="输入回复内容..."
                          className={`w-full p-3 bg-gray-700 border ${connectionStatus !== 'connected' ? 'border-red-500' : 'border-gray-600'} rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none min-h-[80px]`}
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                        />
                      </div>
                      <div className="flex space-x-2 pb-1">
                        <button type="button" className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all">
                          <Paperclip size={20} />
                        </button>
                        <button type="button" className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all">
                          <Smile size={20} />
                        </button>
                        <button type="submit" className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all">
                          <Send size={20} />
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center bg-gray-800/50">
                <div className="text-center">
                  <MessageCircle size={48} className="text-gray-600 mx-auto mb-3" />
                  <h3 className="text-xl font-medium text-gray-400">请选择一个会话开始聊天</h3>
                  <p className="text-gray-500 mt-1">从左侧列表中选择一个用户会话进行回复</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminCustomerService;