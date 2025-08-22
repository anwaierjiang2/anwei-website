import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Activity, Users, Wrench, ShoppingBag, MessageCircle, Bell, Settings, LogOut, ChevronRight, BarChart as BarChartIcon, PieChart as PieChartIcon, X } from 'lucide-react';
import AdminCustomerService from './AdminCustomerService';

// 定义仪表板数据类型
interface DashboardData {
  stats: {
    userCount: number;
    toolCount: number;
    productCount: number;
    orderCount: number;
    feedbackCount: number;
  };
  recentOrders: Array<{
    _id: string;
    user: {
      username: string;
      email: string;
    };
    totalAmount: number;
    status: string;
    createdAt: string;
  }>;
  recentFeedback: Array<{
    _id: string;
    name: string;
    email: string;
    type: string;
    message: string;
    createdAt: string;
  }>;
  userGrowth: Array<{
    _id: string;
    count: number;
  }>;
}

// 定义颜色常量
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const Dashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCustomerService, setShowCustomerService] = useState(false);
  const navigate = useNavigate();

  // 检查管理员认证
  const checkAuth = async () => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    
    try {
      const response = await fetch('/api/auth/verify', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        localStorage.removeItem('adminToken');
        navigate('/admin/login');
      }
    } catch (err) {
      localStorage.removeItem('adminToken');
      navigate('/admin/login');
    }
  };

  // 加载仪表板数据
  const loadDashboardData = async () => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/admin/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '获取仪表板数据失败');
      }

      setDashboardData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取仪表板数据失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 处理登出
  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin/login');
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN');
  };

  // 初始化页面 - 修复useEffect依赖问题，避免无限循环
  useEffect(() => {
    checkAuth();
    loadDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 空依赖数组表示只在组件挂载时执行一次 - 故意不添加函数依赖，以避免无限循环

  // 生成统计卡片
  const StatCard = ({ title, value, icon, color }: { title: string; value: number; icon: React.ReactNode; color: string }) => (
    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10 hover:border-white/20 transition-all duration-300">
      <div className="flex justify-between items-start mb-3">
        <div>
          <p className="text-gray-400 text-sm">{title}</p>
          <h3 className="text-2xl font-bold text-white mt-1">{value}</h3>
        </div>
        <div className={`p-2 rounded-lg bg-opacity-20`} style={{ backgroundColor: `${color}40` }}>
          <div style={{ color }}>{icon}</div>
        </div>
      </div>
    </div>
  );

  // 生成导航链接
  const NavLink = ({ path, icon, label }: { path: string; icon: React.ReactNode; label: string }) => {
    const isActive = false; // 这里可以根据当前路由设置活动状态
    
    // 处理客服聊天链接的点击
    const handleClick = (e: React.MouseEvent) => {
      if (path === '/admin/customer-service') {
        e.preventDefault();
        setShowCustomerService(true);
      }
    };
    
    return (
      <a 
        href={path}
        onClick={handleClick}
        className={`flex items-center px-4 py-3 rounded-lg transition-all duration-200 mb-1 ${isActive ? 'bg-blue-600/20 text-blue-400' : 'text-gray-400 hover:text-white hover:bg-white/5'}
        `}
      >
        <div className="mr-3">{icon}</div>
        <span>{label}</span>
        {isActive && <ChevronRight size={16} className="ml-auto" />}
      </a>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">加载中...</div>
      </div>
    );
  }

  // 如果显示客服聊天界面，直接渲染聊天组件
  if (showCustomerService) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
        <div className="flex">
          {/* 侧边栏保持不变 */}
          <div className="w-64 bg-gray-900/50 backdrop-blur-md h-screen border-r border-white/10 fixed left-0 top-0 z-10">
            <div className="p-5 border-b border-white/10">
              <h2 className="text-xl font-bold text-white flex items-center">
                <Activity className="mr-2 text-blue-500" width={20} height={20} />
                <span>管理后台</span>
              </h2>
            </div>
            
            <div className="p-4">
              <NavLink path="/admin" icon={<BarChartIcon width={18} height={18} />} label="仪表板" />
              <NavLink path="/admin/users" icon={<Users width={18} height={18} />} label="用户管理" />
              <NavLink path="/admin/tools" icon={<Wrench width={18} height={18} />} label="工具管理" />
              <NavLink path="/admin/products" icon={<ShoppingBag width={18} height={18} />} label="产品管理" />
              <NavLink path="/admin/orders" icon={<PieChartIcon width={18} height={18} />} label="订单管理" />
              <NavLink path="/admin/feedback" icon={<MessageCircle width={18} height={18} />} label="反馈管理" />
              <NavLink path="/admin/customer-service" icon={<MessageCircle width={18} height={18} />} label="客服聊天" />
              <NavLink path="/admin/settings" icon={<Settings width={18} height={18} />} label="系统设置" />
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-4">
              <button 
                onClick={handleLogout}
                className="flex items-center w-full px-4 py-3 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-200"
              >
                <LogOut size={18} className="mr-3" />
                <span>退出登录</span>
              </button>
            </div>
          </div>

          {/* 主内容区显示聊天界面 */}
          <div className="flex-1 ml-64 h-screen overflow-hidden">
            {/* 返回按钮 */}
            <div className="p-4 border-b border-white/10 bg-gray-900/50 backdrop-blur-sm flex items-center">
              <button 
                onClick={() => setShowCustomerService(false)}
                className="p-2 rounded-full hover:bg-white/10 transition-all duration-200 mr-3"
              >
                <X size={20} className="text-gray-300" />
              </button>
              <h1 className="text-xl font-bold">客服聊天</h1>
            </div>
            
            {/* 聊天组件 */}
            <div className="h-[calc(100vh-64px)] overflow-auto">
              <AdminCustomerService />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <div className="flex">
        {/* 侧边栏 */}
        <div className="w-64 bg-gray-900/50 backdrop-blur-md h-screen border-r border-white/10 fixed left-0 top-0 z-10">
          <div className="p-5 border-b border-white/10">
            <h2 className="text-xl font-bold text-white flex items-center">
              <Activity className="mr-2 text-blue-500" width={20} height={20} />
              <span>管理后台</span>
            </h2>
          </div>
          
          <div className="p-4">
            <NavLink path="/admin" icon={<BarChartIcon width={18} height={18} />} label="仪表板" />
            <NavLink path="/admin/users" icon={<Users width={18} height={18} />} label="用户管理" />
            <NavLink path="/admin/tools" icon={<Wrench width={18} height={18} />} label="工具管理" />
            <NavLink path="/admin/products" icon={<ShoppingBag width={18} height={18} />} label="产品管理" />
            <NavLink path="/admin/orders" icon={<PieChartIcon width={18} height={18} />} label="订单管理" />
            <NavLink path="/admin/feedback" icon={<MessageCircle width={18} height={18} />} label="反馈管理" />
            <NavLink path="/admin/customer-service" icon={<MessageCircle width={18} height={18} />} label="客服聊天" />
            <NavLink path="/admin/settings" icon={<Settings width={18} height={18} />} label="系统设置" />
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-4">
            <button 
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-3 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-200"
            >
              <LogOut size={18} className="mr-3" />
              <span>退出登录</span>
            </button>
          </div>
        </div>

        {/* 主内容区 */}
        <div className="flex-1 ml-64 p-6">
          {/* 顶部导航 */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold">仪表板概览</h1>
              <p className="text-gray-400">欢迎回来，管理员</p>
            </div>
            <div className="flex items-center">
              <button className="relative p-2 rounded-full hover:bg-white/10 transition-all duration-200">
                <Bell size={20} className="text-gray-300" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <div className="ml-4 flex items-center">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-medium">A</div>
                <div className="ml-2">
                  <p className="text-sm font-medium">anwei_admin</p>
                </div>
              </div>
            </div>
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="mb-6 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300">
              {error}
            </div>
          )}

          {/* 统计卡片行 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            {dashboardData?.stats && (
              <>
                <StatCard 
                  title="总用户数" 
                  value={dashboardData.stats.userCount} 
                  icon={<Users size={20} />} 
                  color="#0088FE" 
                />
                <StatCard 
                  title="总工具数" 
                  value={dashboardData.stats.toolCount} 
                  icon={<Wrench size={20} />} 
                  color="#00C49F" 
                />
                <StatCard 
                  title="总产品数" 
                  value={dashboardData.stats.productCount} 
                  icon={<ShoppingBag size={20} />} 
                  color="#FFBB28" 
                />
                <StatCard 
                  title="总订单数" 
                  value={dashboardData.stats.orderCount} 
                  icon={<PieChartIcon size={20} />} 
                  color="#FF8042" 
                />
                <StatCard 
                  title="总反馈数" 
                  value={dashboardData.stats.feedbackCount} 
                  icon={<MessageCircle size={20} />} 
                  color="#8884d8" 
                />
              </>
            )}
          </div>

          {/* 图表区域 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* 用户增长趋势图 */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10">
              <h3 className="text-lg font-semibold mb-4">用户增长趋势（最近7天）</h3>
              <div className="h-64">
                {dashboardData?.userGrowth && (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dashboardData.userGrowth}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="_id" stroke="rgba(255,255,255,0.6)" />
                      <YAxis stroke="rgba(255,255,255,0.6)" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'rgba(17, 24, 39, 0.9)', borderColor: 'rgba(255,255,255,0.2)' }}
                        labelStyle={{ color: '#fff' }}
                      />
                      <Bar dataKey="count" fill="#0088FE" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* 统计概览饼图 */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10">
              <h3 className="text-lg font-semibold mb-4">系统资源分布</h3>
              <div className="h-64">
                {dashboardData?.stats && (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: '用户', value: dashboardData.stats.userCount },
                          { name: '工具', value: dashboardData.stats.toolCount * 2 },
                          { name: '产品', value: dashboardData.stats.productCount * 3 },
                          { name: '订单', value: dashboardData.stats.orderCount * 4 },
                          { name: '反馈', value: dashboardData.stats.feedbackCount * 2 }
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        fill="#8884d8"
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }: { name: string; percent?: number }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                        labelLine={false}
                      >
                        {[0, 1, 2, 3, 4].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'rgba(17, 24, 39, 0.9)', borderColor: 'rgba(255,255,255,0.2)' }}
                        labelStyle={{ color: '#fff' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          {/* 最近订单和反馈 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 最近订单 */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10">
              <h3 className="text-lg font-semibold mb-4">最近订单</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="py-2 px-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">用户</th>
                      <th className="py-2 px-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">金额</th>
                      <th className="py-2 px-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">状态</th>
                      <th className="py-2 px-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">时间</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {dashboardData?.recentOrders && dashboardData.recentOrders.map((order) => (
                      <tr key={order._id} className="hover:bg-white/5 transition-colors duration-200">
                        <td className="py-2 px-3 whitespace-nowrap">
                          <div className="text-sm font-medium text-white">{order.user?.username || '未知用户'}</div>
                          <div className="text-xs text-gray-400">{order.user?.email || '未知邮箱'}</div>
                        </td>
                        <td className="py-2 px-3 whitespace-nowrap text-sm text-gray-300">
                          ¥{(order.totalAmount || 0).toFixed(2)}
                        </td>
                        <td className="py-2 px-3 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded-full ${order.status === 'delivered' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                            {order.status === 'delivered' ? '已完成' : '处理中'}
                          </span>
                        </td>
                        <td className="py-2 px-3 whitespace-nowrap text-xs text-gray-400">
                          {formatDate(order.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 最近反馈 */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10">
              <h3 className="text-lg font-semibold mb-4">最近反馈</h3>
              <div className="space-y-4">
                {dashboardData?.recentFeedback && dashboardData.recentFeedback.map((feedback) => (
                  <div key={feedback._id} className="p-3 bg-white/5 rounded-lg border border-white/10">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-purple-600/30 flex items-center justify-center text-xs font-medium">{feedback.name.charAt(0)}</div>
                        <div className="ml-2">
                          <div className="text-sm font-medium text-white">{feedback.name}</div>
                          <div className="text-xs text-gray-400">{feedback.email}</div>
                        </div>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${feedback.type === 'suggestion' ? 'bg-blue-500/20 text-blue-400' : 'bg-red-500/20 text-red-400'}`}>
                        {feedback.type === 'suggestion' ? '建议' : '问题'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-300 line-clamp-2 mb-2">{feedback.message}</p>
                    <div className="text-xs text-gray-500">{formatDate(feedback.createdAt)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;