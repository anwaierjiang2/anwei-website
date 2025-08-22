import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, LogOut, Home, MessageCircle, Wrench, Menu, X, ChevronDown, ShoppingBag, Mail } from 'lucide-react';
import { getCurrentUser, logoutUser } from '../services/authService';

const Navbar: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isUserMenuHovered, setIsUserMenuHovered] = useState(false);
  const navigate = useNavigate();

  // 初始化和监听登录状态变化
  useEffect(() => {
    // 单独的获取用户信息函数，确保组件能正确获取到最新的用户状态
    const fetchUserInfo = () => {
      try {
        // 直接从localStorage获取用户信息，确保获取最新状态
        // 注意：根据authService.ts中的实现，token存储在'userToken'键下，而不是'token'
        const token = localStorage.getItem('userToken');
        const userInfo = localStorage.getItem('userInfo');
        
        console.log('检查登录状态:', { token: !!token, userInfo: !!userInfo });
        
        if (token && userInfo) {
          try {
            const parsedUser = JSON.parse(userInfo);
            console.log('解析用户信息成功:', parsedUser);
            setCurrentUser(parsedUser);
          } catch (error) {
            console.error('解析用户信息失败:', error);
            setCurrentUser(null);
          }
        } else {
          // 如果没有有效的用户信息，设置为null
          setCurrentUser(null);
        }
      } catch (error) {
        // 处理可能的localStorage安全错误
        console.error('访问localStorage失败:', error);
        setCurrentUser(null);
      }
    };

    // 初始检查
    fetchUserInfo();

    // 监听localStorage变化（可以用于检测登出/登录）
    const handleStorageChange = (e: StorageEvent) => {
      // 更宽泛地监听任何可能影响登录状态的变化
      const relevantKeys = ['token', 'userInfo', 'currentUser', 'user'];
      if (relevantKeys.includes(e.key as string) || e.key === null) {
        console.log('检测到存储变化，刷新用户状态:', e.key);
        fetchUserInfo();
      }
    };

    // 在窗口上添加事件监听器
    window.addEventListener('storage', handleStorageChange);

    // 添加全局事件监听器，允许应用其他部分触发刷新用户状态
    const handleRefreshUser = () => {
      console.log('收到刷新用户状态请求');
      fetchUserInfo();
    };
    window.addEventListener('refreshUser', handleRefreshUser as EventListener);

    // 组件挂载后每500毫秒检查一次登录状态，确保状态及时更新
    const interval = setInterval(fetchUserInfo, 500);

    // 清理函数
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('refreshUser', handleRefreshUser as EventListener);
      clearInterval(interval);
    };
  }, []);

  // 处理登出
  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
    setShowDropdown(false);
    navigate('/');
  };

  // 生成用户头像的随机背景色（基于用户名或邮箱）
  const getUserAvatarBgColor = () => {
    if (!currentUser) return 'bg-primary-500/20';
    
    const name = currentUser.username || currentUser.email.split('@')[0];
    const colors = [
      'bg-gradient-to-br from-blue-500/20 to-cyan-500/20',
      'bg-gradient-to-br from-purple-500/20 to-pink-500/20',
      'bg-gradient-to-br from-amber-500/20 to-orange-500/20',
      'bg-gradient-to-br from-emerald-500/20 to-teal-500/20',
      'bg-gradient-to-br from-indigo-500/20 to-purple-500/20'
    ];
    
    // 简单的哈希函数来选择颜色
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  return (
    <nav className="bg-dark-800/90 backdrop-blur-lg border-b border-dark-700 fixed w-full top-0 z-50 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo 和网站名称 */}
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <div className="h-8 w-8 rounded-md bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                <span className="text-white font-bold">A</span>
              </div>
              <span className="ml-2 text-lg font-bold text-white">anwei</span>
            </Link>
          </div>

          {/* 桌面导航链接 */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-gray-300 hover:text-white transition-colors duration-200 flex items-center">
              <Home className="w-4 h-4 mr-1" />
              <span>首页</span>
            </Link>
            <Link to="/ai-chat" className="text-gray-300 hover:text-white transition-colors duration-200 flex items-center">
              <MessageCircle className="w-4 h-4 mr-1" />
              <span>AI助手</span>
            </Link>
            <Link to="/tools" className="text-gray-300 hover:text-white transition-colors duration-200 flex items-center">
              <Wrench className="w-4 h-4 mr-1" />
              <span>工具库</span>
            </Link>
            <Link to="/products" className="text-gray-300 hover:text-white transition-colors duration-200 flex items-center">
              <ShoppingBag className="w-4 h-4 mr-1" />
              <span>产品中心</span>
            </Link>
            <Link to="/contact-support" className="text-gray-300 hover:text-white transition-colors duration-200 flex items-center">
              <Mail className="w-4 h-4 mr-1" />
              <span>联系客服</span>
            </Link>
          </div>

          {/* 用户登录状态和操作 */}
          <div className="flex items-center">
            {/* 桌面端用户菜单 */}
            <div className="hidden md:block relative">
              {currentUser ? (
                <div 
                  className="flex items-center space-x-2 cursor-pointer group"
                  onClick={() => setShowDropdown(!showDropdown)}
                  onMouseEnter={() => setIsUserMenuHovered(true)}
                  onMouseLeave={() => setIsUserMenuHovered(false)}
                >
                  {/* 头像区域 - 添加动态效果 */}
                  <div 
                    className={`h-9 w-9 rounded-full ${getUserAvatarBgColor()} border-2 border-primary-500/30 flex items-center justify-center text-primary-400 transition-all duration-300 transform group-hover:scale-105 group-hover:border-primary-400/50`}
                  >
                    <User className="w-5 h-5" />
                  </div>
                  
                  {/* 用户名/邮箱显示 - 添加动态效果 */}
                  <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors duration-300">
                    {currentUser.username || currentUser.email.split('@')[0]}
                  </span>
                  
                  {/* 下拉箭头 - 添加动态效果 */}
                  <ChevronDown 
                    className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${showDropdown ? 'transform rotate-180' : ''}`}
                  />
                </div>
              ) : (
                <Link 
                  to="/login" 
                  className="text-sm font-medium text-primary-400 hover:text-primary-300 transition-all duration-300 hover:shadow-lg hover:shadow-primary-500/10 px-4 py-2 rounded-full"
                >
                  登录/注册
                </Link>
              )}

              {/* 下拉菜单 - 添加动画效果 */}
              {showDropdown && currentUser && (
                <div className="absolute right-0 mt-2 w-52 rounded-lg shadow-xl bg-dark-800 ring-1 ring-dark-700 z-50 transform origin-top-right transition-all duration-300 ease-out scale-100 opacity-100">
                  <div className="py-2">
                    {/* 用户信息卡片 */}
                    <div className="px-4 py-3 border-b border-dark-700">
                      <div className="text-sm font-medium text-gray-300">
                        {currentUser.username || currentUser.email.split('@')[0]}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {currentUser.email}
                      </div>
                    </div>
                    
                    {/* 操作按钮 */}
                    <Link
                      to="/my-feedback"
                      className="block w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-dark-700 hover:text-white transition-all duration-200 flex items-center group"
                      onClick={() => setShowDropdown(false)}
                    >
                      <MessageCircle className="w-4 h-4 mr-3 text-gray-400 group-hover:text-white transition-colors duration-200" />
                      我的反馈
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-dark-700 hover:text-white transition-all duration-200 flex items-center group"
                    >
                      <LogOut className="w-4 h-4 mr-3 text-gray-400 group-hover:text-white transition-colors duration-200" />
                      退出登录
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 移动端菜单按钮 - 添加动画效果 */}
            <div className="md:hidden ml-4">
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="text-gray-300 hover:text-white focus:outline-none transition-all duration-300 transform hover:scale-110"
              >
                {showMobileMenu ? (
                  <X className="h-6 w-6 transition-transform duration-300" />
                ) : (
                  <Menu className="h-6 w-6 transition-transform duration-300" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 移动端菜单 - 添加动画效果 */}
      {showMobileMenu && (
        <div className="md:hidden bg-dark-800 border-b border-dark-700 animate-in slide-in-from-top duration-300">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {/* 导航链接样式优化 */}
            <Link
              to="/"
              className="block px-3 py-3 rounded-md text-base font-medium text-gray-300 hover:bg-dark-700 hover:text-white transition-all duration-300 transform hover:translate-x-1"
              onClick={() => setShowMobileMenu(false)}
            >
              <div className="flex items-center">
                <Home className="w-5 h-5 mr-3 text-gray-400" />
                <span>首页</span>
              </div>
            </Link>
            <Link
              to="/ai-chat"
              className="block px-3 py-3 rounded-md text-base font-medium text-gray-300 hover:bg-dark-700 hover:text-white transition-all duration-300 transform hover:translate-x-1"
              onClick={() => setShowMobileMenu(false)}
            >
              <div className="flex items-center">
                <MessageCircle className="w-5 h-5 mr-3 text-gray-400" />
                <span>AI助手</span>
              </div>
            </Link>
            <Link
              to="/tools"
              className="block px-3 py-3 rounded-md text-base font-medium text-gray-300 hover:bg-dark-700 hover:text-white transition-all duration-300 transform hover:translate-x-1"
              onClick={() => setShowMobileMenu(false)}
            >
              <div className="flex items-center">
                <Wrench className="w-5 h-5 mr-3 text-gray-400" />
                <span>工具库</span>
              </div>
            </Link>
            
            <Link
              to="/products"
              className="block px-3 py-3 rounded-md text-base font-medium text-gray-300 hover:bg-dark-700 hover:text-white transition-all duration-300 transform hover:translate-x-1"
              onClick={() => setShowMobileMenu(false)}
            >
              <div className="flex items-center">
                <ShoppingBag className="w-5 h-5 mr-3 text-gray-400" />
                <span>产品中心</span>
              </div>
            </Link>
            
            <Link
              to="/contact-support"
              className="block px-3 py-3 rounded-md text-base font-medium text-gray-300 hover:bg-dark-700 hover:text-white transition-all duration-300 transform hover:translate-x-1"
              onClick={() => setShowMobileMenu(false)}
            >
              <div className="flex items-center">
                <Mail className="w-5 h-5 mr-3 text-gray-400" />
                <span>联系客服</span>
              </div>
            </Link>
            
            {/* 用户状态区域样式优化 */}
            {currentUser ? (
              <div className="px-3 py-2">
                {/* 用户信息卡片 */}
                <div className={`${getUserAvatarBgColor()} rounded-lg p-4 mb-3 border border-primary-500/30`}>
                  <div className="text-sm font-medium text-gray-300 mb-1">
                    当前登录: {currentUser.username || currentUser.email.split('@')[0]}
                  </div>
                  <div className="text-xs text-gray-500">
                    {currentUser.email}
                  </div>
                </div>
                
                {/* 我的反馈链接 */}
                <Link
                  to="/my-feedback"
                  className="block w-full px-3 py-3 rounded-md text-base font-medium text-gray-300 hover:bg-dark-700 hover:text-white transition-all duration-300 flex items-center group"
                  onClick={() => setShowMobileMenu(false)}
                >
                  <MessageCircle className="w-5 h-5 mr-3 text-gray-400 group-hover:text-white transition-colors duration-200" />
                  我的反馈
                </Link>
                
                {/* 退出登录按钮 */}
                <button
                  onClick={() => {
                    handleLogout();
                    setShowMobileMenu(false);
                  }}
                  className="w-full px-3 py-3 rounded-md text-base font-medium text-gray-300 hover:bg-dark-700 hover:text-white transition-all duration-300 flex items-center group mt-1"
                >
                  <LogOut className="w-5 h-5 mr-3 text-gray-400 group-hover:text-white transition-colors duration-200" />
                  退出登录
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="block w-full text-center px-3 py-3 rounded-md text-base font-medium text-primary-400 hover:bg-dark-700 hover:text-primary-300 transition-all duration-300 mt-2"
                onClick={() => setShowMobileMenu(false)}
              >
                登录/注册
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;