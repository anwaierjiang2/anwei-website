import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PieChart, Search, ChevronDown, Users, BarChart, Wrench, ShoppingBag, MessageCircle, Settings, LogOut, Bell, DollarSign, Calendar, Clipboard, CheckCircle, XCircle, Clock, Plus } from 'lucide-react';
import { PieChart as RePieChart, Pie, Cell, ResponsiveContainer, BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

// 定义订单项类型
interface OrderItem {
  _id: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  total: number;
}

// 定义地址类型
interface Address {
  name: string;
  phone: string;
  address: string;
  city: string;
  postalCode?: string;
}

// 定义订单类型
interface Order {
  _id: string;
  orderNumber: string;
  userId: string;
  userName: string;
  email: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  paymentMethod: string;
  shippingAddress: string | Address;
  createdAt: string;
  updatedAt: string;
}

// 定义订单统计数据类型
interface OrderStats {
  totalOrders: number;
  pendingOrders: number;
  processingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
  dailyOrders: Array<{ date: string; count: number }>;
  statusDistribution: Array<{ name: string; value: number; color: string }>;
}

const OrdersManagement: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [actionType, setActionType] = useState<'view' | 'delete' | 'add'>('view');
  const [newOrder, setNewOrder] = useState({
    userName: '',
    email: '',
    shippingAddress: '',
    paymentMethod: 'online',
    status: 'pending',
    items: [{ productName: '', price: 0, quantity: 1, total: 0 }],
    totalAmount: 0
  });
  const [submitLoading, setSubmitLoading] = useState(false);
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

  // 加载订单数据
  const loadOrders = async () => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/admin/orders', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '获取订单列表失败');
      }

      setOrders(data.orders);
      setFilteredOrders(data.orders);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取订单列表失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 加载订单统计数据
  const loadOrderStats = async () => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }

    try {
      const response = await fetch('/api/admin/orders/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '获取订单统计数据失败');
      }

      // 准备状态分布数据，添加颜色
      const statusDistribution = [
        { name: '待处理', value: data.pendingOrders, color: '#FFBB28' },
        { name: '处理中', value: data.processingOrders, color: '#00C49F' },
        { name: '已完成', value: data.completedOrders, color: '#0088FE' },
        { name: '已取消', value: data.cancelledOrders, color: '#FF8042' }
      ];

      setStats({ ...data, statusDistribution });
    } catch (err) {
      console.error('获取订单统计数据错误:', err);
      // 不设置错误状态，因为这不是核心功能
    }
  };

  // 更新订单状态
  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }

    try {
      const response = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '更新订单状态失败');
      }

      // 更新本地订单列表
      setOrders(prevOrders => prevOrders.map(order => 
        order._id === orderId ? { ...order, status, updatedAt: new Date().toISOString() } : order
      ));
      setFilteredOrders(prevOrders => prevOrders.map(order => 
        order._id === orderId ? { ...order, status, updatedAt: new Date().toISOString() } : order
      ));

      // 如果当前查看的订单就是被更新的订单，也更新当前订单
      if (currentOrder && currentOrder._id === orderId) {
        setCurrentOrder({ ...currentOrder, status, updatedAt: new Date().toISOString() });
      }

      // 重新加载统计数据
      loadOrderStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新订单状态失败，请稍后重试');
      setTimeout(() => setError(''), 3000);
    }
  };

  // 打开订单详情模态框
  const openOrderDetail = async (order: Order) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      if (!token) {
        localStorage.removeItem('adminToken');
        window.location.href = '/admin/login';
        return;
      }
      
      // 调用订单详情API获取完整的订单信息
      const response = await fetch(`/api/admin/orders/${order._id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('获取订单详情失败');
      }
      
      const data = await response.json();
      setCurrentOrder(data.order);
      setActionType('view');
      setIsModalOpen(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : '获取订单详情失败，请稍后重试');
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  // 打开添加订单模态框
  const openModalForAdd = () => {
    setNewOrder({
      userName: '',
      email: '',
      shippingAddress: '',
      paymentMethod: 'online',
      status: 'pending',
      items: [{ productName: '', price: 0, quantity: 1, total: 0 }],
      totalAmount: 0
    });
    setActionType('add');
    setIsModalOpen(true);
  };

  // 添加订单
  const handleAddOrder = async () => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }

    setSubmitLoading(true);
    try {
      const response = await fetch('/api/admin/orders', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newOrder)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '添加订单失败');
      }

      // 更新本地订单列表
      setOrders(prevOrders => [data, ...prevOrders]);
      setFilteredOrders(prevOrders => [data, ...prevOrders]);

      // 重新加载统计数据
      loadOrderStats();
      closeModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : '添加订单失败，请稍后重试');
      setTimeout(() => setError(''), 3000);
    } finally {
      setSubmitLoading(false);
    }
  };

  // 更新新订单项
  const updateNewOrderItem = (index: number, field: string, value: any) => {
    const updatedItems = [...newOrder.items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value,
      total: field === 'price' || field === 'quantity'
        ? Number(value) * (field === 'price' ? updatedItems[index].quantity : updatedItems[index].price)
        : updatedItems[index].total
    };
    
    const totalAmount = updatedItems.reduce((sum, item) => sum + item.total, 0);
    
    setNewOrder(prev => ({
      ...prev,
      items: updatedItems,
      totalAmount
    }));
  };

  // 添加新订单项
  const addOrderItem = () => {
    setNewOrder(prev => ({
      ...prev,
      items: [...prev.items, { productName: '', price: 0, quantity: 1, total: 0 }]
    }));
  };

  // 删除订单项
  const removeOrderItem = (index: number) => {
    if (newOrder.items.length <= 1) return;
    
    const updatedItems = newOrder.items.filter((_, i) => i !== index);
    const totalAmount = updatedItems.reduce((sum, item) => sum + item.total, 0);
    
    setNewOrder(prev => ({
      ...prev,
      items: updatedItems,
      totalAmount
    }));
  };

  // 导出订单
  const handleExportOrders = async () => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }

    try {
      const response = await fetch('/api/admin/orders/export', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          orders: filteredOrders, // 导出筛选后的订单
          format: 'csv' // 可以支持其他格式，如 'xlsx'
        })
      });

      if (!response.ok) {
        throw new Error('导出订单失败');
      }

      // 创建Blob对象并下载文件
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `订单导出_${new Date().toLocaleDateString('zh-CN')}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : '导出订单失败，请稍后重试');
      setTimeout(() => setError(''), 3000);
    }
  };

  // 关闭模态框
  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentOrder(null);
  };
  
  // 删除订单
  const deleteOrder = async (orderId: string) => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
    
      const data = await response.json();
    
      if (!response.ok) {
        throw new Error(data.message || '删除订单失败');
      }
    
      // 更新本地订单列表
      setOrders(prevOrders => prevOrders.filter(order => order._id !== orderId));
      setFilteredOrders(prevOrders => prevOrders.filter(order => order._id !== orderId));
      
      // 重新加载统计数据
      loadOrderStats();
      closeModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除订单失败，请稍后重试');
      setTimeout(() => setError(''), 3000);
    }
  };

  // 处理搜索和筛选
  useEffect(() => {
    let result = [...orders];
    
    // 按搜索词筛选
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(order => 
        order.orderNumber.toLowerCase().includes(term) || 
        order.userName.toLowerCase().includes(term) ||
        order.email.toLowerCase().includes(term)
      );
    }
    
    // 按状态筛选
    if (statusFilter !== 'all') {
      result = result.filter(order => order.status === statusFilter);
    }
    
    // 按日期筛选
    if (dateFilter !== 'all') {
      const now = new Date();
      let startDate = new Date();
      
      switch (dateFilter) {
        case 'today':
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setDate(now.getDate() - 30);
          break;
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
        default:
          break;
      }
      
      result = result.filter(order => new Date(order.createdAt) >= startDate);
    }
    
    setFilteredOrders(result);
  }, [orders, searchTerm, statusFilter, dateFilter]);

  // 初始化页面
  useEffect(() => {
    checkAuth();
    loadOrders();
    loadOrderStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN');
  };

  // 格式化金额
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // 生成导航链接
  const NavLink = ({ path, icon, label }: { path: string; icon: React.ReactNode; label: string }) => {
    const isActive = path === '/admin/orders';
    return (
      <a 
        href={path}
        className={`flex items-center px-4 py-3 rounded-lg transition-all duration-200 mb-1 ${isActive ? 'bg-blue-600/20 text-blue-400' : 'text-gray-400 hover:text-white hover:bg-white/5'}
        `}
      >
        <div className="mr-3">{icon}</div>
        <span>{label}</span>
        {isActive && <ChevronDown size={16} className="ml-auto" />}
      </a>
    );
  };

  // 处理登出
  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin/login');
  };

  // 获取订单状态样式
  const getStatusStyle = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return { className: 'bg-yellow-500/20 text-yellow-400', icon: <Clock size={14} />, label: '待处理' };
      case 'processing':
        return { className: 'bg-green-500/20 text-green-400', icon: <Clipboard size={14} />, label: '处理中' };
      case 'completed':
        return { className: 'bg-blue-500/20 text-blue-400', icon: <CheckCircle size={14} />, label: '已完成' };
      case 'cancelled':
        return { className: 'bg-red-500/20 text-red-400', icon: <XCircle size={14} />, label: '已取消' };
      default:
        return { className: 'bg-gray-500/20 text-gray-400', icon: <Clipboard size={14} />, label: '未知' };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">加载中...</div>
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
              <PieChart className="mr-2 text-blue-500" size={20} />
              <span>管理后台</span>
            </h2>
          </div>
          
          <div className="p-4">
            <NavLink path="/admin" icon={<BarChart width={18} height={18} />} label="仪表板" />
            <NavLink path="/admin/users" icon={<Users width={18} height={18} />} label="用户管理" />
            <NavLink path="/admin/tools" icon={<Wrench width={18} height={18} />} label="工具管理" />
            <NavLink path="/admin/products" icon={<ShoppingBag width={18} height={18} />} label="产品管理" />
            <NavLink path="/admin/orders" icon={<PieChart width={18} height={18} />} label="订单管理" />
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
              <h1 className="text-2xl font-bold">订单管理</h1>
              <p className="text-gray-400">管理系统中的所有订单</p>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {stats && (
              <>
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10 hover:border-white/20 transition-all duration-300">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-gray-400 text-sm">总订单数</p>
                      <h3 className="text-2xl font-bold text-white mt-1">{stats.totalOrders}</h3>
                    </div>
                    <div className="p-2 rounded-lg bg-blue-500/20">
                      <Clipboard size={20} className="text-blue-400" />
                    </div>
                  </div>
                </div>
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10 hover:border-white/20 transition-all duration-300">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-gray-400 text-sm">待处理订单</p>
                      <h3 className="text-2xl font-bold text-yellow-400 mt-1">{stats.pendingOrders}</h3>
                    </div>
                    <div className="p-2 rounded-lg bg-yellow-500/20">
                      <Clock size={20} className="text-yellow-400" />
                    </div>
                  </div>
                </div>
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10 hover:border-white/20 transition-all duration-300">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-gray-400 text-sm">总销售额</p>
                      <h3 className="text-2xl font-bold text-green-400 mt-1">{formatCurrency(stats.totalRevenue)}</h3>
                    </div>
                    <div className="p-2 rounded-lg bg-green-500/20">
                      <DollarSign size={20} className="text-green-400" />
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* 图表区域 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {stats?.statusDistribution && (
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10">
                <h3 className="text-lg font-semibold mb-4">订单状态分布</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                      <Pie
                        data={stats.statusDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        fill="#8884d8"
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {stats.statusDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'rgba(17, 24, 39, 0.9)', borderColor: 'rgba(255,255,255,0.2)' }}
                        labelStyle={{ color: '#fff' }}
                      />
                    </RePieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
            {stats?.dailyOrders && (
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10">
                <h3 className="text-lg font-semibold mb-4">订单趋势</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <ReBarChart data={stats.dailyOrders}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="date" stroke="rgba(255,255,255,0.6)" />
                      <YAxis stroke="rgba(255,255,255,0.6)" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'rgba(17, 24, 39, 0.9)', borderColor: 'rgba(255,255,255,0.2)' }}
                        labelStyle={{ color: '#fff' }}
                      />
                      <Bar dataKey="count" fill="#82ca9d" radius={[4, 4, 0, 0]} />
                    </ReBarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>

          {/* 搜索和筛选 */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div className="w-full md:w-auto flex items-center space-x-4">
              <div className="relative flex-1 md:flex-none w-full md:w-64">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Search size={18} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-10 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="搜索订单号/用户名/邮箱..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex space-x-2">
                <select
                  className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">所有状态</option>
                  <option value="pending">待处理</option>
                  <option value="processing">处理中</option>
                  <option value="completed">已完成</option>
                  <option value="cancelled">已取消</option>
                </select>
                <select
                  className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                >
                  <option value="all">所有时间</option>
                  <option value="today">今天</option>
                  <option value="week">近7天</option>
                  <option value="month">近30天</option>
                  <option value="year">近一年</option>
                </select>
              </div>
            </div>
            <div className="flex space-x-3">
              <button 
                onClick={openModalForAdd}
                className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors duration-200"
              >
                <Plus size={16} className="mr-2" />
                <span>添加订单</span>
              </button>
              <button 
                onClick={handleExportOrders} 
                className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors duration-200"
              >
                <Calendar size={16} className="mr-2" />
                <span>导出订单</span>
              </button>
            </div>
          </div>

          {/* 订单列表 */}
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10">
            <h3 className="text-lg font-semibold mb-4">订单列表 ({filteredOrders.length})</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="py-2 px-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">订单号</th>
                    <th className="py-2 px-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">用户</th>
                    <th className="py-2 px-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">金额</th>
                    <th className="py-2 px-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">状态</th>
                    <th className="py-2 px-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">下单时间</th>
                    <th className="py-2 px-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {filteredOrders.map((order) => {
                    const statusStyle = getStatusStyle(order.status);
                    return (
                      <tr key={order._id} className="hover:bg-white/5 transition-colors duration-200">
                        <td className="py-3 px-3 whitespace-nowrap text-sm text-gray-300">
                          {order.orderNumber}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <div className="text-sm font-medium text-white">{order.userName}</div>
                          <div className="text-xs text-gray-400">{order.email}</div>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap text-sm text-green-400">
                          {formatCurrency(order.totalAmount)}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-1 text-xs rounded-full ${statusStyle.className}`}>
                            <span className="mr-1">{statusStyle.icon}</span>
                            {statusStyle.label}
                          </span>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap text-sm text-gray-400">
                          {formatDate(order.createdAt)}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap text-right text-sm font-medium">
                          <button 
                            onClick={() => openOrderDetail(order)}
                            className="text-blue-400 hover:text-blue-300 transition-colors duration-200"
                          >
                            查看详情
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {filteredOrders.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                没有找到符合条件的订单
              </div>
            )}
          </div>

          {/* 订单详情模态框 */}
          {isModalOpen && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-gray-900 rounded-xl p-6 max-w-3xl w-full border border-white/20 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-white">{actionType === 'add' ? '添加订单' : '订单详情'}</h3>
                    {actionType !== 'add' && currentOrder && (
                      <p className="text-gray-400 mt-1">订单号: {currentOrder.orderNumber}</p>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    {actionType !== 'add' && currentOrder && (
                      <button 
                        onClick={() => {
                          if (window.confirm('确定要删除此订单吗？此操作不可撤销。')) {
                            deleteOrder(currentOrder._id);
                          }
                        }}
                        className="p-2 rounded-full hover:bg-red-500/20 transition-all duration-200 text-red-400"
                        title="删除订单"
                      >
                        <XCircle size={20} />
                      </button>
                    )}
                    <button 
                      onClick={closeModal}
                      className="p-2 rounded-full hover:bg-white/10 transition-all duration-200"
                      title="关闭"
                    >
                      <XCircle size={20} className="text-gray-400" />
                    </button>
                  </div>
                </div>
                
                {actionType === 'add' ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div className="bg-white/5 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-gray-400 mb-3">用户信息</h4>
                        <div className="space-y-2">
                          <div>
                            <p className="text-xs text-gray-500">用户名</p>
                            <input
                              type="text"
                              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mt-1"
                              placeholder="请输入用户名"
                              value={newOrder.userName}
                              onChange={(e) => setNewOrder({ ...newOrder, userName: e.target.value })}
                            />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">邮箱</p>
                            <input
                              type="email"
                              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mt-1"
                              placeholder="请输入邮箱"
                              value={newOrder.email}
                              onChange={(e) => setNewOrder({ ...newOrder, email: e.target.value })}
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-white/5 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-gray-400 mb-3">订单信息</h4>
                        <div className="space-y-2">
                          <div>
                            <p className="text-xs text-gray-500">订单状态</p>
                            <select
                              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mt-1"
                              value={newOrder.status}
                              onChange={(e) => setNewOrder({ ...newOrder, status: e.target.value as Order['status'] })}
                            >
                              <option value="pending">待处理</option>
                              <option value="processing">处理中</option>
                              <option value="completed">已完成</option>
                              <option value="cancelled">已取消</option>
                            </select>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">支付方式</p>
                            <select
                              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mt-1"
                              value={newOrder.paymentMethod}
                              onChange={(e) => setNewOrder({ ...newOrder, paymentMethod: e.target.value })}
                            >
                              <option value="online">在线支付</option>
                              <option value="offline">线下支付</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white/5 rounded-lg p-4 mb-6">
                      <h4 className="text-sm font-medium text-gray-400 mb-3">配送地址</h4>
                      <textarea
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="请输入配送地址"
                        rows={3}
                        value={newOrder.shippingAddress}
                        onChange={(e) => setNewOrder({ ...newOrder, shippingAddress: e.target.value })}
                      />
                    </div>
                    
                    <div className="bg-white/5 rounded-lg p-4 mb-6">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="text-sm font-medium text-gray-400">订单商品</h4>
                        <button 
                          onClick={addOrderItem}
                          className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors duration-200"
                        >
                          添加商品
                        </button>
                      </div>
                      <div className="space-y-3">
                        {newOrder.items.map((item, index) => (
                          <div key={index} className="flex justify-between items-center py-2 border-b border-white/10">
                            <div className="space-y-2 w-full">
                              <div className="flex space-x-4">
                                <div className="flex-1">
                                  <p className="text-xs text-gray-500">商品名称</p>
                                  <input
                                    type="text"
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mt-1"
                                    placeholder="商品名称"
                                    value={item.productName}
                                    onChange={(e) => updateNewOrderItem(index, 'productName', e.target.value)}
                                  />
                                </div>
                                <div className="w-24">
                                  <p className="text-xs text-gray-500">单价</p>
                                  <input
                                    type="number"
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mt-1"
                                    placeholder="0.00"
                                    value={item.price}
                                    onChange={(e) => updateNewOrderItem(index, 'price', Number(e.target.value))}
                                  />
                                </div>
                                <div className="w-24">
                                  <p className="text-xs text-gray-500">数量</p>
                                  <input
                                    type="number"
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mt-1"
                                    placeholder="1"
                                    value={item.quantity}
                                    onChange={(e) => updateNewOrderItem(index, 'quantity', Number(e.target.value))}
                                  />
                                </div>
                              </div>
                              <div className="flex justify-between items-center">
                                <div className="text-right">
                                  <p className="text-green-400 text-xs">小计: {formatCurrency(item.total)}</p>
                                </div>
                                {newOrder.items.length > 1 && (
                                  <button 
                                    onClick={() => removeOrderItem(index)}
                                    className="text-xs text-red-400 hover:text-red-300 transition-colors duration-200"
                                  >
                                    删除
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="bg-white/5 rounded-lg p-4 mb-6">
                      <div className="flex justify-between items-center py-2 border-t border-white/10 mt-2">
                        <p className="text-lg font-semibold text-white">订单总价</p>
                        <p className="text-lg font-semibold text-green-400">{formatCurrency(newOrder.totalAmount)}</p>
                      </div>
                    </div>
                    
                    <div className="flex justify-end space-x-3 mt-6">
                      <button 
                        onClick={closeModal}
                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors duration-200"
                      >
                        取消
                      </button>
                      <button 
                        onClick={handleAddOrder}
                        disabled={submitLoading || !newOrder.userName || !newOrder.email || !newOrder.shippingAddress}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-600/50 rounded-lg transition-colors duration-200"
                      >
                        {submitLoading ? '提交中...' : '添加订单'}
                      </button>
                    </div>
                  </>
                ) : (
                  loading ? (
                    <div className="flex items-center justify-center h-64">
                      <p className="text-gray-400">加载订单详情中...</p>
                    </div>
                  ) : !currentOrder ? (
                    <div className="flex items-center justify-center h-64">
                      <p className="text-gray-400">订单信息不存在或已被删除</p>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div className="bg-white/5 rounded-lg p-4">
                          <h4 className="text-sm font-medium text-gray-400 mb-3">用户信息</h4>
                          <div className="space-y-2">
                            <div>
                              <p className="text-xs text-gray-500">用户名</p>
                              <p className="text-white">{currentOrder.userName || '-'}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">邮箱</p>
                              <p className="text-white">{currentOrder.email || '-'}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-white/5 rounded-lg p-4">
                          <h4 className="text-sm font-medium text-gray-400 mb-3">订单信息</h4>
                          <div className="space-y-2">
                            <div>
                              <p className="text-xs text-gray-500">订单状态</p>
                              <div className="mt-1">
                                <select
                                  className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  value={currentOrder.status || 'pending'}
                                  onChange={(e) => updateOrderStatus(currentOrder._id, e.target.value as Order['status'])}
                                >
                                  <option value="pending">待处理</option>
                                  <option value="processing">处理中</option>
                                  <option value="completed">已完成</option>
                                  <option value="cancelled">已取消</option>
                                </select>
                              </div>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">支付方式</p>
                              <p className="text-white">{currentOrder.paymentMethod || '-'}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">下单时间</p>
                              <p className="text-white">{currentOrder.createdAt ? formatDate(currentOrder.createdAt) : '-'}</p>
                            </div>
                            {currentOrder.updatedAt && currentOrder.updatedAt !== currentOrder.createdAt && (
                              <div>
                                <p className="text-xs text-gray-500">更新时间</p>
                                <p className="text-white">{formatDate(currentOrder.updatedAt)}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-white/5 rounded-lg p-4 mb-6">
                        <h4 className="text-sm font-medium text-gray-400 mb-3">配送地址</h4>
                        {typeof currentOrder.shippingAddress === 'object' && currentOrder.shippingAddress !== null ? (
                          <div className="text-white space-y-2">
                            <p>{(currentOrder.shippingAddress as Address).name || '-'}</p>
                            <p>{(currentOrder.shippingAddress as Address).phone || '-'}</p>
                            <p>{(currentOrder.shippingAddress as Address).address || '-'}</p>
                            <p>{(currentOrder.shippingAddress as Address).city || '-'}{(currentOrder.shippingAddress as Address).postalCode ? `, ${(currentOrder.shippingAddress as Address).postalCode}` : ''}</p>
                          </div>
                        ) : (
                          <p className="text-white">{currentOrder.shippingAddress || '-'}</p>
                        )}
                      </div>
                      
                      <div className="bg-white/5 rounded-lg p-4 mb-6">
                        <h4 className="text-sm font-medium text-gray-400 mb-3">订单商品</h4>
                        <div className="space-y-3">
                          {currentOrder.items && currentOrder.items.length > 0 ? (
                            currentOrder.items.map((item) => (
                              <div key={item._id} className="flex justify-between items-center py-2 border-b border-white/10">
                                <div>
                                  <p className="text-white text-sm">{item.productName || '-'}</p>
                                  <p className="text-gray-400 text-xs">x{item.quantity || 0}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-white text-sm">{item.price ? formatCurrency(item.price) : '-'}</p>
                                  <p className="text-green-400 text-xs">小计: {item.total ? formatCurrency(item.total) : '-'}</p>
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-gray-400 text-center py-4">暂无商品信息</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="bg-white/5 rounded-lg p-4">
                        <div className="flex justify-between items-center py-2">
                          <p className="text-gray-300">商品总价</p>
                          <p className="text-white">{currentOrder.items && currentOrder.items.length > 0 ? formatCurrency(currentOrder.items.reduce((sum, item) => sum + (item.total || 0), 0)) : '-'}</p>
                        </div>
                        <div className="flex justify-between items-center py-2">
                          <p className="text-gray-300">税费</p>
                          <p className="text-white">{formatCurrency(0)}</p>
                        </div>
                        <div className="flex justify-between items-center py-2">
                          <p className="text-gray-300">运费</p>
                          <p className="text-white">{formatCurrency(0)}</p>
                        </div>
                        <div className="flex justify-between items-center py-2 border-t border-white/10 mt-2">
                          <p className="text-lg font-semibold text-white">订单总价</p>
                          <p className="text-lg font-semibold text-green-400">{currentOrder.totalAmount ? formatCurrency(currentOrder.totalAmount) : '-'}</p>
                        </div>
                      </div>
                    </>
                  )
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrdersManagement;