import axios from 'axios';

// 创建管理员API axios实例
const adminApiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 管理员请求拦截器，添加认证token
adminApiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 管理员响应拦截器，处理错误
adminApiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // 处理401错误（未授权）
    if (error.response?.status === 401) {
      localStorage.removeItem('adminToken');
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

// 创建用户API axios实例
const userApiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
  timeout: 30000, // 增加超时时间，以适应AI响应
  headers: {
    'Content-Type': 'application/json',
  },
});

// 用户请求拦截器，添加认证token
userApiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 用户响应拦截器，处理错误
userApiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // 处理401错误（未授权）
    if (error.response?.status === 401) {
      localStorage.removeItem('userToken');
      localStorage.removeItem('userInfo');
      // 不自动跳转，让应用层处理
    }
    return Promise.reject(error);
  }
);

// 工具相关API
export const toolsAPI = {
  // 获取工具列表
  getTools: async (): Promise<any> => {
    const response = await adminApiClient.get('/api/admin/tools');
    return response.data;
  },

  // 获取工具统计数据
  getToolStats: async (): Promise<any> => {
    const response = await adminApiClient.get('/api/admin/tools/stats');
    return response.data;
  },

  // 更新工具状态
  updateToolStatus: async (toolId: string, isActive: boolean): Promise<any> => {
    const response = await adminApiClient.patch(`/api/admin/tools/${toolId}/status`, {
      isActive,
    });
    return response.data;
  },

  // 添加工具
  addTool: async (toolData: any): Promise<any> => {
    const response = await adminApiClient.post('/api/admin/tools', toolData);
    return response.data;
  },

  // 删除工具
  deleteTool: async (toolId: string): Promise<any> => {
    const response = await adminApiClient.delete(`/api/admin/tools/${toolId}`);
    return response.data;
  },

  // 上传工具图片
  uploadToolImage: async (formData: FormData): Promise<any> => {
    // 使用不同的headers上传文件
    const token = localStorage.getItem('adminToken');
    const response = await axios.post(
      `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/admin/tools/upload-image`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: token ? `Bearer ${token}` : undefined,
        },
      }
    );
    return response.data;
  },

  // 验证管理员认证
  verifyAdmin: async (): Promise<boolean> => {
    try {
      await adminApiClient.get('/api/auth/verify');
      return true;
    } catch (error) {
      return false;
    }
  },
};

// AI聊天相关API
export const aiChatAPI = {
  // 发送消息给AI
  sendMessage: async (messages: Array<{role: string, content: string}>, model: string): Promise<any> => {
    const response = await userApiClient.post('/api/chat', {
      messages,
      model
    });
    return response.data;
  },

  // 获取聊天历史
  getChatHistories: async (): Promise<any> => {
    const response = await userApiClient.get('/api/chat/ai-history');
    return response.data;
  },

  // 获取特定聊天历史
  getChatHistory: async (historyId: string): Promise<any> => {
    const response = await userApiClient.get(`/api/chat/ai-history/${historyId}`);
    return response.data;
  },

  // 保存聊天历史
  saveChatHistory: async (historyData: any): Promise<any> => {
    const response = await userApiClient.post('/api/chat/ai-history', historyData);
    return response.data;
  },

  // 更新聊天历史
  updateChatHistory: async (historyId: string, historyData: any): Promise<any> => {
    const response = await userApiClient.put(`/api/chat/ai-history/${historyId}`, historyData);
    return response.data;
  },

  // 删除特定聊天历史
  deleteChatHistory: async (historyId: string): Promise<any> => {
    const response = await userApiClient.delete(`/api/chat/ai-history/${historyId}`);
    return response.data;
  },

  // 清除所有聊天历史
  clearAllChatHistories: async (): Promise<any> => {
    const response = await userApiClient.delete('/api/chat/ai-history');
    return response.data;
  },
};

// 默认导出adminApiClient
// 保留默认导出以兼容旧的代码
// 但新代码应使用命名导出{ toolsAPI, aiChatAPI }
export default adminApiClient;