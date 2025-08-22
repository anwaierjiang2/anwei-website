// 聊天消息类型
export interface Message {
  _id: string;
  content: string;
  sender: 'user' | 'admin' | 'system';
  read: boolean;
  createdAt: string;
}

// 用户类型
export interface User {
  _id: string;
  username: string;
  email?: string;
  avatar?: string;
  role: 'user' | 'admin';
}

// 聊天会话类型
export interface ChatSession {
  _id: string;
  sessionId: string;
  user: User;
  admin?: User;
  messages: Message[];
  status: 'active' | 'waiting' | 'closed';
  createdAt: string;
  updatedAt: string;
  unreadCount?: number;
}

// 通知设置类型
export interface NotificationSettings {
  emailEnabled: boolean;
  pushEnabled: boolean;
}

// 分页信息类型
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
  validTotal?: number;
}

// API响应类型
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// 聊天会话列表API响应
export interface ChatSessionsResponse {
  sessions: ChatSession[];
  pagination: Pagination;
}

// 聊天会话详情API响应
export interface ChatSessionDetailResponse {
  session: ChatSession;
}

// 发送消息请求
export interface SendMessageRequest {
  content: string;
}

// 发送消息响应
export interface SendMessageResponse {
  messageId: string;
  sessionId: string;
  success: boolean;
}

// WebSocket消息格式
export interface WebSocketMessage {
  type: string;
  sessionId: string;
  message: Message;
  userId?: string;
}