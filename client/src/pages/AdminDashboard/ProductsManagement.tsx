import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Search, Plus, Edit, Trash2, ChevronDown, Users, BarChart, Wrench, PieChart, MessageCircle, Settings, LogOut, Bell, DollarSign, Award, Filter, Activity, Upload, Image, Tag, Check, X } from 'lucide-react';
import { BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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
    gallery?: string[];
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

// 定义产品统计数据类型
interface ProductStats {
  totalProducts: number;
  activeProducts: number;
  categoryDistribution: Array<{ _id: string; count: number }>;
  salesTrend: Array<{ date: string; sales: number }>;
  totalRevenue: number;
}

const ProductsManagement: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [stats, setStats] = useState<ProductStats | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [actionType, setActionType] = useState<'edit' | 'delete' | 'add'>('edit');
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '',
    category: '',
    description: '',
    shortDescription: '',
    price: 0,
    stock: 0,
    isActive: true,
    isFeatured: false,
    tags: []
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

  // 加载产品数据
  const loadProducts = async () => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/products', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '获取产品列表失败');
      }

      setProducts(data.products);
      setFilteredProducts(data.products);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取产品列表失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 加载产品统计数据
  const loadProductStats = async () => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }

    try {
      // 计算简单的统计数据，因为后端没有专门的统计API
      if (products.length > 0) {
        const totalProducts = products.length;
        const activeProducts = products.filter(p => p.isActive).length;
        const totalRevenue = products.reduce((sum, p) => sum + (p.price * p.salesCount), 0);
        
        // 计算分类分布
        const categoryMap = new Map<string, number>();
        products.forEach(p => {
          categoryMap.set(p.category, (categoryMap.get(p.category) || 0) + 1);
        });
        const categoryDistribution = Array.from(categoryMap.entries()).map(([name, count]) => ({
          _id: name,
          count
        }));
        
        // 模拟销售趋势
        const salesTrend = Array.from({length: 7}, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - (6 - i));
          const day = date.getDate();
          const month = date.getMonth() + 1;
          return {
            date: `${month}/${day}`,
            sales: Math.floor(Math.random() * 1000) + 100
          };
        });
        
        setStats({
          totalProducts,
          activeProducts,
          categoryDistribution,
          salesTrend,
          totalRevenue
        });
      }
    } catch (err) {
      console.error('计算产品统计数据错误:', err);
    }
  };

  // 更新产品状态
  const updateProductStatus = async (productId: string, isActive: boolean) => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }

    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isActive })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '更新产品状态失败');
      }

      // 更新本地产品列表
      setProducts(prevProducts => prevProducts.map(product => 
        product._id === productId ? { ...product, isActive } : product
      ));
      setFilteredProducts(prevProducts => prevProducts.map(product => 
        product._id === productId ? { ...product, isActive } : product
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新产品状态失败，请稍后重试');
      setTimeout(() => setError(''), 3000);
    }
  };

  // 打开模态框
  const openModal = (product: Product, type: 'edit' | 'delete') => {
    setCurrentProduct(product);
    setActionType(type);
    setIsModalOpen(true);
  };
  
  // 处理编辑产品
  const handleEditProduct = async () => {
    if (!currentProduct) return;
    
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    
    // 验证必填字段
    if (!currentProduct.name || !currentProduct.category || !currentProduct.shortDescription || currentProduct.price === undefined || currentProduct.stock === undefined) {
      setError('请填写所有必填字段（带*号的字段）');
      setTimeout(() => setError(''), 3000);
      return;
    }

    try {
      setSubmitLoading(true);
      const response = await fetch(`/api/products/${currentProduct!._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: currentProduct.name,
          category: currentProduct.category,
          shortDescription: currentProduct.shortDescription,
          description: currentProduct.description,
          price: Number(currentProduct.price),
          originalPrice: currentProduct.originalPrice ? Number(currentProduct.originalPrice) : undefined,
          stock: Number(currentProduct.stock),
          isActive: currentProduct.isActive,
          isFeatured: currentProduct.isFeatured,
          tags: currentProduct.tags,
          // 添加images字段，确保上传的图片URL能保存到数据库
          images: currentProduct.images
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '更新产品失败');
      }

      // 更新本地产品列表
      setProducts(prevProducts => prevProducts.map(product => 
        product._id === currentProduct._id ? data : product
      ));
      setFilteredProducts(prevProducts => prevProducts.map(product => 
        product._id === currentProduct._id ? data : product
      ));
      
      // 重新加载统计数据
      loadProductStats();
      closeModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新产品失败，请稍后重试');
      setTimeout(() => setError(''), 3000);
    } finally {
      setSubmitLoading(false);
    }
  };

  // 打开添加产品模态框
  const openModalForAdd = () => {
    setNewProduct({
      name: '',
      category: '',
      shortDescription: '',
      description: '',
      price: 0,
      originalPrice: 0,
      stock: 0,
      tags: [],
      images: {
        main: '',
        gallery: []
      },
      isFeatured: false,
      taobaoLink: '',
      createdAt: new Date().toISOString()
    });
    setActionType('add');
    setIsModalOpen(true);
  };

  // 关闭模态框
  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentProduct(null);
  };

  // 处理添加产品
  const handleAddProduct = async () => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }

    // 验证必填字段
    if (!newProduct.name || !newProduct.category || !newProduct.shortDescription || newProduct.price === undefined || newProduct.price < 0 || newProduct.stock === undefined || newProduct.stock < -1) {
      setError('请填写所有必填字段，价格不能为负数，库存不能小于-1');
      setTimeout(() => setError(''), 3000);
      return;
    }

    try {
      setSubmitLoading(true);
      
      // 创建请求体，保留已上传的图片信息
      const requestBody = {
        ...newProduct,
        price: Number(newProduct.price),
        stock: Number(newProduct.stock),
        originalPrice: newProduct.originalPrice !== undefined ? Number(newProduct.originalPrice) : undefined,
        tags: newProduct.tags || [],
        // 只在没有图片时使用占位图
        images: {
          main: newProduct.images?.main || `https://picsum.photos/300/200?random=${Date.now()}`,
          gallery: newProduct.images?.gallery || []
        }
      };
      
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '添加产品失败');
      }

      // 更新本地产品列表
      setProducts(prevProducts => [...prevProducts, data.product]);
      
      // 重新加载统计数据
      loadProductStats();
      closeModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : '添加产品失败，请稍后重试');
      setTimeout(() => setError(''), 3000);
    } finally {
      setSubmitLoading(false);
    }
  };

  // 处理搜索和筛选
  useEffect(() => {
    let result = [...products];
    
    // 按搜索词筛选
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(product => 
        product.name.toLowerCase().includes(term) || 
        product.description.toLowerCase().includes(term) ||
        product.category.toLowerCase().includes(term)
      );
    }
    
    // 按分类筛选
    if (categoryFilter !== 'all') {
      result = result.filter(product => product.category === categoryFilter);
    }
    
    // 按状态筛选
    if (statusFilter !== 'all') {
      result = result.filter(product => product.isActive === (statusFilter === 'active'));
    }
    
    setFilteredProducts(result);
  }, [products, searchTerm, categoryFilter, statusFilter]);

  // 初始化页面
  useEffect(() => {
    checkAuth();
    loadProducts();
    loadProductStats();
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
    const isActive = path === '/admin/products';
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
              <ShoppingBag className="mr-2 text-blue-500" size={20} />
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
              <h1 className="text-2xl font-bold">产品管理</h1>
              <p className="text-gray-400">管理系统中的所有产品</p>
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
                      <p className="text-gray-400 text-sm">总产品数</p>
                      <h3 className="text-2xl font-bold text-white mt-1">{stats.totalProducts}</h3>
                    </div>
                    <div className="p-2 rounded-lg bg-blue-500/20">
                      <ShoppingBag size={20} className="text-blue-400" />
                    </div>
                  </div>
                </div>
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10 hover:border-white/20 transition-all duration-300">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-gray-400 text-sm">活跃产品</p>
                      <h3 className="text-2xl font-bold text-green-400 mt-1">{stats.activeProducts}</h3>
                    </div>
                    <div className="p-2 rounded-lg bg-green-500/20">
                      <Activity size={20} className="text-green-400" />
                    </div>
                  </div>
                </div>
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10 hover:border-white/20 transition-all duration-300">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-gray-400 text-sm">总销售额</p>
                      <h3 className="text-2xl font-bold text-yellow-400 mt-1">{formatCurrency(stats.totalRevenue)}</h3>
                    </div>
                    <div className="p-2 rounded-lg bg-yellow-500/20">
                      <DollarSign size={20} className="text-yellow-400" />
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
                <h3 className="text-lg font-semibold mb-4">产品分类分布</h3>
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
            {stats?.salesTrend && (
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10">
                <h3 className="text-lg font-semibold mb-4">销售趋势</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <ReBarChart data={stats.salesTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="date" stroke="rgba(255,255,255,0.6)" />
                      <YAxis stroke="rgba(255,255,255,0.6)" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'rgba(17, 24, 39, 0.9)', borderColor: 'rgba(255,255,255,0.2)' }}
                        labelStyle={{ color: '#fff' }}
                        formatter={(value) => formatCurrency(value as number)}
                      />
                      <Bar dataKey="sales" fill="#82ca9d" radius={[4, 4, 0, 0]} />
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
                  placeholder="搜索产品..."
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
                  {Array.from(new Set(products.map(product => product.category))).map(category => (
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
              className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors duration-200"
              onClick={() => openModalForAdd()}
            >
              <Plus size={16} className="mr-2" />
              <span>添加产品</span>
            </button>
          </div>

          {/* 产品列表 */}
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10">
            <h3 className="text-lg font-semibold mb-4">产品列表 ({filteredProducts.length})</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="py-2 px-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">产品名称</th>
                    <th className="py-2 px-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">分类</th>
                    <th className="py-2 px-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">价格</th>
                    <th className="py-2 px-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">库存</th>
                    <th className="py-2 px-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">状态</th>
                    <th className="py-2 px-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">推荐</th>
                    <th className="py-2 px-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">销量</th>
                    <th className="py-2 px-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">浏览</th>
                    <th className="py-2 px-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {filteredProducts.map((product) => (
                    <tr key={product._id} className="hover:bg-white/5 transition-colors duration-200">
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-white">{product.name}</div>
                        <div className="text-xs text-gray-400 mt-1 max-w-xs truncate">{product.shortDescription}</div>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs rounded-full bg-blue-500/20 text-blue-400">
                          {product.category}
                        </span>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="text-sm text-green-400">{formatCurrency(product.price)}</div>
                        {product.originalPrice && product.originalPrice > product.price && (
                          <div className="text-xs text-gray-400 line-through">{formatCurrency(product.originalPrice)}</div>
                        )}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap text-sm text-gray-300">
                        {product.stock === -1 ? '无限' : product.stock}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${product.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                          {product.isActive ? '活跃' : '禁用'}
                        </span>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${product.isFeatured ? 'bg-yellow-500/20 text-yellow-400' : 'bg-gray-500/20 text-gray-400'}`}>
                          {product.isFeatured ? '是' : '否'}
                        </span>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap text-sm text-gray-300">
                        {product.salesCount}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap text-sm text-gray-300">
                        {product.viewCount}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                          onClick={() => openModal(product, 'edit')}
                          className="text-blue-400 hover:text-blue-300 mr-3 transition-colors duration-200"
                          title="编辑产品"
                        >
                          <Edit size={18} />
                        </button>
                        <button 
                          onClick={() => {
                            const newStatus = !product.isActive;
                            updateProductStatus(product._id, newStatus);
                          }}
                          className={`mr-3 transition-colors duration-200 ${product.isActive ? 'text-yellow-400 hover:text-yellow-300' : 'text-green-400 hover:text-green-300'}`}
                          title={product.isActive ? '禁用产品' : '启用产品'}
                        >
                          {product.isActive ? (
                            <X size={18} />
                          ) : (
                            <Check size={18} />
                          )}
                        </button>
                        <button 
                          onClick={() => openModal(product, 'delete')}
                          className="text-red-400 hover:text-red-300 transition-colors duration-200"
                          title="删除产品"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredProducts.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                没有找到符合条件的产品
              </div>
            )}
          </div>

          {/* 模态框 */}
          {isModalOpen && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-gray-900 rounded-xl p-6 max-w-2xl w-full border border-white/20 max-h-[90vh] overflow-y-auto">
                <h3 className="text-xl font-bold text-white mb-4">
                  {actionType === 'edit' ? '编辑产品' : actionType === 'add' ? '添加产品' : '删除产品'}
                </h3>
                {actionType === 'edit' && currentProduct ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-gray-300 mb-2">产品名称 *</label>
                      <input
                        type="text"
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={currentProduct.name}
                        onChange={(e) => setCurrentProduct({...currentProduct, name: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-gray-300 mb-2">分类 *</label>
                      <select
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={currentProduct.category}
                        onChange={(e) => setCurrentProduct({...currentProduct, category: e.target.value})}
                      >
                        {['网站建设', 'AI工具', '设计服务', '开发服务', '其他'].map(category => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-gray-300 mb-2">简短描述 *</label>
                      <input
                        type="text"
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={currentProduct.shortDescription}
                        onChange={(e) => setCurrentProduct({...currentProduct, shortDescription: e.target.value})}
                        maxLength={200}
                        placeholder="不超过200个字符的简短描述"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-300 mb-2">详细描述</label>
                      <textarea
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={currentProduct.description}
                        rows={4}
                        onChange={(e) => setCurrentProduct({...currentProduct, description: e.target.value})}
                        placeholder="详细描述产品特点和优势"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-300 mb-2">销售价格 *</label>
                        <input
                          type="number"
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={currentProduct.price}
                          onChange={(e) => setCurrentProduct({...currentProduct, price: Number(e.target.value)})}
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-300 mb-2">原价</label>
                        <input
                          type="number"
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={currentProduct.originalPrice || ''}
                          onChange={(e) => setCurrentProduct({...currentProduct, originalPrice: Number(e.target.value)})}
                          min="0"
                          step="0.01"
                          placeholder="0.00 (可选)"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-gray-300 mb-2">库存 *</label>
                      <input
                        type="number"
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={currentProduct.stock}
                        onChange={(e) => setCurrentProduct({...currentProduct, stock: Number(e.target.value)})}
                        min="-1"
                        placeholder="-1表示无限库存"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-300 mb-2">状态</label>
                        <select
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={currentProduct.isActive ? 'active' : 'inactive'}
                          onChange={(e) => setCurrentProduct({...currentProduct, isActive: e.target.value === 'active'})}
                        >
                          <option value="active">活跃</option>
                          <option value="inactive">禁用</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-gray-300 mb-2">推荐产品</label>
                        <select
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={currentProduct.isFeatured ? 'yes' : 'no'}
                          onChange={(e) => setCurrentProduct({...currentProduct, isFeatured: e.target.value === 'yes'})}
                        >
                          <option value="no">否</option>
                          <option value="yes">是</option>
                        </select>
                      </div>
                    </div>
                    <div>
                        <label className="block text-gray-300 mb-2">标签 (用逗号分隔)</label>
                        <input
                          type="text"
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={currentProduct.tags ? currentProduct.tags.join(', ') : ''}
                          onChange={(e) => setCurrentProduct({...currentProduct, tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag)})}
                          placeholder="例如: 网站, 设计, 开发"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-300 mb-2">淘宝产品链接</label>
                        <input
                          type="text"
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={currentProduct.taobaoLink || ''}
                          onChange={(e) => setCurrentProduct({...currentProduct, taobaoLink: e.target.value})}
                          placeholder="https://item.taobao.com/..."
                        />
                      </div>
                    {/* 图片上传部分 */}
                    <div>
                      <label className="block text-gray-300 mb-2">主图片</label>
                      <div className="mb-4">
                        <input
                          type="file"
                            accept="image/*"
                            className="w-full text-white file:bg-dark-700 file:border-0 file:text-sm file:px-4 file:py-2 file:rounded-lg"
                            onChange={async (e) => {
                              if (e.target.files && e.target.files[0]) {
                                const file = e.target.files[0];
                                const formData = new FormData();
                                formData.append('image', file);
                                formData.append('type', 'main');
                                formData.append('productId', currentProduct._id);
                                
                                try {
                                  const token = localStorage.getItem('adminToken');
                                  const response = await fetch('/api/products/upload', {
                                    method: 'POST',
                                    headers: {
                                      'Authorization': `Bearer ${token}`
                                    },
                                    body: formData
                                  });
                                  
                                  const data = await response.json();
                                  if (response.ok) {
                                    setCurrentProduct({...currentProduct, images: {
                                      ...currentProduct.images,
                                      main: data.imageUrl
                                    }});
                                  } else {
                                    throw new Error(data.message || '上传图片失败');
                                  }
                                } catch (err) {
                                  setError(err instanceof Error ? err.message : '上传图片失败，请稍后重试');
                                  setTimeout(() => setError(''), 3000);
                                }
                              }
                            }}
                        />
                        {currentProduct.images.main && (
                          <div className="mt-2">
                            <img src={currentProduct.images.main} alt="主图片预览" className="max-h-32 object-cover rounded-lg" />
                          </div>
                        )}
                      </div>
                      
                      <label className="block text-gray-300 mb-2">图库图片（多张，用逗号分隔URL）</label>
                      <input
                        type="text"
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={currentProduct.images.gallery?.join(', ') || ''}
                        onChange={(e) => setCurrentProduct({...currentProduct, images: {
                          ...currentProduct.images,
                          gallery: e.target.value.split(',').map(url => url.trim()).filter(url => url)
                        }})}
                        placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg..."
                      />
                    </div>
                    </div>
                  ) : actionType === 'add' ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-gray-300 mb-2">产品名称 *</label>
                        <input
                          type="text"
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={newProduct.name || ''}
                          onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                          placeholder="输入产品名称"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-300 mb-2">分类 *</label>
                        <select
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={newProduct.category || ''}
                          onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                        >
                          <option value="">请选择分类</option>
                          {['网站建设', 'AI工具', '设计服务', '开发服务', '其他'].map(category => (
                            <option key={category} value={category}>{category}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-gray-300 mb-2">简短描述 *</label>
                        <input
                          type="text"
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={newProduct.shortDescription || ''}
                          onChange={(e) => setNewProduct({...newProduct, shortDescription: e.target.value})}
                          maxLength={200}
                          placeholder="不超过200个字符的简短描述"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-300 mb-2">详细描述</label>
                        <textarea
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={newProduct.description || ''}
                          rows={4}
                          onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                          placeholder="详细描述产品特点和优势"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-gray-300 mb-2">销售价格 *</label>
                          <input
                            type="number"
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            value={newProduct.price || ''}
                            onChange={(e) => setNewProduct({...newProduct, price: Number(e.target.value)})}
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-300 mb-2">原价</label>
                          <input
                            type="number"
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            value={newProduct.originalPrice || ''}
                            onChange={(e) => setNewProduct({...newProduct, originalPrice: Number(e.target.value)})}
                            min="0"
                            step="0.01"
                            placeholder="0.00 (可选)"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-gray-300 mb-2">库存 *</label>
                        <input
                          type="number"
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={newProduct.stock || ''}
                          onChange={(e) => setNewProduct({...newProduct, stock: Number(e.target.value)})}
                          min="-1"
                          placeholder="-1表示无限库存"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-gray-300 mb-2">状态</label>
                          <select
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            value={newProduct.isActive ? 'active' : 'inactive'}
                            onChange={(e) => setNewProduct({...newProduct, isActive: e.target.value === 'active'})}
                          >
                            <option value="active">活跃</option>
                            <option value="inactive">禁用</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-gray-300 mb-2">推荐产品</label>
                          <select
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            value={newProduct.isFeatured ? 'yes' : 'no'}
                            onChange={(e) => setNewProduct({...newProduct, isFeatured: e.target.value === 'yes'})}
                          >
                            <option value="no">否</option>
                            <option value="yes">是</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-gray-300 mb-2">标签 (用逗号分隔)</label>
                        <input
                          type="text"
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={newProduct.tags ? newProduct.tags.join(', ') : ''}
                          onChange={(e) => setNewProduct({...newProduct, tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag)})}
                          placeholder="例如: 网站, 设计, 开发"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-300 mb-2">淘宝产品链接</label>
                        <input
                          type="text"
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={newProduct.taobaoLink || ''}
                          onChange={(e) => setNewProduct({...newProduct, taobaoLink: e.target.value})}
                          placeholder="https://item.taobao.com/..."
                        />
                      </div>
                      {/* 图片上传部分 */}
                      <div>
                        <label className="block text-gray-300 mb-2">主图片</label>
                        <div className="mb-4">
                          <input
                            type="file"
                            accept="image/*"
                            className="w-full text-white file:bg-dark-700 file:border-0 file:text-sm file:px-4 file:py-2 file:rounded-lg"
                            onChange={async (e) => {
                              if (e.target.files && e.target.files[0]) {
                                const file = e.target.files[0];
                                const formData = new FormData();
                                formData.append('image', file);
                                formData.append('type', 'main');
                                
                                try {
                                  const token = localStorage.getItem('adminToken');
                                  const response = await fetch('/api/products/upload', {
                                    method: 'POST',
                                    headers: {
                                      'Authorization': `Bearer ${token}`
                                    },
                                    body: formData
                                  });
                                  
                                  const data = await response.json();
                                  if (response.ok) {
                                    setNewProduct({...newProduct, images: {
                                      ...newProduct.images,
                                      main: data.imageUrl,
                                      gallery: newProduct.images?.gallery || []
                                    }});
                                  } else {
                                    throw new Error(data.message || '上传图片失败');
                                  }
                                } catch (err) {
                                  setError(err instanceof Error ? err.message : '上传图片失败，请稍后重试');
                                  setTimeout(() => setError(''), 3000);
                                }
                              }
                            }}
                          />
                          {newProduct.images?.main && (
                            <div className="mt-2">
                              <img src={newProduct.images.main} alt="主图片预览" className="max-h-32 object-cover rounded-lg" />
                            </div>
                          )}
                        </div>
                        
                        <label className="block text-gray-300 mb-2">图库图片（多张，用逗号分隔URL）</label>
                        <input
                          type="text"
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={newProduct.images?.gallery?.join(', ') || ''}
                          onChange={(e) => setNewProduct({...newProduct, images: {
                            ...newProduct.images,
                            gallery: e.target.value.split(',').map(url => url.trim()).filter(url => url)
                          }})}
                          placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg..."
                        />
                      </div>
                    </div>
                  ) : actionType === 'delete' && currentProduct ? (
                    <div>
                      <p className="text-gray-300 mb-4">
                        确定要删除产品 <span className="text-white font-medium">{currentProduct.name}</span> 吗？此操作不可撤销。
                      </p>
                      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-300 text-sm mb-4">
                        删除产品将永久移除该产品及其相关数据，建议先禁用该产品。
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      请选择一个产品进行操作
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
                                // 实现删除产品的API调用
                                const deleteProduct = async () => {
                                  const token = localStorage.getItem('adminToken');
                                  if (!token) {
                                    navigate('/admin/login');
                                    return;
                                  }
                                     
                                  try {
                                    const response = await fetch(`/api/products/${currentProduct!._id}`, {
                                      method: 'DELETE',
                                      headers: {
                                        'Authorization': `Bearer ${token}`,
                                        'Content-Type': 'application/json'
                                      }
                                    });
                                 
                                    const data = await response.json();
                                 
                                    if (!response.ok) {
                                      throw new Error(data.message || '删除产品失败');
                                    }
                                 
                                    // 更新本地产品列表
                                    setProducts(prevProducts => prevProducts.filter(product => product._id !== currentProduct!._id));
                                    setFilteredProducts(prevProducts => prevProducts.filter(product => product._id !== currentProduct!._id));
                                     
                                    // 重新加载统计数据
                                    loadProductStats();
                                    closeModal();
                                  } catch (err) {
                                    setError(err instanceof Error ? err.message : '删除产品失败，请稍后重试');
                                    setTimeout(() => setError(''), 3000);
                                    closeModal();
                                  }
                                };
                                     
                                deleteProduct();
                              } else if (actionType === 'add') {
                                // 验证必填字段
                                if (!newProduct.name || !newProduct.category || !newProduct.shortDescription || newProduct.price === undefined || newProduct.price < 0 || newProduct.stock === undefined || newProduct.stock < -1) {
                                  setError('请填写所有必填字段，价格不能为负数，库存不能小于-1');
                                  setTimeout(() => setError(''), 3000);
                                  return;
                                }
                                handleAddProduct();
                              } else {
                                handleEditProduct();
                              }
                            }}
                    className={`px-4 py-2 rounded-lg transition-colors duration-200 ${actionType === 'delete' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                    disabled={submitLoading}
                  >
                    {submitLoading ? (
                      <div className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        处理中...
                      </div>
                    ) : (
                      actionType === 'delete' ? '删除' : '保存'
                    )}
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



export default ProductsManagement;