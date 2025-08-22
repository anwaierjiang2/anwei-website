import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowLeft, Sparkles, Target, Zap, Users, Globe, ShoppingBag, Mail, Search, Heart, Star } from 'lucide-react';
import { Link } from 'react-router-dom';

const Home: React.FC = () => {
  // 管理登录状态
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  const handleBack = () => {
    window.history.back();
  };

  // 初始化和监听登录状态变化
  useEffect(() => {
    const fetchUserInfo = () => {
      try {
        const token = localStorage.getItem('userToken');
        const userInfo = localStorage.getItem('userInfo');
        
        if (token && userInfo) {
          try {
            const parsedUser = JSON.parse(userInfo);
            setCurrentUser(parsedUser);
          } catch (error) {
            setCurrentUser(null);
          }
        } else {
          setCurrentUser(null);
        }
      } catch (error) {
        setCurrentUser(null);
      }
    };

    // 初始检查
    fetchUserInfo();

    // 监听localStorage变化
    const handleStorageChange = (e: StorageEvent) => {
      const relevantKeys = ['token', 'userInfo', 'currentUser', 'user'];
      if (relevantKeys.includes(e.key as string) || e.key === null) {
        fetchUserInfo();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('refreshUser', fetchUserInfo as unknown as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('refreshUser', fetchUserInfo as unknown as EventListener);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 text-white">
      {/* 返回按钮 */}
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        onClick={handleBack}
        className="fixed top-6 left-6 z-50 p-3 rounded-full bg-dark-800 border border-dark-700 text-primary-400 hover:bg-primary-500 hover:text-white transition-all duration-300 shadow-lg hover:shadow-primary-500/20"
        aria-label="返回上一页"
      >
        <ArrowLeft className="w-5 h-5" />
      </motion.button>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-900/20 to-accent-900/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="inline-flex items-center px-4 py-2 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-400 mb-8"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              <span className="text-sm font-medium">anwei团队</span>
            </motion.div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-primary-100 to-accent-100 bg-clip-text text-transparent">
              找到本质
              <br />
              <span className="text-primary-400">自己扩展</span>
              <br />
              梦想巨大
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed">
              在这里，我们分享最优质的工具，连接最前沿的技术，让每个人都能找到属于自己的道路，
              实现从本质到梦想的跨越。
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/tools"
                className="inline-flex items-center px-8 py-4 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-primary-500/25"
              >
                探索工具
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <Link
                to="/ai-chat"
                className="inline-flex items-center px-8 py-4 bg-transparent border-2 border-primary-500 text-primary-400 hover:bg-primary-500 hover:text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105"
              >
                体验AI助手
              </Link>
            </div>
          </motion.div>
        </div>
        
        {/* 装饰性元素 */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-primary-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-accent-500/10 rounded-full blur-3xl"></div>
      </section>

      {/* 特色功能 */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              为什么选择 <span className="text-primary-400">anwei</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              我们致力于为用户提供最优质的工具和服务，让技术真正服务于人类的发展
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Target,
                title: "精准工具推荐",
                description: "基于用户需求和偏好，精准推荐最适合的工具和资源",
                color: "primary"
              },
              {
                icon: Zap,
                title: "AI智能助手",
                description: "集成先进的AI技术，为您提供智能化的服务和解决方案",
                color: "accent"
              },
              {
                icon: Users,
                title: "社区协作",
                description: "连接志同道合的用户，共同学习、分享和成长",
                color: "primary"
              },
              {
                icon: Globe,
                title: "全球视野",
                description: "汇聚全球优质资源，让您站在技术发展的前沿",
                color: "accent"
              },
              {
                icon: Sparkles,
                title: "创新思维",
                description: "激发创新思维，帮助您突破传统思维的局限",
                color: "primary"
              },
              {
                icon: Target,
                title: "持续成长",
                description: "提供持续的学习资源，助您在技术道路上不断前进",
                color: "accent"
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="group p-8 rounded-2xl bg-dark-800/50 border border-dark-700 hover:border-primary-500/50 transition-all duration-300 hover:transform hover:scale-105"
              >
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-${feature.color}-500/10 border border-${feature.color}-500/20 text-${feature.color}-400 mb-6 group-hover:bg-${feature.color}-500/20 group-hover:border-${feature.color}-500/40 transition-all duration-300`}>
                  <feature.icon className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold mb-4 text-white group-hover:text-primary-400 transition-colors duration-300">
                  {feature.title}
                </h3>
                <p className="text-gray-400 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 数据统计 */}
      <section className="py-20 bg-dark-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { number: "1000+", label: "优质工具" },
              { number: "50K+", label: "活跃用户" },
              { number: "99.9%", label: "服务可用性" },
              { number: "24/7", label: "技术支持" }
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="text-4xl md:text-5xl font-bold text-primary-400 mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-400 font-medium">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 热门产品展示 */}
      <section className="py-20 bg-dark-800/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              探索我们的 <span className="text-primary-400">精选产品</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              每一款产品都经过精心挑选，为您的工作和生活带来更多可能
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                name: "智能助手 Pro",
                description: "全方位的AI辅助工具，提高工作效率",
                rating: 4.9,
                imageUrl: "/images/product-1.png",
                id: 1
              },
              {
                name: "创意设计套件",
                description: "专业级设计工具，激发无限创意",
                rating: 4.8,
                imageUrl: "/images/product-2.png",
                id: 2
              },
              {
                name: "数据分析平台",
                description: "强大的数据可视化与分析解决方案",
                rating: 4.7,
                imageUrl: "/images/product-3.png",
                id: 3
              },
              {
                name: "项目管理系统",
                description: "高效协作与任务管理，提升团队效能",
                rating: 4.6,
                imageUrl: "/images/product-4.png",
                id: 4
              }
            ].map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="group relative overflow-hidden rounded-xl bg-dark-800 border border-dark-700 hover:border-primary-500/50 transition-all duration-300 hover:transform hover:scale-105 hover:shadow-xl hover:shadow-primary-500/10"
              >
                {/* 产品图片 */}
                <div className="h-48 bg-gradient-to-br from-primary-500/20 to-accent-500/20 flex items-center justify-center">
                  <ShoppingBag className="w-20 h-20 text-primary-400/70 group-hover:text-primary-400 transition-colors duration-300" />
                </div>
                
                {/* 产品信息 */}
                <div className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-xl font-semibold text-white group-hover:text-primary-400 transition-colors duration-300">
                      {product.name}
                    </h3>
                    <div className="flex items-center text-amber-400">
                      <Star className="w-4 h-4 fill-current" />
                      <span className="ml-1 text-sm font-medium">{product.rating}</span>
                    </div>
                  </div>
                  
                  <p className="text-gray-400 mb-4 line-clamp-2">
                    {product.description}
                  </p>
                  
                  <Link
                    to={`/products/${product.id}`}
                    className="inline-flex items-center text-sm font-medium text-primary-400 hover:text-primary-300 transition-colors duration-300"
                  >
                    查看详情
                    <ArrowRight className="ml-1 w-4 h-4" />
                  </Link>
                </div>
                
                {/* 悬停效果 */}
                <div className="absolute inset-0 bg-gradient-to-t from-dark-900/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              </motion.div>
            ))}
          </div>
          
          {/* 查看更多链接 */}
          <div className="text-center mt-12">
            <Link
              to="/products"
              className="inline-flex items-center px-6 py-3 bg-transparent border-2 border-primary-500 text-primary-400 hover:bg-primary-500 hover:text-white font-semibold rounded-lg transition-all duration-300"
            >
              查看全部产品
              <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              准备好开始您的 <span className="text-primary-400">梦想之旅</span> 了吗？
            </h2>
            <p className="text-xl text-gray-400 mb-12">
              加入我们，发现更多可能，创造属于您的未来
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {!currentUser && (
                <Link
                  to="/register"
                  className="inline-flex items-center px-8 py-4 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-primary-500/25"
                >
                  立即注册
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              )}
              <Link
                to="/contact-support"
                className="inline-flex items-center px-8 py-4 bg-transparent border-2 border-primary-500 text-primary-400 hover:bg-primary-500 hover:text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105"
              >
                在线客服
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Home;