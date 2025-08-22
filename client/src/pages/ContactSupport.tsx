import React, { useState } from 'react';
import { AlertCircle, CheckCircle, Send, Phone, Mail, MessageCircle, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

const ContactSupport: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          type: 'support' // 标记为客服支持类型
        })
      });

      if (!response.ok) {
        throw new Error('发送失败，请稍后重试');
      }

      const data = await response.json();
      setSuccess(data.message);
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: ''
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : '发送失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <Navbar />
      
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold mb-4">联系客服</h1>
            <p className="text-gray-300 text-xl max-w-2xl mx-auto">
              如有任何问题或建议，请随时与我们联系。我们将在24小时内回复您。
            </p>
          </div>

          {/* 联系方式卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white/5 rounded-xl p-6 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all duration-300">
              <Phone className="text-blue-400 mb-4" size={28} />
              <h3 className="text-lg font-semibold mb-2">电话咨询</h3>
              <p className="text-gray-400">工作日 9:00-18:00</p>
              <p className="text-white text-xl mt-4">400-123-4567</p>
            </div>

            <div className="bg-white/5 rounded-xl p-6 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all duration-300">
              <Mail className="text-blue-400 mb-4" size={28} />
              <h3 className="text-lg font-semibold mb-2">电子邮件</h3>
              <p className="text-gray-400">工作时间内2小时回复</p>
              <p className="text-white text-xl mt-4">support@anwei.com</p>
            </div>

            <div className="bg-white/5 rounded-xl p-6 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all duration-300">
              <MessageCircle className="text-blue-400 mb-4" size={28} />
              <h3 className="text-lg font-semibold mb-2">在线客服</h3>
              <p className="text-gray-400">工作日 9:00-22:00</p>
              <a href="/customer-service" className="inline-block mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors">
                立即咨询
              </a>
            </div>
          </div>

          {/* 客服表单 */}
          <div className="bg-white/5 rounded-xl p-8 border border-white/10 backdrop-blur-sm">
            <h2 className="text-2xl font-bold mb-6 text-center">发送消息</h2>
            
            {error && (
              <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300">
                <div className="flex items-center">
                  <AlertCircle size={20} className="mr-2" />
                  <span>{error}</span>
                </div>
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 bg-green-500/20 border border-green-500/30 rounded-lg text-green-300">
                <div className="flex items-center">
                  <CheckCircle size={20} className="mr-2" />
                  <span>{success}</span>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-gray-300 mb-2">
                    您的姓名 <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="请输入您的姓名"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-gray-300 mb-2">
                    电子邮箱 <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="请输入您的电子邮箱"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="subject" className="block text-gray-300 mb-2">
                  主题 <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="请输入消息主题"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-gray-300 mb-2">
                  消息内容 <span className="text-red-400">*</span>
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={8}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="请详细描述您的问题或建议..."
                  value={formData.message}
                  onChange={handleChange}
                  required
                ></textarea>
              </div>

              <div className="flex justify-center">
                <button
                  type="submit"
                  className={`w-full max-w-md flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-all duration-300 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                  disabled={loading}
                >
                  {loading ? (
                    <span>发送中...</span>
                  ) : (
                    <>
                      发送消息
                      <Send size={18} className="ml-2" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* 常见问题部分 */}
          <div className="mt-16">
            <h2 className="text-2xl font-bold mb-8 text-center">常见问题</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white/5 rounded-lg p-5 border border-white/10">
                <h3 className="font-semibold mb-2">如何重置密码？</h3>
                <p className="text-gray-400 text-sm">在登录页面点击"忘记密码"，按提示操作即可重置密码。</p>
              </div>
              <div className="bg-white/5 rounded-lg p-5 border border-white/10">
                <h3 className="font-semibold mb-2">购买后如何获取产品？</h3>
                <p className="text-gray-400 text-sm">购买成功后，您将收到邮件通知，包含产品下载链接和使用说明。</p>
              </div>
              <div className="bg-white/5 rounded-lg p-5 border border-white/10">
                <h3 className="font-semibold mb-2">如何更新个人信息？</h3>
                <p className="text-gray-400 text-sm">登录后，在"个人中心"页面可以更新您的个人信息。</p>
              </div>
              <div className="bg-white/5 rounded-lg p-5 border border-white/10">
                <h3 className="font-semibold mb-2">技术支持时间？</h3>
                <p className="text-gray-400 text-sm">工作日 9:00-18:00，周末及节假日有值班人员处理紧急问题。</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactSupport;