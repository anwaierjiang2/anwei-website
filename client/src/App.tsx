import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// 用户端页面
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import CustomerServiceChat from './pages/CustomerServiceChat';
import UserFeedback from './pages/UserFeedback';
import ContactSupport from './pages/ContactSupport';
import AIChat from './pages/AIChat';
import ToolsList from './pages/ToolsList';
import ProductsList from './pages/ProductsList';
import ProductDetail from './pages/ProductDetail';

// 管理员端页面
import AdminLogin from './pages/AdminDashboard/AdminLogin';
import Dashboard from './pages/AdminDashboard/Dashboard';
import UsersManagement from './pages/AdminDashboard/UsersManagement';
import ToolsManagement from './pages/AdminDashboard/ToolsManagement';
import ProductsManagement from './pages/AdminDashboard/ProductsManagement';
import OrdersManagement from './pages/AdminDashboard/OrdersManagement';
import FeedbackManagement from './pages/AdminDashboard/FeedbackManagement';
import SettingsManagement from './pages/AdminDashboard/SettingsManagement';
import AdminCustomerService from './pages/AdminDashboard/AdminCustomerService';

// 通用组件
import Navbar from './components/Navbar';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // 检查用户登录状态
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        let token = null;
        let adminToken = null;
        
        // 安全地访问localStorage
        try {
          token = localStorage.getItem('userToken'); // 使用正确的token存储键名
          adminToken = localStorage.getItem('adminToken');
        } catch (storageError) {
          console.error('访问localStorage失败:', storageError);
        }
        
        // 检查用户登录状态
        if (token) {
          const response = await fetch('/api/auth/verify', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            setIsLoggedIn(true);
          }
        }
        
        // 检查管理员登录状态
        if (adminToken) {
          const adminResponse = await fetch('/api/auth/verify', {
            headers: {
              'Authorization': `Bearer ${adminToken}`
            }
          });
          
          if (adminResponse.ok) {
            setIsAdmin(true);
          }
        }
      } catch (error) {
        console.error('检查登录状态失败:', error);
      } finally {
        setLoading(false);
      }
    };

    checkLoginStatus();
  }, []);

  // 管理员认证路由组件
  const AdminRoute: React.FC<{ element: React.ReactNode }> = ({ element }) => {
    if (loading) {
      return <div className="min-h-screen flex items-center justify-center text-2xl">加载中...</div>;
    }
    
    if (!isAdmin) {
      return <Navigate to="/admin/login" replace />;
    }
    
    return <>{element}</>;
  };

  // 用户认证路由组件
  const ProtectedRoute: React.FC<{ element: React.ReactNode }> = ({ element }) => {
    if (loading) {
      return <div className="min-h-screen flex items-center justify-center text-2xl">加载中...</div>;
    }
    
    if (!isLoggedIn) {
      return <Navigate to="/login" replace />;
    }
    
    return <>{element}</>;
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-2xl">加载中...</div>;
  }

  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        {/* 用户端导航栏 - 仅在非管理员页面显示 */}
        {!isAdmin && <Navbar />}
        
        {/* 主内容区域 */}
        <main className="flex-grow">
          <Routes>
            {/* 用户端路由 */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/ai-chat" element={<AIChat />} />
            <Route path="/tools" element={<ToolsList />} />
            <Route path="/products" element={<ProductsList />} />
            <Route path="/products/:id" element={<ProductDetail />} />
            <Route path="/customer-service" element={<CustomerServiceChat />} />
            <Route path="/feedback" element={<UserFeedback />} />
            <Route path="/contact-support" element={<ContactSupport />} />
            
            {/* 管理员端路由 */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminRoute element={<Dashboard />} />} />
            <Route path="/admin/users" element={<AdminRoute element={<UsersManagement />} />} />
            <Route path="/admin/tools" element={<AdminRoute element={<ToolsManagement />} />} />
            <Route path="/admin/products" element={<AdminRoute element={<ProductsManagement />} />} />
            <Route path="/admin/orders" element={<AdminRoute element={<OrdersManagement />} />} />
            <Route path="/admin/feedback" element={<AdminRoute element={<FeedbackManagement />} />} />
            <Route path="/admin/settings" element={<AdminRoute element={<SettingsManagement />} />} />
            <Route path="/admin/customer-service" element={<AdminRoute element={<AdminCustomerService />} />} />
            
            {/* 404页面 */}
            <Route path="*" element={<div className="min-h-screen flex items-center justify-center text-2xl">页面不存在</div>} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;