import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PieChart, Search, ChevronDown, Users, BarChart, Wrench, ShoppingBag, MessageCircle, Settings, LogOut, Bell, Star, Activity, Shield, CheckCircle, XCircle, Clock } from 'lucide-react';
import { PieChart as RePieChart, Pie, Cell, ResponsiveContainer, BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

// 定义反馈类型
interface Feedback {
  _id: string;
  user?: { _id: string; username: string; email: string };
  name: string;
  email: string;
  subject: string;
  message: string;
  rating?: number;
  status: 'pending' | 'processing' | 'resolved' | 'closed';
  createdAt: string;
  updatedAt: string;
  type: 'bug' | 'feature' | 'general' | 'other';
  reply?: string;
  adminReply?: { message: string; adminId: string; repliedAt: string };
}

// 定义反馈统计数据类型
interface FeedbackStats {
  totalFeedback: number;
  pendingFeedback: number;
  processingFeedback: number;
  resolvedFeedback: number;
  closedFeedback: number;
  dailyFeedback: Array<{ date: string; count: number }>;
  statusDistribution: Array<{ name: string; value: number; color: string }>;
  categoryDistribution: Array<{ name: string; value: number; color: string }>;
}

const FeedbackManagement: React.FC = () => {
  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
  const [filteredFeedback, setFilteredFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [stats, setStats] = useState<FeedbackStats | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentFeedback, setCurrentFeedback] = useState<Feedback | null>(null);
  const [replyContent, setReplyContent] = useState('');
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

  // 加载反馈数据
  const loadFeedback = async () => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/admin/feedback', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '获取反馈列表失败');
      }

      setFeedbackList(data.feedback);
      setFilteredFeedback(data.feedback);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取反馈列表失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 加载反馈统计数据
  const loadFeedbackStats = async () => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }

    try {
      const response = await fetch('/api/admin/feedback/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '获取反馈统计数据失败');
      }

      // 准备状态分布数据，添加颜色
      const statusDistribution = [
        { name: '待处理', value: data.pendingFeedback, color: '#FFBB28' },
        { name: '处理中', value: data.processingFeedback, color: '#00C49F' },
        { name: '已解决', value: data.resolvedFeedback, color: '#0088FE' },
        { name: '已关闭', value: data.closedFeedback, color: '#FF8042' }
      ];

      // 准备类别分布数据，添加颜色
      const categoryDistribution = [
        { name: 'Bug反馈', value: data.bugCount || 0, color: '#FF6B6B' },
        { name: '功能建议', value: data.featureCount || 0, color: '#4ECDC4' },
        { name: '使用建议', value: data.suggestionCount || 0, color: '#45B7D1' },
        { name: '投诉', value: data.complaintCount || 0, color: '#FF9F1C' },
        { name: '其他', value: data.otherCount || 0, color: '#9381FF' }
      ].filter(item => item.value > 0);

      setStats({ ...data, statusDistribution, categoryDistribution });
    } catch (err) {
      console.error('获取反馈统计数据错误:', err);
      // 不设置错误状态，因为这不是核心功能
    }
  };

  // 更新反馈状态
  const updateFeedbackStatus = async (feedbackId: string, status: Feedback['status']) => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }

    try {
      const response = await fetch(`/api/admin/feedback/${feedbackId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '更新反馈状态失败');
      }

      // 更新本地反馈列表
      setFeedbackList(prevFeedback => prevFeedback.map(item => 
        item._id === feedbackId ? { ...item, status, updatedAt: new Date().toISOString() } : item
      ));
      setFilteredFeedback(prevFeedback => prevFeedback.map(item => 
        item._id === feedbackId ? { ...item, status, updatedAt: new Date().toISOString() } : item
      ));

      // 如果当前查看的反馈就是被更新的反馈，也更新当前反馈
      if (currentFeedback && currentFeedback._id === feedbackId) {
        setCurrentFeedback({ ...currentFeedback, status, updatedAt: new Date().toISOString() });
      }

      // 重新加载统计数据
      loadFeedbackStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新反馈状态失败，请稍后重试');
      setTimeout(() => setError(''), 3000);
    }
  };

  // 回复反馈
  const replyToFeedback = async (feedbackId: string, reply: string) => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }

    try {
      const response = await fetch(`/api/admin/feedback/${feedbackId}/reply`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reply })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '回复反馈失败');
      }

      // 更新本地反馈列表
      setFeedbackList(prevFeedback => prevFeedback.map(item => 
        item._id === feedbackId ? { ...item, reply, status: 'resolved', updatedAt: new Date().toISOString() } : item
      ));
      setFilteredFeedback(prevFeedback => prevFeedback.map(item => 
        item._id === feedbackId ? { ...item, reply, status: 'resolved', updatedAt: new Date().toISOString() } : item
      ));

      // 如果当前查看的反馈就是被回复的反馈，也更新当前反馈
      if (currentFeedback && currentFeedback._id === feedbackId) {
        setCurrentFeedback({ ...currentFeedback, reply, status: 'resolved', updatedAt: new Date().toISOString() });
        setReplyContent('');
      }

      // 重新加载统计数据
      loadFeedbackStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : '回复反馈失败，请稍后重试');
      setTimeout(() => setError(''), 3000);
    }
  };

  // 打开反馈详情模态框
  const openFeedbackDetail = (feedback: Feedback) => {
    setCurrentFeedback(feedback);
    setReplyContent(feedback.reply || '');
    setIsModalOpen(true);
  };

  // 关闭模态框
  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentFeedback(null);
    setReplyContent('');
  };

  // 处理搜索和筛选
  useEffect(() => {
    let result = [...feedbackList];
    
    // 按搜索词筛选
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(feedback => 
        ((feedback.user?.username || feedback.name || '').toLowerCase().includes(term)) ||
        feedback.email.toLowerCase().includes(term) ||
        feedback.message.toLowerCase().includes(term)
      );
    }
    
    // 按状态筛选
    if (statusFilter !== 'all') {
      result = result.filter(feedback => feedback.status === statusFilter);
    }
    
    // 按类别筛选
    if (categoryFilter !== 'all') {
      result = result.filter(feedback => feedback.type === categoryFilter);
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
      
      result = result.filter(feedback => new Date(feedback.createdAt) >= startDate);
    }
    
    setFilteredFeedback(result);
  }, [feedbackList, searchTerm, statusFilter, categoryFilter, dateFilter]);

  // 初始化页面
  useEffect(() => {
    checkAuth();
    loadFeedback();
    loadFeedbackStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN');
  };

  // 生成星级评分
  const renderStars = (rating: number) => {
    return Array(5).fill(0).map((_, index) => (
      <Star 
        key={index} 
        size={16}
        className={`${index < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-500'}`}
      />
    ));
  };

  // 生成导航链接
  const NavLink = ({ path, icon, label }: { path: string; icon: React.ReactNode; label: string }) => {
    const isActive = path === '/admin/feedback';
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

  // 获取反馈状态样式
  const getStatusStyle = (status: Feedback['status']) => {
    switch (status) {
      case 'pending':
        return { className: 'bg-yellow-500/20 text-yellow-400', icon: <Clock size={14} />, label: '待处理' };
      case 'processing':
        return { className: 'bg-green-500/20 text-green-400', icon: <Shield size={14} />, label: '处理中' };
      case 'resolved':
        return { className: 'bg-blue-500/20 text-blue-400', icon: <CheckCircle size={14} />, label: '已解决' };
      case 'closed':
        return { className: 'bg-red-500/20 text-red-400', icon: <XCircle size={14} />, label: '已关闭' };
      default:
        return { className: 'bg-gray-500/20 text-gray-400', icon: <Shield size={14} />, label: '未知' };
    }
  };

  // 获取反馈类型标签
  const getTypeLabel = (type: Feedback['type']) => {
    switch (type) {
      case 'bug':
        return { className: 'bg-red-500/20 text-red-400', label: 'Bug反馈' };
      case 'feature':
        return { className: 'bg-blue-500/20 text-blue-400', label: '功能建议' };
      case 'general':
        return { className: 'bg-green-500/20 text-green-400', label: '一般反馈' };
      case 'other':
        return { className: 'bg-purple-500/20 text-purple-400', label: '其他' };
      default:
        return { className: 'bg-gray-500/20 text-gray-400', label: '未知' };
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
              <MessageCircle className="mr-2 text-blue-500" size={20} />
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
              <h1 className="text-2xl font-bold">反馈管理</h1>
              <p className="text-gray-400">管理用户反馈和建议</p>
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
                      <p className="text-gray-400 text-sm">总反馈数</p>
                      <h3 className="text-2xl font-bold text-white mt-1">{stats.totalFeedback}</h3>
                    </div>
                    <div className="p-2 rounded-lg bg-blue-500/20">
                      <MessageCircle size={20} className="text-blue-400" />
                    </div>
                  </div>
                </div>
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10 hover:border-white/20 transition-all duration-300">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-gray-400 text-sm">待处理反馈</p>
                      <h3 className="text-2xl font-bold text-yellow-400 mt-1">{stats.pendingFeedback}</h3>
                    </div>
                    <div className="p-2 rounded-lg bg-yellow-500/20">
                      <Clock size={20} className="text-yellow-400" />
                    </div>
                  </div>
                </div>
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10 hover:border-white/20 transition-all duration-300">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-gray-400 text-sm">已解决反馈</p>
                      <h3 className="text-2xl font-bold text-green-400 mt-1">{stats.resolvedFeedback}</h3>
                    </div>
                    <div className="p-2 rounded-lg bg-green-500/20">
                      <CheckCircle size={20} className="text-green-400" />
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
                <h3 className="text-lg font-semibold mb-4">反馈状态分布</h3>
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
            {stats?.categoryDistribution && stats.categoryDistribution.length > 0 && (
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10">
                <h3 className="text-lg font-semibold mb-4">反馈类别分布</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                      <Pie
                        data={stats.categoryDistribution}
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
                        {stats.categoryDistribution.map((entry, index) => (
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
                  placeholder="搜索用户名/邮箱/反馈内容..."
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
                  <option value="resolved">已解决</option>
                  <option value="closed">已关闭</option>
                </select>
                <select
                  className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="all">所有类别</option>
                  <option value="bug">Bug反馈</option>
                  <option value="feature">功能建议</option>
                  <option value="suggestion">使用建议</option>
                  <option value="complaint">投诉</option>
                  <option value="other">其他</option>
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
            <button className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors duration-200">
              <Activity size={16} className="mr-2" />
              <span>导出反馈</span>
            </button>
          </div>

          {/* 反馈列表 */}
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10">
            <h3 className="text-lg font-semibold mb-4">反馈列表 ({filteredFeedback.length})</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="py-2 px-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">用户</th>
                    <th className="py-2 px-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">评分</th>
                    <th className="py-2 px-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">类型</th>
                    <th className="py-2 px-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">内容</th>
                    <th className="py-2 px-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">状态</th>
                    <th className="py-2 px-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">提交时间</th>
                    <th className="py-2 px-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {filteredFeedback.map((feedback) => {
                    const statusStyle = getStatusStyle(feedback.status);
                    const typeLabel = getTypeLabel(feedback.type);
                    return (
                      <tr key={feedback._id} className="hover:bg-white/5 transition-colors duration-200">
                        <td className="py-3 px-3 whitespace-nowrap">
                          <div className="text-sm font-medium text-white">{feedback.user?.username || feedback.name || '匿名用户'}</div>
                          <div className="text-xs text-gray-400">{feedback.email}</div>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <div className="flex items-center">
                            {renderStars(feedback.rating || 0)}
                          </div>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-1 text-xs rounded-full ${typeLabel.className}`}>
                            {typeLabel.label}
                          </span>
                        </td>
                        <td className="py-3 px-3 max-w-xs">
                          <p className="text-sm text-gray-300 truncate" title={feedback.message}>
                            {feedback.message}
                          </p>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-1 text-xs rounded-full ${statusStyle.className}`}>
                            <span className="mr-1">{statusStyle.icon}</span>
                            {statusStyle.label}
                          </span>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap text-sm text-gray-400">
                          {formatDate(feedback.createdAt)}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap text-right text-sm font-medium">
                          <button 
                            onClick={() => openFeedbackDetail(feedback)}
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
            {filteredFeedback.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                没有找到符合条件的反馈
              </div>
            )}
          </div>

          {/* 反馈详情模态框 */}
          {isModalOpen && currentFeedback && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-gray-900 rounded-xl p-6 max-w-3xl w-full border border-white/20 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-white">反馈详情</h3>
                    <p className="text-gray-400 mt-1">ID: {currentFeedback._id}</p>
                  </div>
                  <button 
                    onClick={closeModal}
                    className="p-2 rounded-full hover:bg-white/10 transition-all duration-200"
                  >
                    <XCircle size={20} className="text-gray-400" />
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-white/5 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-400 mb-3">用户信息</h4>
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs text-gray-500">用户名</p>
                        <p className="text-white">{currentFeedback.user?.username || currentFeedback.name || '匿名用户'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">邮箱</p>
                        <p className="text-white">{currentFeedback.email}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">评分</p>
                        <div className="flex items-center mt-1">
                          {renderStars(currentFeedback.rating || 0)}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white/5 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-400 mb-3">反馈信息</h4>
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs text-gray-500">反馈状态</p>
                        <div className="mt-1">
                          <select
                            className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            value={currentFeedback.status}
                            onChange={(e) => updateFeedbackStatus(currentFeedback._id, e.target.value as Feedback['status'])}
                          >
                            <option value="pending">待处理</option>
                            <option value="processing">处理中</option>
                            <option value="resolved">已解决</option>
                            <option value="closed">已关闭</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">反馈类型</p>
                        <div className="mt-1">
                          {getTypeLabel(currentFeedback.type).label}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">提交时间</p>
                        <p className="text-white">{formatDate(currentFeedback.createdAt)}</p>
                      </div>
                      {currentFeedback.updatedAt !== currentFeedback.createdAt && (
                        <div>
                          <p className="text-xs text-gray-500">更新时间</p>
                          <p className="text-white">{formatDate(currentFeedback.updatedAt)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="bg-white/5 rounded-lg p-4 mb-6">
                  <h4 className="text-sm font-medium text-gray-400 mb-3">反馈内容</h4>
                  <p className="text-white whitespace-pre-wrap">{currentFeedback.message}</p>
                </div>
                
                {currentFeedback.reply && (
                  <div className="bg-green-500/10 rounded-lg p-4 mb-6 border border-green-500/20">
                    <div className="flex items-center mb-3">
                      <div className="w-6 h-6 rounded-full bg-green-600 flex items-center justify-center text-xs font-medium">A</div>
                      <p className="text-sm font-medium text-green-400 ml-2">管理员回复</p>
                    </div>
                    <p className="text-white whitespace-pre-wrap">{currentFeedback.reply}</p>
                  </div>
                )}
                
                {(currentFeedback.status === 'pending' || currentFeedback.status === 'processing') && (
                  <div className="bg-white/5 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-400 mb-3">回复反馈</h4>
                    <textarea
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[120px]"
                      placeholder="请输入回复内容..."
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                    ></textarea>
                    <div className="flex justify-end mt-4">
                      <button 
                        onClick={() => replyToFeedback(currentFeedback._id, replyContent)}
                        className={`px-4 py-2 rounded-lg transition-colors duration-200 ${replyContent ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-700 cursor-not-allowed'}`}
                        disabled={!replyContent}
                      >
                        发送回复
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FeedbackManagement;