import axios from 'axios';

// 创建axios实例
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// 用户注册接口
export const registerUser = async (userData: {
  email: string;
  password: string;
  username: string;
}) => {
  try {
    console.log('Sending registration request:', userData);
    const response = await api.post('/api/auth/register', userData);
    console.log('Registration response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Registration error:', error);
    if (axios.isAxiosError(error)) {
      console.error('Axios error details:', error.response?.data);
      throw new Error(error.response?.data?.message || '注册失败，请稍后重试');
    }
    throw new Error('注册失败，请稍后重试');
  }
};

// 修复tococaleString拼写错误 - 这个函数可以用来替代错误的实现
export const safeFormatDate = (date: Date | string): string => {
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleString();
  } catch (error) {
    console.error('Date formatting error:', error);
    return typeof date === 'string' ? date : new Date().toLocaleString();
  }
};

// 用户登录接口
export const loginUser = async (credentials: {
  email: string;
  password: string;
}) => {
  try {
    const response = await api.post('/api/auth/login', credentials);
    // 存储token和用户信息到localStorage
    if (response.data.token) {
      localStorage.setItem('userToken', response.data.token);
      localStorage.setItem('userInfo', JSON.stringify(response.data.user));
    }
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || '登录失败，请稍后重试');
    }
    throw new Error('登录失败，请稍后重试');
  }
};

// 获取当前用户信息
export const getCurrentUser = () => {
  const userInfo = localStorage.getItem('userInfo');
  return userInfo ? JSON.parse(userInfo) : null;
};

// 用户登出
export const logoutUser = () => {
  localStorage.removeItem('userToken');
  localStorage.removeItem('userInfo');
};

// 检查用户是否已登录
export const isAuthenticated = () => {
  return !!localStorage.getItem('userToken');
};

// 请求拦截器 - 添加认证token
export const setupAuthInterceptor = () => {
  api.interceptors.request.use(
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

  // 响应拦截器 - 处理token过期等情况
  api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        // token过期或无效，清除本地存储并跳转到登录页
        logoutUser();
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }
  );
};

export default api;