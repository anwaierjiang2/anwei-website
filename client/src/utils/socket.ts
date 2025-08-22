import { useEffect, useCallback, useState } from 'react';

// WebSocket连接状态
export let socket: WebSocket | null = null;
// 消息队列，用于存储连接断开时无法发送的消息
const messageQueue: Array<{ sessionId: string; content: string; sender: string; receiverId: string }> = [];
// 重试连接次数
let reconnectAttempts = 0;
// 最大重试次数
const MAX_RECONNECT_ATTEMPTS = 5;
// 当前的用户ID，用于认证
let currentUserId: string | null = null;
// 当前的token，用于认证
let currentToken: string | null = null;
// 消息回调函数集合
const messageCallbacks: Record<string, Array<(data: any) => void>> = {};
// 是否正在重连中
let isReconnecting = false;

// 获取WebSocket的URL（动态获取）
const getWebSocketUrl = (): string => {
  // 从环境变量或配置中获取，这里提供默认值
  const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:3002';
  // 将HTTP URL转换为WebSocket URL
  const wsProtocol = baseUrl.startsWith('https') ? 'wss://' : 'ws://';
  const wsBaseUrl = baseUrl.replace(/^https?:\/\//, '');
  return `${wsProtocol}${wsBaseUrl}/ws`;
};

// 初始化WebSocket连接
export const initSocket = async (): Promise<WebSocket> => {
  // 如果已经有连接且处于打开状态，直接返回
  if (socket && socket.readyState === WebSocket.OPEN) {
    return socket;
  }

  // 如果正在重连中，等待重连完成
  if (isReconnecting) {
    return new Promise((resolve, reject) => {
      const checkInterval = setInterval(() => {
        if (socket && socket.readyState === WebSocket.OPEN && !isReconnecting) {
          clearInterval(checkInterval);
          resolve(socket);
        } else if (!isReconnecting) {
          clearInterval(checkInterval);
          reject(new Error('WebSocket重连失败'));
        }
      }, 100);
    });
  }

  // 创建新的WebSocket连接
  try {
    isReconnecting = true;
    socket = new WebSocket(getWebSocketUrl());
    
    // 配置连接参数
    configureSocketEvents();
    
    // 等待连接打开
    await waitForSocketOpen(socket);
    
    // 连接成功，重置重连次数
    reconnectAttempts = 0;
    
    // 认证（如果有token）
    if (currentToken && currentUserId) {
      authenticateSocket();
    }
    
    return socket;
  } catch (error) {
    console.error('WebSocket初始化失败:', error);
    socket = null;
    throw error;
  } finally {
    isReconnecting = false;
  }
};

// 配置WebSocket事件处理器
const configureSocketEvents = () => {
  if (!socket) return;

  // 连接打开事件
  socket.onopen = () => {
    console.log('WebSocket连接已打开');
    // 发送队列中的消息
    sendQueuedMessages();
  };

  // 接收消息事件
  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      
      // 根据消息类型分发到对应的回调函数
      if (data.type && messageCallbacks[data.type]) {
        messageCallbacks[data.type].forEach(callback => callback(data));
      }
      
      // 特殊处理：新消息
      if (data.type === 'new_message') {
        if (messageCallbacks['new_message']) {
          messageCallbacks['new_message'].forEach(callback => callback(data));
        }
      }
      
      // 特殊处理：消息已发送确认
      if (data.type === 'message_sent') {
        if (messageCallbacks['message_sent']) {
          messageCallbacks['message_sent'].forEach(callback => callback(data));
        }
      }
      
      // 特殊处理：消息错误
      if (data.type === 'message_error') {
        console.error('WebSocket消息错误:', data);
        if (messageCallbacks['message_error']) {
          messageCallbacks['message_error'].forEach(callback => callback(data));
        }
      }
      
    } catch (error) {
      console.error('解析WebSocket消息失败:', error, event.data);
    }
  };

  // 连接关闭事件
  socket.onclose = (event) => {
    console.log('WebSocket连接已关闭', event.code, event.reason);
    socket = null;
    
    // 根据关闭码判断是否需要重连
    if (event.code !== 1000) { // 1000表示正常关闭
      scheduleReconnect();
    }
  };

  // 连接错误事件
  socket.onerror = (error) => {
    console.error('WebSocket错误:', error);
  };
};

// 等待WebSocket连接打开
const waitForSocketOpen = (socket: WebSocket): Promise<void> => {
  return new Promise((resolve, reject) => {
    // 如果WebSocket已经打开，直接resolve
    if (socket.readyState === WebSocket.OPEN) {
      resolve();
      return;
    }

    // 设置超时
    const timeout = setTimeout(() => {
      reject(new Error('WebSocket连接超时'));
    }, 5000);

    // 监听连接打开事件
    const onOpen = () => {
      clearTimeout(timeout);
      socket.removeEventListener('open', onOpen);
      socket.removeEventListener('error', onError);
      resolve();
    };

    // 监听连接错误事件
    const onError = (error: Event) => {
      clearTimeout(timeout);
      socket.removeEventListener('open', onOpen);
      socket.removeEventListener('error', onError);
      reject(error);
    };

    socket.addEventListener('open', onOpen);
    socket.addEventListener('error', onError);
  });
};

// 计划重连
const scheduleReconnect = () => {
  if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
    console.error('已达到最大重连次数，停止重连');
    return;
  }

  reconnectAttempts++;
  const delay = Math.min(1000 * Math.pow(2, reconnectAttempts - 1), 30000); // 指数退避算法，最大延迟30秒
  
  console.log(`计划在 ${delay}ms 后尝试第 ${reconnectAttempts} 次重连`);
  
  setTimeout(() => {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      console.log('尝试重连WebSocket...');
      initSocket().catch(error => {
        console.error('重连WebSocket失败:', error);
      });
    }
  }, delay);
};

// 认证WebSocket连接
export const authenticateSocket = () => {
  if (!socket || socket.readyState !== WebSocket.OPEN || !currentToken || !currentUserId) {
    return;
  }

  const authData = {
    type: 'auth',
    userId: currentUserId,
    token: currentToken
  };

  socket.send(JSON.stringify(authData));
};

// 设置认证信息
export const setAuthInfo = (userId: string, token: string) => {
  currentUserId = userId;
  currentToken = token;
  
  // 如果已经有连接，进行认证
  if (socket && socket.readyState === WebSocket.OPEN) {
    authenticateSocket();
  }
};

// 发送消息
export const sendMessage = (
  sessionId: string,
  content: string,
  sender: string,
  receiverId: string
): void => {
  // 构建消息对象
  const message = {
    type: 'send_message',
    sessionId,
    content,
    sender,
    receiverId,
    timestamp: new Date().toISOString()
  };

  // 检查连接状态
  if (socket && socket.readyState === WebSocket.OPEN) {
    // 直接发送消息
    try {
      socket.send(JSON.stringify(message));
    } catch (error) {
      console.error('发送消息失败，添加到队列:', error);
      messageQueue.push({ sessionId, content, sender, receiverId });
    }
  } else {
    // 连接未打开，添加到队列
    console.warn('WebSocket连接未打开，消息已添加到发送队列');
    messageQueue.push({ sessionId, content, sender, receiverId });
    
    // 如果没有连接，尝试连接
    if (!socket) {
      initSocket().catch(error => {
        console.error('连接WebSocket失败:', error);
      });
    }
  }
};

// 发送队列中的消息
const sendQueuedMessages = () => {
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    return;
  }

  // 创建一个副本，防止在发送过程中修改队列
  const messagesToSend = [...messageQueue];
  messageQueue.length = 0; // 清空队列

  messagesToSend.forEach(message => {
    try {
      const messageObj = {
        type: 'send_message',
        sessionId: message.sessionId,
        content: message.content,
        sender: message.sender,
        receiverId: message.receiverId,
        timestamp: new Date().toISOString()
      };
      
      socket!.send(JSON.stringify(messageObj));
    } catch (error) {
      console.error('重发消息失败，重新添加到队列:', error);
      messageQueue.push(message);
    }
  });
};

// 监听新消息
export const onNewMessage = (callback: (data: any) => void) => {
  if (!messageCallbacks['new_message']) {
    messageCallbacks['new_message'] = [];
  }
  messageCallbacks['new_message'].push(callback);
};

// 取消监听新消息
export const offNewMessage = () => {
  delete messageCallbacks['new_message'];
};

// 监听消息发送成功
export const onMessageSent = (callback: (data: any) => void) => {
  if (!messageCallbacks['message_sent']) {
    messageCallbacks['message_sent'] = [];
  }
  messageCallbacks['message_sent'].push(callback);
};

// 取消监听消息发送成功
export const offMessageSent = () => {
  delete messageCallbacks['message_sent'];
};

// 监听消息错误
export const onMessageError = (callback: (data: any) => void) => {
  if (!messageCallbacks['message_error']) {
    messageCallbacks['message_error'] = [];
  }
  messageCallbacks['message_error'].push(callback);
};

// 取消监听消息错误
export const offMessageError = () => {
  delete messageCallbacks['message_error'];
};

// 检查WebSocket连接状态
export const isSocketConnected = (): boolean => {
  return socket !== null && socket.readyState === WebSocket.OPEN;
};

// 获取当前的WebSocket实例
export const getSocket = (): WebSocket | null => {
  return socket;
};

// 断开WebSocket连接
export const disconnectSocket = () => {
  if (socket) {
    // 阻止重连
    reconnectAttempts = MAX_RECONNECT_ATTEMPTS;
    // 关闭连接
    socket.close(1000, '正常关闭');
    socket = null;
  }
};

// React Hook: 提供WebSocket连接状态
export const useSocketStatus = () => {
  const [isConnected, setIsConnected] = useState(false);
  
  useEffect(() => {
    // 检查初始状态
    setIsConnected(isSocketConnected());
    
    // 定期检查连接状态
    const interval = setInterval(() => {
      setIsConnected(isSocketConnected());
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  return isConnected;
};

// 导出一个React Hook，用于在组件中使用WebSocket
export const useSocket = (userId: string, token: string) => {
  const [isConnected, setIsConnected] = useState(false);
  
  // 初始化连接
  useEffect(() => {
    setAuthInfo(userId, token);
    
    const connect = async () => {
      try {
        await initSocket();
        setIsConnected(true);
      } catch (error) {
        console.error('WebSocket连接失败:', error);
        setIsConnected(false);
      }
    };
    
    connect();
    
    // 清理函数
    return () => {
      disconnectSocket();
    };
  }, [userId, token]);
  
  // 重连函数
  const reconnect = useCallback(async () => {
    try {
      await initSocket();
      setIsConnected(true);
      return true;
    } catch (error) {
      console.error('WebSocket重连失败:', error);
      setIsConnected(false);
      return false;
    }
  }, []);
  
  return {
    isConnected,
    sendMessage,
    reconnect,
    onNewMessage,
    offNewMessage,
    onMessageSent,
    offMessageSent
  };
};