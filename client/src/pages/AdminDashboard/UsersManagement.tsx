import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Search, Filter, Plus, Edit, Trash2, Lock, Unlock, ChevronDown, Wrench, ShoppingBag, PieChart, MessageCircle, Settings, LogOut, Bell, Activity, Shield } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// 定义用户类型
interface User {
  _id: string;
  email: string;
  username: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  lastLogin: string;
}

// 定义用户统计数据类型
interface UserStats {
  totalUsers: number;
  activeUsers: number;
  adminUsers: number;
  roleDistribution: Array<{ _id: string; count: number }>;
}

const UsersManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [actionType, setActionType] = useState<'edit' | 'delete'>('edit');
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

  // 加载用户数据
  const loadUsers = async () => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '获取用户列表失败');
      }

      setUsers(data.users);
      setFilteredUsers(data.users);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取用户列表失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 加载用户统计数据
  const loadUserStats = async () => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }

    try {
      const response = await fetch('/api/admin/users/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '获取用户统计数据失败');
      }

      setStats(data);
    } catch (err) {
      console.error('获取用户统计数据错误:', err);
      // 不设置错误状态，因为这不是核心功能
    }
  };

  // 更新用户状态
  const updateUserStatus = async (userId: string, isActive: boolean) => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }

    try {
      const response = await fetch(`/api/users/${userId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isActive })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '更新用户状态失败');
      }

      // 更新本地用户列表
      setUsers(prevUsers => prevUsers.map(user => 
        user._id === userId ? { ...user, isActive } : user
      ));
      setFilteredUsers(prevUsers => prevUsers.map(user => 
        user._id === userId ? { ...user, isActive } : user
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新用户状态失败，请稍后重试');
      setTimeout(() => setError(''), 3000);
    }
  };

  // 打开模态框
  const openModal = (user: User, type: 'edit' | 'delete') => {
    setCurrentUser(user);
    setActionType(type);
    setIsModalOpen(true);
  };

  // 关闭模态框
  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentUser(null);
  };

  // 处理搜索和筛选
  useEffect(() => {
    let result = [...users];
    
    // 按搜索词筛选
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(user => 
        user.username.toLowerCase().includes(term) || 
        user.email.toLowerCase().includes(term)
      );
    }
    
    // 按角色筛选
    if (roleFilter !== 'all') {
      result = result.filter(user => user.role === roleFilter);
    }
    
    // 按状态筛选
    if (statusFilter !== 'all') {
      result = result.filter(user => user.isActive === (statusFilter === 'active'));
    }
    
    setFilteredUsers(result);
  }, [users, searchTerm, roleFilter, statusFilter]);

  // 初始化页面
  useEffect(() => {
    checkAuth();
    loadUsers();
    loadUserStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN');
  };

  // 生成导航链接
  const NavLink = ({ path, icon, label }: { path: string; icon: React.ReactNode; label: string }) => {
    const isActive = path === '/admin/users';
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
              <Users className="mr-2 text-blue-500" size={20} />
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
              <h1 className="text-2xl font-bold">用户管理</h1>
              <p className="text-gray-400">管理系统中的所有用户账号</p>
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
                      <p className="text-gray-400 text-sm">总用户数</p>
                      <h3 className="text-2xl font-bold text-white mt-1">{stats.totalUsers}</h3>
                    </div>
                    <div className="p-2 rounded-lg bg-blue-500/20">
                      <Users size={20} className="text-blue-400" />
                    </div>
                  </div>
                </div>
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10 hover:border-white/20 transition-all duration-300">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-gray-400 text-sm">活跃用户</p>
                      <h3 className="text-2xl font-bold text-green-400 mt-1">{stats.activeUsers}</h3>
                    </div>
                    <div className="p-2 rounded-lg bg-green-500/20">
                      <Activity size={20} className="text-green-400" />
                    </div>
                  </div>
                </div>
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10 hover:border-white/20 transition-all duration-300">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-gray-400 text-sm">管理员用户</p>
                      <h3 className="text-2xl font-bold text-purple-400 mt-1">{stats.adminUsers}</h3>
                    </div>
                    <div className="p-2 rounded-lg bg-purple-500/20">
                      <Shield size={20} className="text-purple-400" />
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* 图表区域 */}
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10 mb-6">
            <h3 className="text-lg font-semibold mb-4">用户角色分布</h3>
            <div className="h-64">
              {stats?.roleDistribution && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.roleDistribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="_id" stroke="rgba(255,255,255,0.6)" />
                    <YAxis stroke="rgba(255,255,255,0.6)" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'rgba(17, 24, 39, 0.9)', borderColor: 'rgba(255,255,255,0.2)' }}
                      labelStyle={{ color: '#fff' }}
                    />
                    <Bar dataKey="count" fill="#8884d8" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
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
                  placeholder="搜索用户..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex space-x-2">
                <select
                  className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                >
                  <option value="all">所有角色</option>
                  <option value="user">普通用户</option>
                  <option value="admin">管理员</option>
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
            <button className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors duration-200">
              <Plus size={16} className="mr-2" />
              <span>添加用户</span>
            </button>
          </div>

          {/* 用户列表 */}
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10">
            <h3 className="text-lg font-semibold mb-4">用户列表 ({filteredUsers.length})</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="py-2 px-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">用户名</th>
                    <th className="py-2 px-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">邮箱</th>
                    <th className="py-2 px-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">角色</th>
                    <th className="py-2 px-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">状态</th>
                    <th className="py-2 px-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">创建时间</th>
                    <th className="py-2 px-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">最后登录</th>
                    <th className="py-2 px-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {filteredUsers.map((user) => (
                    <tr key={user._id} className="hover:bg-white/5 transition-colors duration-200">
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-white">{user.username}</div>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap text-sm text-gray-300">
                        {user.email}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${user.role === 'admin' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>
                          {user.role === 'admin' ? '管理员' : '普通用户'}
                        </span>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${user.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                          {user.isActive ? '活跃' : '禁用'}
                        </span>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap text-sm text-gray-400">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap text-sm text-gray-400">
                        {user.lastLogin ? formatDate(user.lastLogin) : '从未登录'}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                          onClick={() => openModal(user, 'edit')}
                          className="text-blue-400 hover:text-blue-300 mr-3 transition-colors duration-200"
                        >
                          <Edit size={18} />
                        </button>
                        <button 
                          onClick={() => openModal(user, 'delete')}
                          className="text-red-400 hover:text-red-300 mr-3 transition-colors duration-200"
                        >
                          <Trash2 size={18} />
                        </button>
                        <button 
                          onClick={() => updateUserStatus(user._id, !user.isActive)}
                          className="text-yellow-400 hover:text-yellow-300 transition-colors duration-200"
                        >
                          {user.isActive ? <Lock size={18} /> : <Unlock size={18} />}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredUsers.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                没有找到符合条件的用户
              </div>
            )}
          </div>

          {/* 模态框 */}
          {isModalOpen && currentUser && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-gray-900 rounded-xl p-6 max-w-md w-full border border-white/20">
                <h3 className="text-xl font-bold text-white mb-4">
                  {actionType === 'edit' ? '编辑用户' : '删除用户'}
                </h3>
                {actionType === 'edit' ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-gray-300 mb-2">用户名</label>
                      <input
                        type="text"
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={currentUser.username}
                        disabled
                      />
                    </div>
                    <div>
                      <label className="block text-gray-300 mb-2">邮箱</label>
                      <input
                        type="email"
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={currentUser.email}
                          disabled
                      />
                    </div>
                    <div>
                      <label className="block text-gray-300 mb-2">角色</label>
                      <select
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={currentUser.role}
                          disabled
                      >
                        <option value="user">普通用户</option>
                        <option value="admin">管理员</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-gray-300 mb-2">状态</label>
                      <select
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={currentUser.isActive ? 'active' : 'inactive'}
                        onChange={(e) => {
                          updateUserStatus(currentUser._id, e.target.value === 'active');
                          closeModal();
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
                      确定要删除用户 <span className="text-white font-medium">{currentUser.username}</span> 吗？此操作不可撤销。
                    </p>
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-300 text-sm mb-4">
                      删除用户将永久移除该账号及其相关数据，建议先禁用用户账号。
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
                        // 删除用户的逻辑将在此实现
                        closeModal();
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

export default UsersManagement;