import React, { useState, useEffect } from 'react';
import { AlertCircle, ChevronRight, MessageSquare } from 'lucide-react';
import Navbar from '../components/Navbar';

interface Feedback {
  _id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'pending' | 'processing' | 'resolved' | 'closed';
  createdAt: string;
  updatedAt: string;
  type: 'bug' | 'feature' | 'general' | 'other' | 'support';
  reply?: string;
  adminReply?: { message: string; adminId: string; repliedAt: string };
}

const UserFeedback: React.FC = () => {
  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);

  useEffect(() => {
    loadUserFeedback();
  }, []);

  const loadUserFeedback = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch('/api/feedback/my-feedback', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('获取反馈列表失败');
      }

      const data = await response.json();
      setFeedbackList(data.feedback || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取反馈列表失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const getStatusStyle = (status: Feedback['status']) => {
    switch (status) {
      case 'pending':
        return { label: '待处理', className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' };
      case 'processing':
        return { label: '处理中', className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' };
      case 'resolved':
        return { label: '已解决', className: 'bg-green-500/20 text-green-400 border-green-500/30' };
      case 'closed':
        return { label: '已关闭', className: 'bg-gray-500/20 text-gray-400 border-gray-500/30' };
      default:
        return { label: status, className: 'bg-gray-500/20 text-gray-400 border-gray-500/30' };
    }
  };

  const getTypeLabel = (type: Feedback['type']) => {
    switch (type) {
      case 'bug':
        return { label: 'Bug报告', className: 'text-red-400' };
      case 'feature':
        return { label: '功能建议', className: 'text-purple-400' };
      case 'general':
        return { label: '一般反馈', className: 'text-blue-400' };
      case 'support':
        return { label: '技术支持', className: 'text-green-400' };
      case 'other':
        return { label: '其他', className: 'text-gray-400' };
      default:
        return { label: type, className: 'text-gray-400' };
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const handleFeedbackClick = (feedback: Feedback) => {
    setSelectedFeedback(feedback);
  };

  const handleBack = () => {
    setSelectedFeedback(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <Navbar />
      
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">我的反馈</h1>
            <p className="text-gray-300 max-w-2xl mx-auto">
              查看您提交的反馈历史和管理员的回复情况
            </p>
          </div>

          {error && (
            <div className="mb-8 p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300">
              <div className="flex items-center">
                <AlertCircle size={20} className="mr-2" />
                <span>{error}</span>
                <button 
                  className="ml-auto text-red-300 hover:text-red-200"
                  onClick={() => setError('')}
                >
                  关闭
                </button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="text-center py-16">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent mb-4"></div>
              <p className="text-gray-300">加载反馈列表中...</p>
            </div>
          ) : selectedFeedback ? (
            // 反馈详情视图
            <div>
              <button 
                className="flex items-center text-blue-400 hover:text-blue-300 mb-6"
                onClick={handleBack}
              >
                <ChevronRight size={16} className="transform rotate-180 mr-1" />
                返回反馈列表
              </button>
              
              <div className="bg-white/5 rounded-xl p-8 border border-white/10">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">{selectedFeedback.subject}</h2>
                    <div className="flex items-center space-x-3">
                      <span className={`text-sm px-3 py-1 rounded-full border ${getStatusStyle(selectedFeedback.status).className}`}>
                        {getStatusStyle(selectedFeedback.status).label}
                      </span>
                      <span className={`text-sm ${getTypeLabel(selectedFeedback.type).className}`}>
                        {getTypeLabel(selectedFeedback.type).label}
                      </span>
                      <span className="text-sm text-gray-400">
                        {formatDate(selectedFeedback.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 用户反馈内容 */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold mb-3 flex items-center">
                    <MessageSquare size={18} className="mr-2 text-blue-400" />
                    您的反馈
                  </h3>
                  <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                    <p className="text-gray-300 whitespace-pre-wrap">
                      {selectedFeedback.message}
                    </p>
                  </div>
                </div>

                {/* 管理员回复 */}
                {selectedFeedback.reply || selectedFeedback.adminReply?.message ? (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center">
                      <MessageSquare size={18} className="mr-2 text-green-400" />
                      管理员回复
                    </h3>
                    <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                      <p className="text-gray-300 whitespace-pre-wrap">
                        {selectedFeedback.reply || selectedFeedback.adminReply?.message}
                      </p>
                      <div className="mt-4 text-right">
                        <span className="text-sm text-gray-400">
                          {selectedFeedback.adminReply?.repliedAt ? 
                            `回复时间: ${formatDate(selectedFeedback.adminReply.repliedAt)}` : 
                            `更新时间: ${formatDate(selectedFeedback.updatedAt)}`
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                    <p className="text-gray-400 text-center">
                      您的反馈正在处理中，我们将尽快回复您
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : feedbackList.length === 0 ? (
            // 空状态
            <div className="text-center py-16">
              <MessageSquare size={48} className="text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">暂无反馈记录</h3>
              <p className="text-gray-400 mb-6">
                您还没有提交任何反馈，如有问题请随时联系我们
              </p>
              <a 
                href="/contact-support"
                className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-all duration-300"
              >
                联系客服
                <ChevronRight size={16} className="ml-1" />
              </a>
            </div>
          ) : (
            // 反馈列表视图
            <div>
              <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                <div className="grid grid-cols-12 py-4 px-6 bg-white/10 font-semibold text-sm text-gray-300">
                  <div className="col-span-12 md:col-span-5">主题</div>
                  <div className="hidden md:block md:col-span-2">类型</div>
                  <div className="hidden md:block md:col-span-2">状态</div>
                  <div className="col-span-8 md:col-span-3">提交时间</div>
                </div>
                
                <div className="divide-y divide-white/5">
                  {feedbackList.map((feedback) => (
                    <div 
                      key={feedback._id}
                      className="grid grid-cols-12 py-4 px-6 hover:bg-white/5 cursor-pointer transition-colors duration-200"
                      onClick={() => handleFeedbackClick(feedback)}
                    >
                      <div className="col-span-12 md:col-span-5">
                        <div className="font-medium truncate" title={feedback.subject}>
                          {feedback.subject}
                        </div>
                        <div className="text-xs text-gray-400 truncate mt-1 hidden md:block">
                          {feedback.message.substring(0, 50)}...
                        </div>
                      </div>
                      <div className="hidden md:flex md:col-span-2 items-center">
                        <span className={`text-sm ${getTypeLabel(feedback.type).className}`}>
                          {getTypeLabel(feedback.type).label}
                        </span>
                      </div>
                      <div className="col-span-4 md:col-span-2 flex items-center">
                        <span className={`text-xs px-2 py-1 rounded-full border ${getStatusStyle(feedback.status).className}`}>
                          {getStatusStyle(feedback.status).label}
                        </span>
                      </div>
                      <div className="col-span-8 md:col-span-3 text-gray-400 text-sm">
                        {formatDate(feedback.createdAt)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
               
              <div className="mt-8 text-center">
                <a 
                  href="/contact-support"
                  className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-all duration-300"
                >
                  提交新反馈
                  <ChevronRight size={16} className="ml-1" />
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserFeedback;