import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Heart, X, MessageCircle, ChevronLeft, ChevronRight, AlertCircle, ExternalLink, Star } from 'lucide-react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import ProductImageCarousel from '../components/ProductImageCarousel';
import PaymentForm from '../components/PaymentForm';
import ContactForm from '../components/ContactForm';
import { isAuthenticated } from '../services/authService';

// 定义产品类型
interface Product {
  _id: string;
  name: string;
  description: string;
  shortDescription: string;
  price: number;
  originalPrice: number;
  category: string;
  tags: string[];
  images: {
    main?: string;
    gallery: string[];
  };
  stock: number;
  isActive: boolean;
  isFeatured: boolean;
  salesCount: number;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  taobaoLink: string;
}

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  // 获取产品详情
  useEffect(() => {
    const fetchProductDetail = async () => {
      try {
        const response = await fetch(`/api/products/${id}`);
        if (!response.ok) {
          throw new Error('获取产品详情失败');
        }
        const data = await response.json();
        setProduct(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : '获取产品详情失败，请稍后重试');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProductDetail();
    }
  }, [id]);

  // 处理加入购物车
  const handleAddToCart = () => {
    // 这里可以实现加入购物车的逻辑
    // 为了简化，我们可以在本地存储中保存购物车信息
    if (!product) return;
    
    try {
      let cart = JSON.parse(localStorage.getItem('cart') || '[]');
      const existingItem = cart.find((item: any) => item.product._id === product._id);
      
      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        cart.push({ product, quantity: 1 });
      }
      
      localStorage.setItem('cart', JSON.stringify(cart));
      alert('商品已加入购物车');
    } catch (error) {
      console.error('加入购物车失败:', error);
      alert('加入购物车失败，请稍后重试');
    }
  };

  // 处理立即购买
  const handleBuyNow = () => {
    if (product) {
      setIsPaymentModalOpen(true);
    }
  };

  // 关闭支付模态框
  const closePaymentModal = () => {
    setIsPaymentModalOpen(false);
  };

  // 打开联系模态框
  const openContactModal = () => {
    setIsContactModalOpen(true);
  };

  // 关闭联系模态框
  const closeContactModal = () => {
    setIsContactModalOpen(false);
  };

  // 返回上一页
  const handleBack = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-300">加载产品中...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-dark-950 text-white flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-300 mb-4">{error || '产品不存在'}</p>
          <button 
            className="px-4 py-2 bg-primary-500 hover:bg-primary-600 rounded-lg transition-colors duration-300"
            onClick={() => navigate('/products')}
          >
            返回产品列表
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-950 text-white">
      {/* 返回按钮 */}
      <div className="sticky top-0 z-30 bg-dark-950/95 backdrop-blur-sm border-b border-dark-800">
        <div className="container mx-auto px-4 py-4">
          <button 
            className="p-2 rounded-full bg-dark-800 hover:bg-primary-500 transition-colors duration-300 inline-flex items-center"
            onClick={handleBack}
            aria-label="返回上一页"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="ml-2">返回</span>
          </button>
        </div>
      </div>

      {/* 主要内容 */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 产品图片 */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="relative"
          >
            <ProductImageCarousel product={product} />
            {product.isFeatured && (
              <div className="absolute top-3 left-3 px-3 py-1 bg-primary-500 text-white text-sm font-semibold rounded-lg">
                推荐产品
              </div>
            )}
          </motion.div>

          {/* 产品信息 */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col gap-6"
          >
            {/* 产品基本信息 */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs px-2 py-1 bg-primary-500/20 text-primary-400 rounded-full">
                  {product.category}
                </span>
                <span className="text-sm text-gray-400">
                  销量: {product.salesCount} | 浏览: {product.viewCount}
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2">
                {product.name}
              </h1>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center text-amber-400">
                  <Star className="w-5 h-5 fill-current" />
                  <span className="ml-1 font-medium">4.8</span>
                </div>
                <span className="text-gray-500">|</span>
                <span className="text-gray-400 text-sm">
                  {product.tags.length} 个标签
                </span>
              </div>
              <div className="flex items-baseline gap-4 mb-6">
                <span className="text-3xl font-bold text-primary-500">
                  ¥{product.price}
                </span>
                {product.originalPrice && product.originalPrice > product.price && (
                  <span className="text-gray-500 line-through">
                    ¥{product.originalPrice}
                  </span>
                )}
              </div>
            </div>

            {/* 产品描述 */}
            <div className="bg-dark-800/50 p-6 rounded-xl">
              <h2 className="text-xl font-semibold mb-4">产品介绍</h2>
              <div className="prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: product.description }} />
            </div>

            {/* 产品标签 */}
            <div>
              <h3 className="text-lg font-medium mb-3">相关标签</h3>
              <div className="flex flex-wrap gap-2">
                {product.tags.map(tag => (
                  <span key={tag} className="px-3 py-1 bg-dark-800 text-gray-300 rounded-full text-sm">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button
                onClick={handleAddToCart}
                className="flex-1 py-4 bg-dark-800 hover:bg-primary-500/90 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 text-lg font-medium"
              >
                <ShoppingCart className="w-6 h-6" />
                <span>加入购物车</span>
              </button>
              <button
                onClick={handleBuyNow}
                className="flex-1 py-4 bg-primary-500 hover:bg-primary-600 rounded-xl transition-all duration-300 text-lg font-medium"
              >
                立即购买
              </button>
            </div>

            {/* 联系我们和收藏按钮 */}
            <div className="flex gap-4 pt-2">
              <button
                onClick={openContactModal}
                className="flex-1 py-3 bg-dark-800/50 hover:bg-dark-800 rounded-lg transition-colors duration-300 flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-5 h-5" />
                <span>联系客服</span>
              </button>
              <button
                className="w-12 h-12 flex items-center justify-center bg-dark-800/50 hover:bg-dark-800 rounded-lg transition-colors duration-300"
                onClick={() => alert('收藏功能暂未实现')}
              >
                <Heart className="w-5 h-5" />
              </button>
              {product.taobaoLink && (
                <a
                  href={product.taobaoLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 flex items-center justify-center bg-dark-800/50 hover:bg-dark-800 rounded-lg transition-colors duration-300"
                  title="前往淘宝"
                >
                  <ExternalLink className="w-5 h-5" />
                </a>
              )}
            </div>
          </motion.div>
        </div>

        {/* 相关产品推荐 */}
        <section className="mt-20">
          <h2 className="text-2xl font-bold mb-8">相关产品推荐</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* 这里可以显示相关产品，暂时使用占位产品 */}
            {[1, 2, 3, 4].map((item) => (
              <motion.div
                key={item}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: item * 0.1 }}
                className="group bg-dark-800/50 rounded-xl overflow-hidden border border-dark-700 hover:border-primary-500/50 transition-all duration-300 hover:transform hover:scale-[1.02] cursor-pointer"
                onClick={() => navigate(`/products/${id}`)}
              >
                <div className="h-48 bg-gradient-to-br from-primary-500/20 to-accent-500/20 flex items-center justify-center">
                  <ShoppingCart className="w-20 h-20 text-primary-400/70 group-hover:text-primary-400 transition-colors duration-300" />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-2 line-clamp-1 group-hover:text-primary-500 transition-colors duration-300">
                    相关产品 {item}
                  </h3>
                  <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                    这是一个相关产品的简要描述，展示了与当前产品类似的功能和特点。
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="text-primary-500 font-bold">¥{Math.floor(Math.random() * 1000) + 100}</span>
                    <button className="p-2 bg-dark-700 hover:bg-primary-500 rounded-full transition-colors duration-300">
                      <ShoppingCart className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      </main>

      {/* 页脚 */}
      <footer className="mt-20 border-t border-dark-800 bg-dark-900 py-8">
        <div className="container mx-auto px-4">
          <div className="text-center text-gray-500 text-sm">
            <p>© 2023 安为科技. 保留所有权利.</p>
            <div className="flex justify-center gap-4 mt-4">
              <a href="#" className="hover:text-primary-500 transition-colors duration-300">关于我们</a>
              <a href="#" className="hover:text-primary-500 transition-colors duration-300">联系方式</a>
              <a href="#" className="hover:text-primary-500 transition-colors duration-300">隐私政策</a>
            </div>
          </div>
        </div>
      </footer>

      {/* 支付模态框 */}
      <AnimatePresence>
        {isPaymentModalOpen && product && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50"
            onClick={closePaymentModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-dark-900 rounded-xl overflow-hidden max-w-md w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={closePaymentModal}
                className="absolute top-4 right-4 p-2 rounded-full bg-dark-800 hover:bg-gray-700 transition-colors duration-300 z-10"
              >
                <X size={20} />
              </button>
              <PaymentForm 
                products={[{...product, quantity: 1}]}
                onClose={closePaymentModal}
                onPaymentSuccess={() => alert('支付成功')}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 联系我们模态框 */}
      <AnimatePresence>
        {isContactModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50"
            onClick={closeContactModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={closeContactModal}
                className="absolute -top-10 right-0 p-2 rounded-full bg-gray-800 text-white hover:bg-gray-700 transition-colors duration-300"
              >
                <X size={20} />
              </button>
              <ContactForm onClose={closeContactModal} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProductDetail;