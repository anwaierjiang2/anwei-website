import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronDown, ShoppingCart, Heart, ExternalLink, X, AlertCircle, MessageCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import ContactForm from '../components/ContactForm';
import PaymentForm from '../components/PaymentForm';
import ProductImageCarousel from '../components/ProductImageCarousel';
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

const ProductsList: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState('createdAt');

  // 产品分类列表
  const categories = ['all', '网站建设', 'AI工具', '设计服务', '开发服务', '其他'];

  // 获取产品列表
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/products');
        if (!response.ok) {
          throw new Error('获取产品列表失败');
        }
        const data = await response.json();
        setProducts(data.products || []);
        setFilteredProducts(data.products || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : '获取产品列表失败，请稍后重试');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // 搜索和筛选产品
  useEffect(() => {
    let result = [...products];

    // 搜索过滤
    if (searchTerm) {
      result = result.filter(product => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // 分类过滤
    if (category !== 'all') {
      result = result.filter(product => product.category === category);
    }

    // 排序
    if (sort === 'price') {
      result.sort((a, b) => a.price - b.price);
    } else if (sort === 'createdAt') {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sort === 'sales') {
      result.sort((a, b) => b.salesCount - a.salesCount);
    }

    setFilteredProducts(result);
  }, [searchTerm, category, sort, products]);

  // 购物车相关状态
  const [cart, setCart] = useState<{product: Product, quantity: number}[]>([]);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);

  // 添加到购物车
  const addToCart = (product: Product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.product._id === product._id);
      if (existingItem) {
        return prevCart.map(item => 
          item.product._id === product._id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prevCart, { product, quantity: 1 }];
      }
    });
  };

  // 立即购买
  const buyNow = (product: Product) => {
    setSelectedProduct(product);
    setIsPaymentModalOpen(true);
  };

  // 关闭支付模态框
  const closePaymentModal = () => {
    setIsPaymentModalOpen(false);
    setSelectedProduct(null);
  };

  // 打开联系模态框
  const openContactModal = () => {
    setIsContactModalOpen(true);
  };

  // 关闭联系模态框
  const closeContactModal = () => {
    setIsContactModalOpen(false);
  };

  // 打开购物车模态框
  const openCartModal = () => {
    setIsCartModalOpen(true);
  };

  // 关闭购物车模态框
  const closeCartModal = () => {
    setIsCartModalOpen(false);
  };

  // 从购物车移除商品
  const removeFromCart = (productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.product._id !== productId));
  };

  // 更新购物车商品数量
  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) return;
    
    setCart(prevCart => 
      prevCart.map(item => 
        item.product._id === productId 
          ? { ...item, quantity }
          : item
      )
    );
  };

  // 从购物车购买商品
  const buyFromCart = () => {
    if (cart.length === 0) return;
    
    const productsToBuy = cart.map(item => ({
      ...item.product,
      quantity: item.quantity
    }));
    
    // 这里可以根据实际需求处理购买逻辑，比如将整个购物车的商品一起结算
    // 为了简化，我们可以选择第一个商品进行结算
    if (productsToBuy.length > 0) {
      setSelectedProduct(productsToBuy[0]);
      setIsPaymentModalOpen(true);
      setIsCartModalOpen(false);
    }
  };

  // 计算购物车总金额
  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.product.price * item.quantity), 0);
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

  if (error) {
    return (
      <div className="min-h-screen bg-dark-950 text-white flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-300 mb-4">{error}</p>
          <button 
            className="px-4 py-2 bg-primary-500 hover:bg-primary-600 rounded-lg transition-colors duration-300"
            onClick={() => window.location.reload()}
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-950 text-white">
      {/* 顶部导航栏 */}
      <nav className="border-b border-dark-800 sticky top-0 z-30 bg-dark-950/95 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-primary-500" />
            <span className="font-bold text-xl">安为科技 - 产品商城</span>
          </div>
          <div className="flex items-center gap-4">
            <button 
              className="p-2 rounded-full bg-dark-800 hover:bg-primary-500 transition-colors duration-300 relative"
              onClick={openCartModal}
            >
              <ShoppingCart className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 bg-primary-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                {cart.length}
              </span>
            </button>
            <button 
              className="p-2 rounded-full bg-dark-800 hover:bg-primary-500 transition-colors duration-300"
              onClick={openContactModal}
            >
              <MessageCircle className="w-5 h-5" />
            </button>
            {isAuthenticated() ? (
              <Link to="/user/dashboard" className="px-4 py-2 bg-dark-800 hover:bg-primary-500 rounded-lg transition-colors duration-300">
                个人中心
              </Link>
            ) : (
              <Link to="/login" className="px-4 py-2 bg-primary-500 hover:bg-primary-600 rounded-lg transition-colors duration-300">
                登录
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* 主要内容 */}
      <main className="container mx-auto px-4 py-8">
        {/* 页面标题 */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">我们的产品</h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            探索安为科技提供的高质量技术产品和服务，为您的业务增长提供助力
          </p>
        </div>

        {/* 搜索和筛选区域 */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div className="relative w-full md:w-64">
            <input
              type="text"
              placeholder="搜索产品..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-dark-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
          <div className="flex gap-4 w-full md:w-auto">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="flex-1 md:flex-none px-4 py-2 bg-dark-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat === 'all' ? '全部分类' : cat}
                </option>
              ))}
            </select>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="flex-1 md:flex-none px-4 py-2 bg-dark-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="createdAt">最新上架</option>
              <option value="price">价格排序</option>
              <option value="sales">销量优先</option>
            </select>
          </div>
        </div>

        {/* 产品列表 */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400">未找到符合条件的产品</p>
            <button 
              className="mt-4 px-4 py-2 bg-dark-800 hover:bg-primary-500 rounded-lg transition-colors duration-300"
              onClick={() => {
                setSearchTerm('');
                setCategory('all');
                setSort('createdAt');
              }}
            >
              重置筛选条件
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map(product => (
              <motion.div
                key={product._id}
                className="group bg-dark-800/50 rounded-xl overflow-hidden border border-dark-700 hover:border-primary-500/50 transition-all duration-300 hover:transform hover:scale-[1.02] cursor-pointer"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                onClick={() => navigate(`/products/${product._id}`)}
              >
                {/* 产品图片轮播 */}
                <ProductImageCarousel product={product} />
                {product.isFeatured && (
                  <div className="absolute top-3 left-3 px-2 py-1 bg-primary-500 text-white text-xs font-semibold rounded">
                    推荐
                  </div>
                )}
                <button 
                  className="absolute top-3 right-3 p-2 bg-dark-900/70 hover:bg-primary-500/70 rounded-full transition-colors duration-300"
                  onClick={() => {/* 收藏功能 */}}
                >
                  <Heart className="w-4 h-4" />
                </button>
                
                {/* 产品信息 */}
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-primary-500 transition-colors duration-300">
                      {product.name}
                    </h3>
                    <span className="text-primary-500 font-bold">¥{product.price}</span>
                  </div>
                  <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                    {product.shortDescription}
                  </p>
                  <div className="flex gap-2 mb-4 flex-wrap">
                    {product.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="px-2 py-1 bg-dark-700 text-xs rounded-full text-gray-300">
                        {tag}
                      </span>
                    ))}
                    {product.tags.length > 3 && (
                      <span className="px-2 py-1 bg-dark-700 text-xs rounded-full text-gray-300">
                        +{product.tags.length - 3}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => addToCart(product)}
                      className="flex-1 py-2 bg-dark-700 hover:bg-primary-500 rounded-lg transition-colors duration-300 flex items-center justify-center gap-1"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      <span>加入购物车</span>
                    </button>
                    <button
                      onClick={() => buyNow(product)}
                      className="flex-1 py-2 bg-primary-500 hover:bg-primary-600 rounded-lg transition-colors duration-300"
                    >
                      立即购买
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* 页脚 */}
      <footer className="mt-16 border-t border-dark-800 bg-dark-900 py-8">
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
        {isPaymentModalOpen && selectedProduct && (
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
                products={[{...selectedProduct, quantity: 1}]}
                onClose={closePaymentModal}
                onPaymentSuccess={() => {}}
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

      {/* 购物车模态框 */}
      <AnimatePresence>
        {isCartModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50"
            onClick={closeCartModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-dark-900 rounded-xl overflow-hidden max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-dark-800">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold">购物车</h2>
                  <button
                    onClick={closeCartModal}
                    className="p-2 rounded-full bg-dark-800 hover:bg-gray-700 transition-colors duration-300"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
              
              {cart.length === 0 ? (
                <div className="p-8 text-center">
                  <ShoppingCart className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">您的购物车是空的</p>
                  <button
                    onClick={closeCartModal}
                    className="mt-4 px-4 py-2 bg-primary-500 hover:bg-primary-600 rounded-lg transition-colors duration-300"
                  >
                    继续购物
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-dark-800">
                  {cart.map((item) => (
                    <div key={item.product._id} className="p-6 flex gap-4">
                      <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-dark-800">
                        {item.product.images.main && (
                          <img
                            src={item.product.images.main}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              // 如果图片加载失败，使用占位图
                              const target = e.target as HTMLImageElement;
                              target.src = `https://picsum.photos/id/${item.product._id.charCodeAt(0)}/200/200`;
                            }}
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-200 truncate">{item.product.name}</h3>
                        <p className="text-primary-500 font-semibold mt-1">¥{item.product.price}</p>
                        <div className="flex items-center mt-2">
                          <button
                            onClick={() => updateQuantity(item.product._id, item.quantity - 1)}
                            className="p-1 bg-dark-800 rounded hover:bg-gray-700 transition-colors"
                            disabled={item.quantity <= 1}
                          >
                            -
                          </button>
                          <span className="mx-3 text-gray-300">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.product._id, item.quantity + 1)}
                            className="p-1 bg-dark-800 rounded hover:bg-gray-700 transition-colors"
                          >
                            +
                          </button>
                          <button
                            onClick={() => removeFromCart(item.product._id)}
                            className="ml-auto text-red-500 hover:text-red-400"
                          >
                            移除
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {cart.length > 0 && (
                <div className="p-6 border-t border-dark-800">
                  <div className="flex justify-between mb-4">
                    <span className="text-gray-400">总计</span>
                    <span className="text-xl font-bold text-white">¥{calculateTotal()}</span>
                  </div>
                  <button
                    onClick={buyFromCart}
                    className="w-full py-3 bg-primary-500 hover:bg-primary-600 rounded-lg transition-colors duration-300 text-white font-medium"
                  >
                    结算
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProductsList;