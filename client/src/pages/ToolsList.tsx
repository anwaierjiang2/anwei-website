import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, ArrowRight, ExternalLink, Star, ChevronDown, ChevronUp, Home } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

// 工具类型定义
interface Tool {
  _id: string;
  name: string;
  description: string;
  category: string;
  url: string;
  logo: string;
  isActive: boolean;
  usageCount: number;
  viewCount: number;
  rating: number;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    _id: string;
    username: string;
  };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface ToolsResponse {
  tools: Tool[];
  pagination: Pagination;
}

const ToolsList: React.FC = () => {
  const navigate = useNavigate();
  const [tools, setTools] = useState<Tool[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // 返回首页
  const goToHome = () => {
    navigate('/');
  };

  // 获取工具列表
  const fetchTools = async (page: number = 1, search: string = '', category: string = 'all') => {
    setLoading(true);
    setError('');
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('page', page.toString());
      queryParams.append('limit', '12'); // 每页显示12个工具
      if (search) {
        queryParams.append('search', search);
      }
      if (category !== 'all') {
        queryParams.append('category', category);
      }

      const response = await fetch(`/api/tools?${queryParams.toString()}`);
      if (!response.ok) {
        throw new Error('获取工具列表失败');
      }

      const data: ToolsResponse = await response.json();
      setTools(data.tools);
      setTotalPages(data.pagination.pages);
      
      // 提取所有唯一的分类
      const uniqueCategories = Array.from(new Set(data.tools.map(tool => tool.category)));
      setCategories(uniqueCategories);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取工具列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 初始化加载工具
  useEffect(() => {
    fetchTools();
  }, []);

  // 处理搜索和筛选
  const handleSearchAndFilter = () => {
    setCurrentPage(1);
    fetchTools(1, searchTerm, selectedCategory);
  };

  // 处理分页
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      fetchTools(page, searchTerm, selectedCategory);
    }
  };

  // 处理工具点击
  const handleToolClick = async (toolId: string) => {
    try {
      // 增加工具使用次数
      await fetch(`/api/tools/${toolId}/click`, {
        method: 'POST'
      });
    } catch (error) {
      console.error('更新工具点击次数失败:', error);
    }
  };

  // 生成页码
  const renderPagination = () => {
    const pageNumbers = [];
    for (let i = 1; i <= totalPages; i++) {
      pageNumbers.push(i);
    }

    return (
      <div className="flex justify-center mt-12">
        <div className="flex space-x-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`px-4 py-2 rounded-lg border transition-colors ${currentPage === 1 ? 'border-gray-700 text-gray-500 cursor-not-allowed' : 'border-primary-500 text-primary-400 hover:bg-primary-500/10'}`}
          >
            上一页
          </button>
          {pageNumbers.map(page => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`px-4 py-2 rounded-lg transition-colors ${currentPage === page ? 'bg-primary-500 text-white' : 'bg-transparent border border-gray-700 text-gray-300 hover:border-primary-500 hover:text-primary-400'}`}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`px-4 py-2 rounded-lg border transition-colors ${currentPage === totalPages ? 'border-gray-700 text-gray-500 cursor-not-allowed' : 'border-primary-500 text-primary-400 hover:bg-primary-500/10'}`}
          >
            下一页
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 text-white">
      {/* 页面标题 */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-4 text-left">
            <motion.button
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              onClick={goToHome}
              className="flex items-center gap-2 px-4 py-2 bg-dark-700/70 hover:bg-dark-700 border border-dark-600 rounded-lg transition-colors duration-200 text-white"
            >
              <Home size={16} />
              <span>返回首页</span>
            </motion.button>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-white to-primary-200 bg-clip-text text-transparent">
              探索优质工具
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              我们精心挑选了各种实用工具，帮助您更高效地工作和学习
            </p>
          </motion.div>
        </div>
      </section>

      {/* 搜索和筛选区域 */}
      <section className="py-6 bg-dark-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="搜索工具..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearchAndFilter()}
                className="w-full pl-10 pr-4 py-3 rounded-lg bg-dark-700/50 border border-dark-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-white placeholder-gray-500"
              />
            </div>
            
            <div className="w-full md:w-auto flex flex-col sm:flex-row gap-4">
              {/* 移动端筛选按钮 */}
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className="md:hidden flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-dark-700/50 border border-dark-600 text-white"
              >
                <Filter size={18} />
                <span>筛选</span>
                {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              
              {/* 桌面端筛选选项 */}
              <div className={`w-full md:w-auto ${showFilters ? 'block' : 'hidden md:flex'} gap-4`}>
                <div className="relative w-full md:w-48">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full appearance-none pl-4 pr-10 py-3 rounded-lg bg-dark-700/50 border border-dark-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-white"
                  >
                    <option value="all">所有分类</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                    <ChevronDown size={16} />
                  </div>
                </div>
                
                <button
                  onClick={handleSearchAndFilter}
                  className="w-full md:w-auto px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg transition-colors duration-200"
                >
                  应用筛选
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 工具列表区域 */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-xl text-gray-400">加载工具中...</div>
            </div>
          ) : error ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-xl text-red-400">{error}</div>
            </div>
          ) : tools.length === 0 ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-xl text-gray-400">未找到匹配的工具</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {tools.map((tool, index) => (
                <motion.div
                  key={tool._id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  whileHover={{ y: -5, transition: { duration: 0.2 } }}
                  className="group bg-dark-800/50 border border-dark-700 hover:border-primary-500/50 rounded-xl overflow-hidden transition-all duration-300"
                >
                  <div className="p-6">
                    {tool.logo && (
                      <div className="w-full h-32 mb-4 rounded-lg overflow-hidden bg-dark-700/50 flex items-center justify-center">
                        <img
                          src={tool.logo}
                          alt={`${tool.name} logo`}
                          className="max-w-full max-h-full object-contain p-2"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                    <div className="mb-4">
                      <span className="inline-block px-3 py-1 text-xs font-medium bg-primary-500/10 text-primary-400 rounded-full mb-4">
                        {tool.category}
                      </span>
                      <h3 className="text-xl font-semibold mb-2 text-white group-hover:text-primary-400 transition-colors duration-300">
                        {tool.name}
                      </h3>
                      <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                        {tool.description}
                      </p>
                    </div>
                    
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-1 text-amber-400">
                        <Star size={14} fill="currentColor" />
                        <span className="text-sm font-medium">{tool.rating || '暂无评分'}</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        使用 {tool.usageCount} 次
                      </div>
                    </div>
                    
                    <a
                      href={tool.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => handleToolClick(tool._id)}
                      className="flex items-center justify-between w-full px-4 py-3 bg-primary-500/10 hover:bg-primary-500/20 text-primary-400 rounded-lg transition-colors duration-300 group"
                    >
                      <span>访问工具</span>
                      <ExternalLink size={16} className="group-hover:translate-x-1 transition-transform duration-300" />
                    </a>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* 分页 */}
          {!loading && !error && tools.length > 0 && renderPagination()}
        </div>
      </section>

      {/* CTA 区域 */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              找不到您需要的工具？
            </h2>
            <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
              告诉我们您需要什么工具，我们会尽力为您寻找和添加
            </p>
            <Link
              to="/feedback"
              className="inline-flex items-center px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105"
            >
              提交工具请求
              <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default ToolsList;