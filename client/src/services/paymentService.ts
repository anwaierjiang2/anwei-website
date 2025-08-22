import axios from 'axios';

// 创建axios实例用于支付相关请求
const paymentClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器，添加认证token
paymentClient.interceptors.request.use(
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

// 支付方式枚举
export enum PaymentMethod {
  WECHAT = 'wechat',
  ALIPAY = 'alipay',
  TAOBAO = 'taobao'
}

// 订单产品接口
export interface OrderProduct {
  product: string; // 产品ID
  quantity: number;
  price: number;
}

// 收货地址接口
export interface ShippingAddress {
  name: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
}

// 创建订单请求接口
export interface CreateOrderRequest {
  products: OrderProduct[];
  paymentMethod: PaymentMethod;
  shippingAddress: ShippingAddress;
}

// 订单响应接口
export interface OrderResponse {
  _id: string;
  user: string;
  products: Array<{
    product: {
      _id: string;
      name: string;
      price: number;
    };
    quantity: number;
    price: number;
  }>;
  paymentMethod: PaymentMethod;
  shippingAddress: ShippingAddress;
  totalPrice: number;
  isPaid: boolean;
  paidAt: string | null;
  isDelivered: boolean;
  deliveredAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// 支付结果接口
export interface PaymentResult {
  success: boolean;
  orderId: string;
  paymentId: string;
  message: string;
}

/**
 * 创建订单
 * @param orderData 订单数据
 * @returns 创建的订单信息
 */
export const createOrder = async (orderData: CreateOrderRequest): Promise<OrderResponse> => {
  try {
    const response = await paymentClient.post('/api/orders', orderData);
    return response.data;
  } catch (error) {
    console.error('创建订单失败:', error);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || '创建订单失败');
    }
    throw new Error('创建订单失败，请稍后重试');
  }
};

/**
 * 获取订单详情
 * @param orderId 订单ID
 * @returns 订单详情
 */
export const getOrderDetails = async (orderId: string): Promise<OrderResponse> => {
  try {
    const response = await paymentClient.get(`/api/orders/${orderId}`);
    return response.data;
  } catch (error) {
    console.error('获取订单详情失败:', error);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || '获取订单详情失败');
    }
    throw new Error('获取订单详情失败，请稍后重试');
  }
};

/**
 * 获取用户订单列表
 * @returns 用户订单列表
 */
export const getUserOrders = async (): Promise<OrderResponse[]> => {
  try {
    const response = await paymentClient.get('/api/orders/myorders');
    return response.data;
  } catch (error) {
    console.error('获取订单列表失败:', error);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || '获取订单列表失败');
    }
    throw new Error('获取订单列表失败，请稍后重试');
  }
};

/**
 * 处理支付
 * @param orderId 订单ID
 * @param paymentMethod 支付方式
 * @returns 支付结果
 */
export const processPayment = async (orderId: string, paymentMethod: PaymentMethod): Promise<PaymentResult> => {
  try {
    // 实际项目中，这里会根据不同的支付方式调用相应的支付API
    // 这里我们模拟支付处理
    const response = await paymentClient.post(`/api/orders/${orderId}/pay`, {
      paymentMethod
    });
    return response.data;
  } catch (error) {
    console.error('支付处理失败:', error);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || '支付处理失败');
    }
    throw new Error('支付处理失败，请稍后重试');
  }
};

/**
 * 检查支付状态
 * @param orderId 订单ID
 * @returns 订单最新状态
 */
export const checkPaymentStatus = async (orderId: string): Promise<OrderResponse> => {
  try {
    const response = await paymentClient.get(`/api/orders/${orderId}/status`);
    return response.data;
  } catch (error) {
    console.error('检查支付状态失败:', error);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || '检查支付状态失败');
    }
    throw new Error('检查支付状态失败，请稍后重试');
  }
};

/**
 * 获取支付方式列表
 * @returns 可用的支付方式列表
 */
export const getAvailablePaymentMethods = (): Array<{
  id: PaymentMethod;
  name: string;
  description: string;
}> => {
  return [
    {
      id: PaymentMethod.WECHAT,
      name: '微信支付',
      description: '使用微信扫码支付'
    },
    {
      id: PaymentMethod.ALIPAY,
      name: '支付宝',
      description: '使用支付宝扫码支付'
    },
    {
      id: PaymentMethod.TAOBAO,
      name: '淘宝支付',
      description: '通过淘宝平台支付'
    }
  ];
};

/**
 * 生成支付二维码
 * 返回本地固定二维码图片的路径
 */
export const generatePaymentQRCode = (orderId: string, paymentMethod: PaymentMethod): Promise<string> => {
  return new Promise((resolve) => {
    // 延迟一下模拟网络请求
    setTimeout(() => {
      // 返回本地固定二维码图片的路径
      if (paymentMethod === PaymentMethod.WECHAT) {
        resolve('/qrcodes/wechat_qr.png');
      } else if (paymentMethod === PaymentMethod.ALIPAY) {
        resolve('/qrcodes/alipay_qr.png');
      } else {
        // 其他支付方式仍然返回原来的路径
        resolve(`/api/qrcode/${orderId}/${paymentMethod}`);
      }
    }, 100);
  });
};

/**
 * 处理支付回调
 * 实际项目中，这会处理支付平台的异步通知
 */
export const handlePaymentCallback = async (orderId: string, paymentId: string): Promise<boolean> => {
  try {
    const response = await paymentClient.post(`/api/orders/${orderId}/callback`, {
      paymentId
    });
    return response.data.success;
  } catch (error) {
    console.error('处理支付回调失败:', error);
    return false;
  }
};