import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wrench, Search, Plus, Edit, Trash2, ChevronDown, Users, BarChart, ShoppingBag, PieChart, MessageCircle, Settings, LogOut, Bell, Filter, Activity } from 'lucide-react';
import { BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { toolsAPI } from '../../services/apiService';

// 定义工具类型
interface Tool {
  _id: string;
  name: string;
  description: string;
  category: string;
  logo: string;
  isActive: boolean;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

// 定义工具统计数据类型
interface ToolStats {
  totalTools: number;
  activeTools: number;
  categoryDistribution: Array<{ _id: string; count: number }>;
  usageTrend: Array<{ date: string; count: number }>;
}

const ToolsManagement: React.FC = () => {
  const [tools, setTools] = useState<Tool[]>([]);
  const [filteredTools, setFilteredTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoUpdating, setLogoUpdating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [stats, setStats] = useState<ToolStats | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentTool, setCurrentTool] = useState<Tool | null>(null);
  const [newTool, setNewTool] = useState<{
    name: string;
    description: string;
    category: string;
    url: string;
    logo: string;
    isActive: boolean;
  }>({
    name: '',
    description: '',
    category: '',
    url: '',
    logo: '',
    isActive: true
  });
  const [actionType, setActionType] = useState<'edit' | 'delete' | 'add'>('edit');
  const navigate = useNavigate();

  // 检查管理员认证
  const checkAuth = async () => {
    try {
      const isVerified = await toolsAPI.verifyAdmin();
      if (!isVerified) {
        localStorage.removeItem('adminToken');
        navigate('/admin/login');
      }
    } catch (err) {
      localStorage.removeItem('adminToken');
      navigate('/admin/login');
    }
  };

  // 上传新工具图片
  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
     
    // 简单的文件验证
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    const maxSize = 5 * 1024 * 1024; // 5MB
     
    if (!validTypes.includes(file.type)) {
      setError('请上传支持的图片格式（JPG、PNG、GIF、WebP、SVG）');
      setTimeout(() => setError(''), 3000);
      return;
    }
     
    if (file.size > maxSize) {
      setError('图片大小不能超过5MB');
      setTimeout(() => setError(''), 3000);
      return;
    }
     
    setLogoUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      const data = await toolsAPI.uploadToolImage(formData);
      
      if (data.imageUrl) {
        setNewTool(prev => ({ ...prev, logo: data.imageUrl }));
      }
    } catch (error) {
      console.error('图片上传失败:', error);
      setError(error instanceof Error ? error.message : '图片上传失败，请稍后重试');
      setTimeout(() => setError(''), 3000);
    } finally {
      setLogoUploading(false);
    }
  };

  // 更新现有工具图片
  const handleLogoUpdate = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !currentTool?._id) return;
     
    // 简单的文件验证
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    const maxSize = 5 * 1024 * 1024; // 5MB
     
    if (!validTypes.includes(file.type)) {
      setError('请上传支持的图片格式（JPG、PNG、GIF、WebP、SVG）');
      setTimeout(() => setError(''), 3000);
      return;
    }
     
    if (file.size > maxSize) {
      setError('图片大小不能超过5MB');
      setTimeout(() => setError(''), 3000);
      return;
    }
     
    setLogoUpdating(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      const data = await toolsAPI.uploadToolImage(formData);
      
      if (data.imageUrl) {
        // 更新当前工具的logo
        if (currentTool) {
          const updatedTool = { ...currentTool, logo: data.imageUrl };
          setCurrentTool(updatedTool);
          
          // 同时更新工具列表中的对应工具
          setTools(prevTools => 
            prevTools.map(tool => 
              tool._id === currentTool._id ? updatedTool : tool
            )
          );
          setFilteredTools(prevTools => 
            prevTools.map(tool => 
              tool._id === currentTool._id ? updatedTool : tool
            )
          );
        }
      }
    } catch (error) {
      console.error('图片上传失败:', error);
      setError(error instanceof Error ? error.message : '图片上传失败，请稍后重试');
      setTimeout(() => setError(''), 3000);
    } finally {
      setLogoUpdating(false);
    }
  };

  // 加载工具数据
  const loadTools = async () => {
    try {
      setLoading(true);
      
      const data = await toolsAPI.getTools();
      
      setTools(data.tools);
      setFilteredTools(data.tools);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取工具列表失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 加载工具统计数据
  const loadToolStats = async () => {
    try {
      const data = await toolsAPI.getToolStats();
      setStats(data);
    } catch (err) {
      console.error('获取工具统计数据错误:', err);
      // 不设置错误状态，因为这不是核心功能
    }
  };

  // 更新工具状态
  const updateToolStatus = async (toolId: string, isActive: boolean) => {
    try {
      await toolsAPI.updateToolStatus(toolId, isActive);
      
      // 更新本地工具列表
      setTools(prevTools => prevTools.map(tool => 
        tool._id === toolId ? { ...tool, isActive } : tool
      ));
      setFilteredTools(prevTools => prevTools.map(tool => 
        tool._id === toolId ? { ...tool, isActive } : tool
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新工具状态失败，请稍后重试');
      setTimeout(() => setError(''), 3000);
    }
  };

  // 打开模态框
  const openModal = (tool: Tool, type: 'edit' | 'delete') => {
    setCurrentTool(tool);
    setActionType(type);
    setIsModalOpen(true);
  };

  // 打开添加工具模态框
  const openModalForAdd = () => {
    setNewTool({
      name: '',
      description: '',
      category: '',
      url: '',
      logo: '',
      isActive: true
    });
    setActionType('add');
    setIsModalOpen(true);
  };

  // 关闭模态框
  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentTool(null);
  };

  // 处理添加工具
  const handleAddTool = async () => {
    try {
      // 从localStorage获取当前管理员用户信息
      const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
      
      // 构建完整的工具数据，包括createdBy字段
      const toolData = {
        ...newTool,
        createdBy: adminUser.email || 'admin@anwei.com' // 默认使用admin@anwei.com作为备用
      };
      
      const responseData = await toolsAPI.addTool(toolData);

      // 更新本地工具列表
      setTools(prevTools => [...prevTools, responseData.tool]);
      setFilteredTools(prevTools => [...prevTools, responseData.tool]);
      
      // 重新加载统计数据
      loadToolStats();
      closeModal();
    } catch (err) {
        console.error('添加工具过程中的错误:', err);
        setError(err instanceof Error ? err.message : '添加工具失败，请稍后重试');
        setTimeout(() => setError(''), 3000);
      }
  };

  // 处理搜索和筛选
  useEffect(() => {
    let result = [...tools];
    
    // 按搜索词筛选
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(tool => 
        tool.name.toLowerCase().includes(term) || 
        tool.description.toLowerCase().includes(term) ||
        tool.category.toLowerCase().includes(term)
      );
    }
    
    // 按分类筛选
    if (categoryFilter !== 'all') {
      result = result.filter(tool => tool.category === categoryFilter);
    }
    
    // 按状态筛选
    if (statusFilter !== 'all') {
      result = result.filter(tool => tool.isActive === (statusFilter === 'active'));
    }
    
    setFilteredTools(result);
  }, [tools, searchTerm, categoryFilter, statusFilter]);

  // 初始化页面
  useEffect(() => {
    checkAuth();
    loadTools();
    loadToolStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN');
  };

  // 生成导航链接
  const NavLink = ({ path, icon, label }: { path: string; icon: React.ReactNode; label: string }) => {
    const isActive = window.location.pathname === path;
    return (
      <a 
        href={path}
        className={`flex items-center px-4 py-3 rounded-lg transition-all duration-200 mb-1 ${isActive ? 'bg-blue-600/20 text-blue-400' : 'text-gray-400 hover:text-white hover:bg-white/5'}        `}
        onClick={(e) => {
          e.preventDefault();
          navigate(path);
        }}
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
              <Wrench className="mr-2 text-blue-500" size={20} />
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
              <h1 className="text-2xl font-bold">工具管理</h1>
              <p className="text-gray-400">管理系统中的所有工具</p>
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
                      <p className="text-gray-400 text-sm">总工具数</p>
                      <h3 className="text-2xl font-bold text-white mt-1">{stats.totalTools}</h3>
                    </div>
                    <div className="p-2 rounded-lg bg-blue-500/20">
                      <Wrench size={20} className="text-blue-400" />
                    </div>
                  </div>
                </div>
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10 hover:border-white/20 transition-all duration-300">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-gray-400 text-sm">活跃工具</p>
                      <h3 className="text-2xl font-bold text-green-400 mt-1">{stats.activeTools}</h3>
                    </div>
                    <div className="p-2 rounded-lg bg-green-500/20">
                      <Activity size={20} className="text-green-400" />
                    </div>
                  </div>
                </div>
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10 hover:border-white/20 transition-all duration-300">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-gray-400 text-sm">分类数</p>
                      <h3 className="text-2xl font-bold text-purple-400 mt-1">{stats.categoryDistribution.length}</h3>
                    </div>
                    <div className="p-2 rounded-lg bg-purple-500/20">
                      <Filter size={20} className="text-purple-400" />
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* 图表区域 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {stats?.categoryDistribution && (
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10">
                <h3 className="text-lg font-semibold mb-4">工具分类分布</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <ReBarChart data={stats.categoryDistribution}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="_id" stroke="rgba(255,255,255,0.6)" />
                      <YAxis stroke="rgba(255,255,255,0.6)" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'rgba(17, 24, 39, 0.9)', borderColor: 'rgba(255,255,255,0.2)' }}
                        labelStyle={{ color: '#fff' }}
                      />
                      <Bar dataKey="count" fill="#8884d8" radius={[4, 4, 0, 0]} />
                    </ReBarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
            {stats?.usageTrend && (
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10">
                <h3 className="text-lg font-semibold mb-4">工具使用趋势</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <ReBarChart data={stats.usageTrend}>
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
                  placeholder="搜索工具..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex space-x-2">
                <select
                  className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="all">所有分类</option>
                  {Array.from(new Set(tools.map(tool => tool.category))).map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
                <select
                  className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">所有状态</option>
                  <option value="active">活跃</option>
                  <option value="inactive">禁用</option>
                </select>
              </div>
            </div>
            <button 
              onClick={openModalForAdd}
              className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors duration-200"
            >
              <Plus size={16} className="mr-2" />
              <span>添加工具</span>
            </button>
          </div>

          {/* 工具列表 */}
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10">
            <h3 className="text-lg font-semibold mb-4">工具列表 ({filteredTools.length})</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="py-2 px-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">工具名称</th>
                    <th className="py-2 px-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">分类</th>
                    <th className="py-2 px-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">状态</th>
                    <th className="py-2 px-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">使用次数</th>
                    <th className="py-2 px-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">创建时间</th>
                    <th className="py-2 px-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">更新时间</th>
                    <th className="py-2 px-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {filteredTools.map((tool) => (
                    <tr key={tool._id} className="hover:bg-white/5 transition-colors duration-200">
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-white">{tool.name}</div>
                        <div className="text-xs text-gray-400 mt-1 max-w-xs truncate">{tool.description}</div>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs rounded-full bg-blue-500/20 text-blue-400">
                          {tool.category}
                        </span>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${tool.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                          {tool.isActive ? '活跃' : '禁用'}
                        </span>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap text-sm text-gray-300">
                        {tool.usageCount}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap text-sm text-gray-400">
                        {formatDate(tool.createdAt)}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap text-sm text-gray-400">
                        {formatDate(tool.updatedAt)}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                          onClick={() => openModal(tool, 'edit')}
                          className="text-blue-400 hover:text-blue-300 mr-3 transition-colors duration-200"
                        >
                          <Edit size={18} />
                        </button>
                        <button 
                          onClick={() => openModal(tool, 'delete')}
                          className="text-red-400 hover:text-red-300 transition-colors duration-200"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredTools.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                没有找到符合条件的工具
              </div>
            )}
          </div>

          {/* 模态框 */}
          {isModalOpen && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-gray-900 rounded-xl p-6 max-w-md w-full border border-white/20">
                <h3 className="text-xl font-bold text-white mb-4">
                  {actionType === 'edit' ? '编辑工具' : actionType === 'delete' ? '删除工具' : '添加工具'}
                </h3>
                {actionType === 'add' ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-gray-300 mb-2">工具名称 <span className="text-red-400">*</span></label>
                      <input
                        type="text"
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="请输入工具名称"
                        value={newTool.name}
                        onChange={(e) => setNewTool(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-gray-300 mb-2">分类 <span className="text-red-400">*</span></label>
                      <select
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={newTool.category || ''}
                        onChange={(e) => setNewTool(prev => ({ ...prev, category: e.target.value }))}
                      >
                        <option value="">请选择分类</option>
                        <option value="开发工具">开发工具</option>
                        <option value="设计工具">设计工具</option>
                        <option value="办公工具">办公工具</option>
                        <option value="学习工具">学习工具</option>
                        <option value="娱乐工具">娱乐工具</option>
                        <option value="其他">其他</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-gray-300 mb-2">URL <span className="text-red-400">*</span></label>
                      <input
                        type="text"
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="请输入工具URL地址"
                        value={newTool.url}
                        onChange={(e) => setNewTool(prev => ({ ...prev, url: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-gray-300 mb-2">工具图片</label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <input
                            type="text"
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            value={newTool.logo}
                            onChange={(e) => setNewTool(prev => ({ ...prev, logo: e.target.value }))}
                            placeholder="请输入工具图片URL地址"
                          />
                        </div>
                        <div>
                          <input
                            type="file"
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            accept="image/*"
                            onChange={handleLogoUpload}
                          />
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">支持JPG、PNG、GIF、WebP、SVG格式，推荐尺寸：200x200px，大小不超过5MB</p>
                      {logoUploading && (
                        <p className="text-xs text-blue-400 mt-1">图片上传中...</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-gray-300 mb-2">描述 <span className="text-red-400">*</span></label>
                      <textarea
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="请输入工具描述"
                        value={newTool.description}
                        rows={3}
                        onChange={(e) => setNewTool(prev => ({ ...prev, description: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-gray-300 mb-2">状态</label>
                      <select
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={newTool.isActive ? 'active' : 'inactive'}
                        onChange={(e) => setNewTool(prev => ({ ...prev, isActive: e.target.value === 'active' }))}
                      >
                        <option value="active">活跃</option>
                        <option value="inactive">禁用</option>
                      </select>
                    </div>
                  </div>
                ) : actionType === 'edit' ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-gray-300 mb-2">工具名称</label>
                      <input
                        type="text"
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={currentTool?.name}
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="block text-gray-300 mb-2">分类</label>
                      <select
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={currentTool?.category}
                        disabled
                      >
                        {Array.from(new Set(tools.map(tool => tool.category))).map(category => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-gray-300 mb-2">描述</label>
                      <textarea
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={currentTool?.description}
                        rows={3}
                        readOnly
                      />
                    </div>
                    <div>
                    <label className="block text-gray-300 mb-2">工具图片</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input
                        type="text"
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={currentTool?.logo}
                        readOnly
                      />
                      <input
                        type="file"
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        accept="image/*"
                        onChange={handleLogoUpdate}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">支持JPG、PNG、GIF、WebP、SVG格式，推荐尺寸：200x200px，大小不超过5MB</p>
                    {logoUpdating && (
                      <p className="text-xs text-blue-400 mt-1">图片更新中...</p>
                    )}
                  </div>
                    <div>
                      <label className="block text-gray-300 mb-2">状态</label>
                      <select
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={currentTool?.isActive ? 'active' : 'inactive'}
                        onChange={(e) => {
                          if (currentTool) {
                            updateToolStatus(currentTool._id, e.target.value === 'active');
                            closeModal();
                          }
                        }}
                      >
                        <option value="active">活跃</option>
                        <option value="inactive">禁用</option>
                      </select>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-gray-300 mb-4">
                      确定要删除工具 <span className="text-white font-medium">{currentTool?.name}</span> 吗？此操作不可撤销。
                    </p>
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-300 text-sm mb-4">
                      删除工具将永久移除该工具及其相关数据，建议先禁用该工具。
                    </div>
                  </div>
                )}
                <div className="flex justify-end space-x-3 mt-6">
                  <button 
                    onClick={closeModal}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors duration-200"
                  >
                    取消
                  </button>
                  <button 
                    onClick={() => {
                      if (actionType === 'delete') {
                        // 实现删除工具的API调用
                        const deleteTool = async () => {
                          try {
                            if (currentTool) {
                               
                              await toolsAPI.deleteTool(currentTool._id);
                             
                              // 更新本地工具列表
                              setTools(prevTools => prevTools.filter(tool => tool._id !== currentTool._id));
                              setFilteredTools(prevTools => prevTools.filter(tool => tool._id !== currentTool._id));
                               
                              // 重新加载统计数据
                              loadToolStats();
                              closeModal();
                            }
                          } catch (err) {
                            setError(err instanceof Error ? err.message : '删除工具失败，请稍后重试');
                            setTimeout(() => setError(''), 3000);
                            closeModal();
                          }
                        };
                           
                        deleteTool();
                      } else if (actionType === 'add') {
                        // 验证必填字段
                        if (!newTool.name.trim() || !newTool.description.trim() || !newTool.category.trim() || !newTool.url.trim()) {
                          setError('请填写所有必填字段');
                          setTimeout(() => setError(''), 3000);
                          return;
                        }
                        handleAddTool();
                      } else {
                        closeModal();
                      }
                    }}
                    className={`px-4 py-2 rounded-lg transition-colors duration-200 ${actionType === 'delete' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                  >
                    {actionType === 'delete' ? '删除' : '保存'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ToolsManagement;