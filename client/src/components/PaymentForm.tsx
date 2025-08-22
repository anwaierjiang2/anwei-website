import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, CreditCard, Wallet, ShoppingBag, Loader, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

import {
  createOrder,
  processPayment,
  PaymentMethod,
  getAvailablePaymentMethods,
  OrderProduct,
  ShippingAddress,
  generatePaymentQRCode
} from '../services/paymentService';

interface Product {
  _id: string;
  name: string;
  price: number;
  quantity: number;
  taobaoLink: string;
}

interface PaymentFormProps {
  products: Product[];
  onClose: () => void;
  onPaymentSuccess: () => void;
}

const PaymentForm: React.FC<PaymentFormProps> = ({ products, onClose, onPaymentSuccess }) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(PaymentMethod.WECHAT);
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    name: '',
    phone: '',
    address: '',
    city: '',
    postalCode: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'address' | 'payment' | 'confirm' | 'qrcode'>('address');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [orderId, setOrderId] = useState('');
  const [countdown, setCountdown] = useState(60);

  // 计算总价
  const calculateTotal = () => {
    return products.reduce((sum, product) => sum + (product.price * product.quantity), 0);
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setShippingAddress(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 检查是否已登录
      const token = localStorage.getItem('userToken');
      if (!token) {
        throw new Error('请先登录后再进行支付');
      }

      // 准备订单数据
      const orderProducts: OrderProduct[] = products.map(product => ({
        product: product._id,
        quantity: product.quantity,
        price: product.price
      }));

      // 调用创建订单服务
      const order = await createOrder({
        products: orderProducts,
        paymentMethod: selectedMethod,
        shippingAddress
      });
      setOrderId(order._id);
      
      // 根据支付方式处理
      if (selectedMethod === PaymentMethod.TAOBAO) {
        // 淘宝支付直接跳转
        setLoading(false);
        
        // 直接使用传入的产品对象中的淘宝链接
        const firstProduct = products[0];
        const taobaoUrl = firstProduct.taobaoLink;
        
        if (taobaoUrl && taobaoUrl.trim() !== '') {
          window.open(taobaoUrl, '_blank');
          setStep('confirm');
          setTimeout(onPaymentSuccess, 2000);
        } else {
          setError('该产品没有有效的淘宝链接，请选择其他支付方式');
        }
      } else {
        // 微信或支付宝支付，生成二维码
        const qrUrl = await generatePaymentQRCode(order._id, selectedMethod);
        setQrCodeUrl(qrUrl);
        setStep('qrcode');
        setLoading(false);
        // 开始倒计时
        setCountdown(60);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '支付过程中出现错误，请稍后重试');
      setLoading(false);
    }
  };

  // 倒计时效果
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 'qrcode' && countdown > 0) {
      timer = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    } else if (step === 'qrcode' && countdown === 0) {
      // 倒计时结束，模拟支付成功
      setStep('confirm');
      setTimeout(onPaymentSuccess, 2000);
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [step, countdown, onPaymentSuccess]);

  // 模拟支付成功
  const handleSimulatePayment = async () => {
    try {
      setLoading(true);
      const paymentResult = await processPayment(orderId, selectedMethod);
      if (paymentResult.success) {
        setStep('confirm');
        setTimeout(onPaymentSuccess, 2000);
      }
    } catch (error) {
      setError('模拟支付失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 获取可用的支付方式
  const paymentMethods = getAvailablePaymentMethods().map(method => ({
    id: method.id,
    name: method.name,
    description: method.description,
    icon: method.id === PaymentMethod.WECHAT ? 
      <Wallet className="w-5 h-5" /> : 
      method.id === PaymentMethod.ALIPAY ? 
        <CreditCard className="w-5 h-5" /> : 
        <ShoppingBag className="w-5 h-5" />
  }));

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 border border-gray-700">
        {/* 头部导航 */}
        <div className="flex items-center mb-6">
          <button 
            onClick={onClose} 
            className="p-2 rounded-full hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-300" />
          </button>
          <h2 className="text-xl font-bold text-white ml-4">
            {step === 'address' ? '填写收货地址' : 
             step === 'payment' ? '选择支付方式' : '支付确认'}
          </h2>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300">
            <div className="flex items-center">
              <AlertCircle size={18} className="mr-2" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {step === 'confirm' ? (
          // 支付确认页面
          <div className="text-center py-10">
            {loading ? (
              <>
                <Loader className="w-12 h-12 text-primary-500 mx-auto animate-spin mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">支付处理中...</h3>
                <p className="text-gray-400">请稍候，我们正在处理您的支付请求</p>
              </>
            ) : (
              <>
                <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle size={40} className="text-green-500" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">支付成功！</h3>
                <p className="text-gray-400 mb-8">您的订单已提交，我们将尽快为您处理</p>
              </>
            )}
          </div>
        ) : step === 'qrcode' ? (
          // 二维码支付页面
          <div className="text-center py-6">
            <h3 className="text-xl font-semibold text-white mb-6">
              {selectedMethod === PaymentMethod.WECHAT ? '微信扫码支付' : '支付宝扫码支付'}
            </h3>
            
            <div className="flex flex-col items-center justify-center mb-8">
              {/* 本地固定二维码 */}
              <div className="w-64 h-64 bg-white flex items-center justify-center mb-4">
                {loading ? (
                  <Loader className="w-12 h-12 text-primary-500 animate-spin" />
                ) : (
                  <img 
                    src={qrCodeUrl || (selectedMethod === PaymentMethod.WECHAT ? '/qrcodes/wechat_qr.png' : '/qrcodes/alipay_qr.png')} 
                    alt={selectedMethod === PaymentMethod.WECHAT ? "微信支付二维码" : "支付宝支付二维码"} 
                    className="max-w-full max-h-full"
                  />
                )}
              </div>
              
              {/* 倒计时 */}
              <div className="text-gray-400 mb-4">
                <span className="text-red-500 font-medium">{countdown}</span>秒后自动确认支付
              </div>
              
              {/* 支付金额 */}
              <div className="text-xl font-bold text-white mb-6">
                支付金额：¥{calculateTotal()}
              </div>
              
              {/* 支付方式说明 */}
              <div className="text-sm text-gray-400 max-w-xs">
                {selectedMethod === PaymentMethod.WECHAT ? (
                  "请使用微信扫描上方二维码完成支付"
                ) : (
                  "请使用支付宝扫描上方二维码完成支付"
                )}
              </div>
            </div>
            
            {/* 底部按钮 */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setStep('payment')}
                className="flex-1 py-3 px-4 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-800 transition-colors duration-200"
              >
                重新选择支付方式
              </button>
              <button
                type="button"
                onClick={handleSimulatePayment}
                className={`flex-1 py-3 px-4 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg transition-colors duration-200 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                disabled={loading}
              >
                {loading ? (
                  <Loader size={18} className="animate-spin mr-2" />
                ) : (
                  '确认支付'
                )}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {step === 'address' ? (
              // 收货地址表单
              <>
                <div className="mb-4">
                  <label htmlFor="name" className="block text-gray-300 mb-2">
                    收货人姓名
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="请输入收货人姓名"
                    value={shippingAddress.name}
                    onChange={handleAddressChange}
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="phone" className="block text-gray-300 mb-2">
                    联系电话
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="请输入联系电话"
                    value={shippingAddress.phone}
                    onChange={handleAddressChange}
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="address" className="block text-gray-300 mb-2">
                    详细地址
                  </label>
                  <textarea
                    id="address"
                    name="address"
                    rows={3}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="请输入详细地址信息"
                    value={shippingAddress.address}
                    onChange={handleAddressChange}
                    required
                  ></textarea>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <label htmlFor="city" className="block text-gray-300 mb-2">
                      城市
                    </label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="请输入城市"
                      value={shippingAddress.city}
                      onChange={handleAddressChange}
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="postalCode" className="block text-gray-300 mb-2">
                      邮政编码
                    </label>
                    <input
                      type="text"
                      id="postalCode"
                      name="postalCode"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="请输入邮政编码"
                      value={shippingAddress.postalCode}
                      onChange={handleAddressChange}
                      required
                    />
                  </div>
                </div>
              </>
            ) : (
              // 支付方式选择
              <>
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-white mb-4">选择支付方式</h3>
                  <div className="grid grid-cols-1 gap-3">
                    {paymentMethods.map(method => (
                      <motion.div
                        key={method.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`p-4 rounded-lg cursor-pointer transition-colors duration-200 flex items-center justify-between ${selectedMethod === method.id ? 'bg-primary-500/20 border border-primary-500/50' : 'bg-gray-800/50 border border-gray-700'}`}
                        onClick={() => setSelectedMethod(method.id)}
                      >
                        <div className="flex items-center">
                          <div className={`p-2 rounded-full mr-3 ${selectedMethod === method.id ? 'bg-primary-500/30 text-primary-400' : 'bg-gray-700 text-gray-300'}`}>
                            {method.icon}
                          </div>
                          <div>
                            <div className="flex items-center">
                              <span className="text-white font-medium">{method.name}</span>
                              {method.id === PaymentMethod.TAOBAO && (
                                <span className="ml-2 text-xs text-primary-500 bg-primary-500/20 px-2 py-0.5 rounded">
                                  外部链接
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-gray-400 block">{method.description}</span>
                          </div>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedMethod === method.id ? 'border-primary-500 bg-primary-500' : 'border-gray-600'}`}>
                          {selectedMethod === method.id && (
                            <div className="w-2 h-2 bg-white rounded-full" />
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
                
                {/* 订单摘要 */}
                <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 mb-6">
                  <h3 className="text-lg font-medium text-white mb-4">订单摘要</h3>
                  <div className="space-y-3">
                    {products.map(product => (
                      <div key={product._id} className="flex justify-between items-center">
                        <div className="text-gray-300">{product.name} × {product.quantity}</div>
                        <div className="text-white">¥{product.price * product.quantity}</div>
                      </div>
                    ))}
                    <div className="border-t border-gray-700 pt-3 mt-3 flex justify-between items-center">
                      <div className="text-white font-semibold">总计</div>
                      <div className="text-white text-lg font-bold">¥{calculateTotal()}</div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* 导航按钮 */}
            <div className="flex gap-4">
              {step !== 'address' && (
                <button
                  type="button"
                  onClick={() => setStep(step === 'payment' ? 'address' : 'payment')}
                  className="flex-1 py-3 px-4 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-800 transition-colors duration-200"
                >
                  上一步
                </button>
              )}
              <button
                type="submit"
                className={`flex-1 py-3 px-4 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg transition-colors duration-200 flex items-center justify-center ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                disabled={loading}
              >
                {loading ? (
                  <Loader size={18} className="animate-spin mr-2" />
                ) : step === 'address' ? (
                  '下一步'
                ) : (
                  '确认支付'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default PaymentForm;