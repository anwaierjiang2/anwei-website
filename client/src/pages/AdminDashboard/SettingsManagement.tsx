import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PieChart, Search, ChevronDown, Users, BarChart, Wrench, ShoppingBag, MessageCircle, Settings, LogOut, Bell, AlertCircle, CheckCircle, XCircle, Shield, RefreshCw, Eye, EyeOff, Save, Info, Mail, Server, Database, Lock, UserPlus, Terminal, Zap, Cpu, FileText } from 'lucide-react';

// 定义系统设置类型
interface SystemSettings {
  siteName: string;
  siteDescription: string;
  siteLogo?: string;
  contactEmail: string;
  maintenanceMode: boolean;
  maxUploadSize: number;
  cacheDuration: number;
  rateLimit: {
    enabled: boolean;
    requests: number;
    interval: number;
  };
  security: {
    passwordPolicy: {
      minLength: number;
      requireUppercase: boolean;
      requireLowercase: boolean;
      requireNumber: boolean;
      requireSpecial: boolean;
    };
    twoFactorAuth: boolean;
  };
  notification: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
}

// 定义系统信息类型
interface SystemInfo {
  version: string;
  uptime: string;
  nodeVersion: string;
  memoryUsage: string;
  cpuUsage: string;
  database: {
    type: string;
    version: string;
    status: 'connected' | 'disconnected' | 'error';
    connectionTime: string;
  };
  apiCalls: number;
  activeUsers: number;
  storageUsed: string;
  storageTotal: string;
}

// 定义备份类型
interface Backup {
  id: string;
  name: string;
  date: string;
  size: string;
  type: 'manual' | 'scheduled';
  status: 'completed' | 'failed' | 'in_progress';
}

const SettingsManagement: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettings>({
    siteName: 'anwei网站',
    siteDescription: '这是一个管理后台系统',
    contactEmail: 'admin@anwei.com',
    maintenanceMode: false,
    maxUploadSize: 20,
    cacheDuration: 3600,
    rateLimit: {
      enabled: true,
      requests: 100,
      interval: 60
    },
    security: {
      passwordPolicy: {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumber: true,
        requireSpecial: true
      },
      twoFactorAuth: false
    },
    notification: {
      email: true,
      sms: false,
      push: false
    }
  });
  
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [backups, setBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('general');
  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [backupStatus, setBackupStatus] = useState<'idle' | 'backing-up' | 'restoring'>('idle');
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

  // 加载系统设置
  const loadSettings = async () => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/admin/settings', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '获取系统设置失败');
      }

      // 确保settings对象包含完整的notification对象和email字段
      const updatedSettings = {
        ...settings, // 先使用现有的settings作为基础
        ...data,     // 然后覆盖从服务器返回的数据
        notification: {
          email: data?.notification?.email ?? (settings?.notification?.email ?? true),
          sms: data?.notification?.sms ?? (settings?.notification?.sms ?? false),
          push: data?.notification?.push ?? (settings?.notification?.push ?? false)
        }
      };

      setSettings(updatedSettings);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取系统设置失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 加载系统信息
  const loadSystemInfo = async () => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }

    try {
      const response = await fetch('/api/admin/system-info', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '获取系统信息失败');
      }

      setSystemInfo(data);
    } catch (err) {
      console.error('获取系统信息错误:', err);
      // 不设置错误状态，因为这不是核心功能
    }
  };

  // 加载备份列表
  const loadBackups = async () => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }

    try {
      const response = await fetch('/api/admin/backups', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '获取备份列表失败');
      }

      setBackups(data.backups);
    } catch (err) {
      console.error('获取备份列表错误:', err);
      // 不设置错误状态，因为这不是核心功能
    }
  };

  // 保存系统设置
  const saveSettings = async () => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }

    try {
      setIsSaving(true);
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '保存系统设置失败');
      }

      setSettings(data);
      setError('');
      // 这里可以添加成功提示
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存系统设置失败，请稍后重试');
      setTimeout(() => setError(''), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  // 更改管理员密码
  const changePassword = async () => {
    if (!newPassword || newPassword !== confirmPassword) {
      setError('密码不能为空或两次输入的密码不一致');
      setTimeout(() => setError(''), 3000);
      return;
    }

    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }

    try {
      setIsSaving(true);
      const response = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ newPassword })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '更改密码失败');
      }

      // 重置密码输入框
      setNewPassword('');
      setConfirmPassword('');
      setError('');
      // 这里可以添加成功提示
    } catch (err) {
      setError(err instanceof Error ? err.message : '更改密码失败，请稍后重试');
      setTimeout(() => setError(''), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  // 创建备份
  const createBackup = async () => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }

    try {
      setBackupStatus('backing-up');
      const response = await fetch('/api/admin/backups/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '创建备份失败');
      }

      // 重新加载备份列表
      await loadBackups();
      setError('');
      // 这里可以添加成功提示
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建备份失败，请稍后重试');
      setTimeout(() => setError(''), 3000);
    } finally {
      setBackupStatus('idle');
    }
  };

  // 恢复备份
  const restoreBackup = async (backupId: string) => {
    if (!window.confirm('确定要恢复此备份吗？这将覆盖当前所有数据！')) {
      return;
    }

    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }

    try {
      setBackupStatus('restoring');
      const response = await fetch(`/api/admin/backups/${backupId}/restore`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '恢复备份失败');
      }

      setError('');
      // 这里可以添加成功提示
    } catch (err) {
      setError(err instanceof Error ? err.message : '恢复备份失败，请稍后重试');
      setTimeout(() => setError(''), 3000);
    } finally {
      setBackupStatus('idle');
    }
  };

  // 删除备份
  const deleteBackup = async (backupId: string) => {
    if (!window.confirm('确定要删除此备份吗？此操作无法撤销！')) {
      return;
    }

    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }

    try {
      const response = await fetch(`/api/admin/backups/${backupId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '删除备份失败');
      }

      // 更新备份列表
      setBackups(prevBackups => prevBackups.filter(backup => backup.id !== backupId));
      setError('');
      // 这里可以添加成功提示
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除备份失败，请稍后重试');
      setTimeout(() => setError(''), 3000);
    }
  };

  // 初始化页面
  useEffect(() => {
    checkAuth();
    loadSettings();
    loadSystemInfo();
    loadBackups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 生成导航链接
  const NavLink = ({ path, icon, label }: { path: string; icon: React.ReactNode; label: string }) => {
    const isActive = path === '/admin/settings';
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

  // 渲染设置选项卡
  const renderSettingsTab = () => {
    switch (activeTab) {
      case 'general':
        return renderGeneralSettings();
      case 'security':
        return renderSecuritySettings();
      case 'performance':
        return renderPerformanceSettings();
      case 'backup':
        return renderBackupSettings();
      case 'users':
        return renderUserManagementSettings();
      default:
        return renderGeneralSettings();
    }
  };

  // 渲染通用设置
  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10">
        <h3 className="text-lg font-semibold mb-4">网站信息</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">网站名称</label>
              <input
                type="text"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={settings.siteName}
                onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">联系邮箱</label>
              <input
                type="email"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={settings.contactEmail}
                onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">网站描述</label>
            <textarea
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[100px]"
              value={settings.siteDescription}
              onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
            ></textarea>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="maintenanceMode"
              className="h-4 w-4 text-blue-600 border-white/10 rounded focus:ring-blue-500"
              checked={settings.maintenanceMode}
              onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
            />
            <label htmlFor="maintenanceMode" className="ml-2 block text-sm text-gray-300">
              维护模式
              <span className="ml-2 text-gray-400 text-xs">开启后，网站将进入维护状态，普通用户无法访问</span>
            </label>
          </div>
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10">
        <h3 className="text-lg font-semibold mb-4">通知设置</h3>
        <div className="space-y-3">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="emailNotifications"
              className="h-4 w-4 text-blue-600 border-white/10 rounded focus:ring-blue-500"
              checked={settings.notification.email}
              onChange={(e) => setSettings({
                ...settings,
                notification: {
                  ...settings.notification,
                  email: e.target.checked
                }
              })}
            />
            <label htmlFor="emailNotifications" className="ml-2 block text-sm text-gray-300">
              邮件通知
            </label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="smsNotifications"
              className="h-4 w-4 text-blue-600 border-white/10 rounded focus:ring-blue-500"
              checked={settings.notification.sms}
              onChange={(e) => setSettings({
                ...settings,
                notification: {
                  ...settings.notification,
                  sms: e.target.checked
                }
              })}
            />
            <label htmlFor="smsNotifications" className="ml-2 block text-sm text-gray-300">
              SMS 通知
            </label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="pushNotifications"
              className="h-4 w-4 text-blue-600 border-white/10 rounded focus:ring-blue-500"
              checked={settings.notification.push}
              onChange={(e) => setSettings({
                ...settings,
                notification: {
                  ...settings.notification,
                  push: e.target.checked
                }
              })}
            />
            <label htmlFor="pushNotifications" className="ml-2 block text-sm text-gray-300">
              推送通知
            </label>
          </div>
        </div>
      </div>
    </div>
  );

  // 渲染安全设置
  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10">
        <h3 className="text-lg font-semibold mb-4">密码策略</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">最小密码长度</label>
            <input
              type="number"
              min="6"
              max="32"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={settings.security.passwordPolicy.minLength}
              onChange={(e) => setSettings({
                ...settings,
                security: {
                  ...settings.security,
                  passwordPolicy: {
                    ...settings.security.passwordPolicy,
                    minLength: parseInt(e.target.value) || 8
                  }
                }
              })}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="requireUppercase"
                className="h-4 w-4 text-blue-600 border-white/10 rounded focus:ring-blue-500"
                checked={settings.security.passwordPolicy.requireUppercase}
                onChange={(e) => setSettings({
                  ...settings,
                  security: {
                    ...settings.security,
                    passwordPolicy: {
                      ...settings.security.passwordPolicy,
                      requireUppercase: e.target.checked
                    }
                  }
                })}
              />
              <label htmlFor="requireUppercase" className="ml-2 block text-sm text-gray-300">
                要求大写字母
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="requireLowercase"
                className="h-4 w-4 text-blue-600 border-white/10 rounded focus:ring-blue-500"
                checked={settings.security.passwordPolicy.requireLowercase}
                onChange={(e) => setSettings({
                  ...settings,
                  security: {
                    ...settings.security,
                    passwordPolicy: {
                      ...settings.security.passwordPolicy,
                      requireLowercase: e.target.checked
                    }
                  }
                })}
              />
              <label htmlFor="requireLowercase" className="ml-2 block text-sm text-gray-300">
                要求小写字母
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="requireNumber"
                className="h-4 w-4 text-blue-600 border-white/10 rounded focus:ring-blue-500"
                checked={settings.security.passwordPolicy.requireNumber}
                onChange={(e) => setSettings({
                  ...settings,
                  security: {
                    ...settings.security,
                    passwordPolicy: {
                      ...settings.security.passwordPolicy,
                      requireNumber: e.target.checked
                    }
                  }
                })}
              />
              <label htmlFor="requireNumber" className="ml-2 block text-sm text-gray-300">
                要求数字
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="requireSpecial"
                className="h-4 w-4 text-blue-600 border-white/10 rounded focus:ring-blue-500"
                checked={settings.security.passwordPolicy.requireSpecial}
                onChange={(e) => setSettings({
                  ...settings,
                  security: {
                    ...settings.security,
                    passwordPolicy: {
                      ...settings.security.passwordPolicy,
                      requireSpecial: e.target.checked
                    }
                  }
                })}
              />
              <label htmlFor="requireSpecial" className="ml-2 block text-sm text-gray-300">
                要求特殊字符
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10">
        <h3 className="text-lg font-semibold mb-4">认证设置</h3>
        <div className="space-y-3">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="twoFactorAuth"
              className="h-4 w-4 text-blue-600 border-white/10 rounded focus:ring-blue-500"
              checked={settings.security.twoFactorAuth}
              onChange={(e) => setSettings({
                ...settings,
                security: {
                  ...settings.security,
                  twoFactorAuth: e.target.checked
                }
              })}
            />
            <label htmlFor="twoFactorAuth" className="ml-2 block text-sm text-gray-300">
              双因素认证
              <span className="ml-2 text-gray-400 text-xs">开启后，所有用户登录时需要进行双因素认证</span>
            </label>
          </div>
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10">
        <h3 className="text-lg font-semibold mb-4">修改管理员密码</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">新密码</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 pr-10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="请输入新密码"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">确认新密码</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 pr-10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="请再次输入新密码"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <button
            onClick={changePassword}
            className={`flex items-center px-4 py-2 rounded-lg transition-colors duration-200 ${newPassword && newPassword === confirmPassword ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-700 cursor-not-allowed'} ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={(!newPassword || newPassword !== confirmPassword) || isSaving}
          >
            {isSaving ? (
              <RefreshCw size={16} className="mr-2 animate-spin" />
            ) : (
              <Save size={16} className="mr-2" />
            )}
            更改密码
          </button>
        </div>
      </div>
    </div>
  );

  // 渲染性能设置
  const renderPerformanceSettings = () => (
    <div className="space-y-6">
      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10">
        <h3 className="text-lg font-semibold mb-4">上传设置</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">最大上传文件大小 (MB)</label>
            <input
              type="number"
              min="1"
              max="100"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={settings.maxUploadSize}
              onChange={(e) => setSettings({ ...settings, maxUploadSize: parseInt(e.target.value) || 20 })}
            />
          </div>
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10">
        <h3 className="text-lg font-semibold mb-4">缓存设置</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">缓存持续时间 (秒)</label>
            <input
              type="number"
              min="0"
              max="86400"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={settings.cacheDuration}
              onChange={(e) => setSettings({ ...settings, cacheDuration: parseInt(e.target.value) || 3600 })}
            />
            <p className="mt-1 text-xs text-gray-400">设置为0禁用缓存</p>
          </div>
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10">
        <h3 className="text-lg font-semibold mb-4">速率限制</h3>
        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="rateLimitEnabled"
              className="h-4 w-4 text-blue-600 border-white/10 rounded focus:ring-blue-500"
              checked={settings.rateLimit.enabled}
              onChange={(e) => setSettings({
                ...settings,
                rateLimit: {
                  ...settings.rateLimit,
                  enabled: e.target.checked
                }
              })}
            />
            <label htmlFor="rateLimitEnabled" className="ml-2 block text-sm text-gray-300">
              启用速率限制
            </label>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">最大请求数</label>
              <input
                type="number"
                min="1"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={settings.rateLimit.requests}
                onChange={(e) => setSettings({
                  ...settings,
                  rateLimit: {
                    ...settings.rateLimit,
                    requests: parseInt(e.target.value) || 100
                  }
                })}
                disabled={!settings.rateLimit.enabled}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">时间间隔 (秒)</label>
              <input
                type="number"
                min="1"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={settings.rateLimit.interval}
                onChange={(e) => setSettings({
                  ...settings,
                  rateLimit: {
                    ...settings.rateLimit,
                    interval: parseInt(e.target.value) || 60
                  }
                })}
                disabled={!settings.rateLimit.enabled}
              />
            </div>
          </div>
        </div>
      </div>

      {systemInfo && (
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10">
          <h3 className="text-lg font-semibold mb-4">系统信息</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div>
                <p className="text-xs text-gray-500">系统版本</p>
                <p className="text-white">{systemInfo.version}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Node.js 版本</p>
                <p className="text-white">{systemInfo.nodeVersion}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">系统运行时间</p>
                <p className="text-white">{systemInfo.uptime}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">API 调用数</p>
                <p className="text-white">{systemInfo.apiCalls}</p>
              </div>
            </div>
            <div className="space-y-2">
              <div>
                <p className="text-xs text-gray-500">内存使用</p>
                <p className="text-white">{systemInfo.memoryUsage}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">CPU 使用率</p>
                <p className="text-white">{systemInfo.cpuUsage}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">存储使用</p>
                <p className="text-white">{systemInfo.storageUsed} / {systemInfo.storageTotal}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">活动用户</p>
                <p className="text-white">{systemInfo.activeUsers}</p>
              </div>
            </div>
          </div>
          {systemInfo.database && (
            <div className="mt-4 p-3 bg-gray-800/50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-300 mb-2 flex items-center">
                <Database size={16} className="mr-2" />
                数据库信息
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                  <p className="text-xs text-gray-500">类型</p>
                  <p className="text-white">{systemInfo.database.type}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">版本</p>
                  <p className="text-white">{systemInfo.database.version}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">状态</p>
                  <p className={`text-sm ${systemInfo.database.status === 'connected' ? 'text-green-400' : systemInfo.database.status === 'error' ? 'text-red-400' : 'text-yellow-400'}`}>
                    {systemInfo.database.status === 'connected' ? '已连接' : systemInfo.database.status === 'error' ? '连接错误' : '未连接'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">连接时间</p>
                  <p className="text-white">{systemInfo.database.connectionTime}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  // 渲染备份设置
  const renderBackupSettings = () => (
    <div className="space-y-6">
      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">备份管理</h3>
          <button
            onClick={createBackup}
            className={`flex items-center px-4 py-2 rounded-lg transition-colors duration-200 ${backupStatus === 'backing-up' ? 'bg-gray-700 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
            disabled={backupStatus === 'backing-up' || backupStatus === 'restoring'}
          >
            {backupStatus === 'backing-up' ? (
              <RefreshCw size={16} className="mr-2 animate-spin" />
            ) : (
              <FileText size={16} className="mr-2" />
            )}
            创建备份
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="py-2 px-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">名称</th>
                <th className="py-2 px-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">日期</th>
                <th className="py-2 px-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">大小</th>
                <th className="py-2 px-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">类型</th>
                <th className="py-2 px-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">状态</th>
                <th className="py-2 px-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {backups.length > 0 ? (
                backups.map((backup) => (
                  <tr key={backup.id} className="hover:bg-white/5 transition-colors duration-200">
                    <td className="py-3 px-3 whitespace-nowrap text-sm text-white">{backup.name}</td>
                    <td className="py-3 px-3 whitespace-nowrap text-sm text-gray-400">{backup.date}</td>
                    <td className="py-3 px-3 whitespace-nowrap text-sm text-gray-300">{backup.size}</td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 text-xs rounded-full ${backup.type === 'manual' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'}`}>
                        {backup.type === 'manual' ? '手动' : '自动'}
                      </span>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 text-xs rounded-full ${backup.status === 'completed' ? 'bg-green-500/20 text-green-400' : backup.status === 'failed' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                        {backup.status === 'completed' ? '已完成' : backup.status === 'failed' ? '失败' : '进行中'}
                      </span>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        onClick={() => restoreBackup(backup.id)}
                        className={`mr-2 px-2 py-1 text-xs rounded-lg transition-colors duration-200 ${(backupStatus === 'idle' && backup.status === 'completed') ? 'bg-green-600/20 text-green-400 hover:bg-green-600/30' : 'bg-gray-700/20 text-gray-400 cursor-not-allowed'}`}
                        disabled={backupStatus !== 'idle' || backup.status !== 'completed'}
                      >
                        恢复
                      </button>
                      <button 
                        onClick={() => deleteBackup(backup.id)}
                        className={`px-2 py-1 text-xs rounded-lg transition-colors duration-200 ${(backupStatus === 'idle' && backup.status === 'completed') ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30' : 'bg-gray-700/20 text-gray-400 cursor-not-allowed'}`}
                        disabled={backupStatus !== 'idle' || backup.status !== 'completed'}
                      >
                        删除
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-6 px-3 text-center text-gray-400">
                    暂无备份记录
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/20">
        <div className="flex items-start">
          <Info size={20} className="text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-medium text-blue-400">备份提示</h4>
            <p className="mt-1 text-sm text-blue-100">
              定期备份可以保护您的数据免受意外丢失。建议至少每周创建一次备份，并将重要备份存储在安全的离线位置。
              恢复备份将会覆盖当前所有数据，请谨慎操作。
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  // 渲染用户管理设置
  const renderUserManagementSettings = () => (
    <div className="space-y-6">
      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10">
        <h3 className="text-lg font-semibold mb-4">管理员用户</h3>
        <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg mb-4">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-sm font-medium">A</div>
            <div className="ml-3">
              <p className="text-white font-medium">anwei_admin</p>
              <p className="text-gray-400 text-sm">admin@anwei.com</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <button className="px-3 py-1 text-sm rounded-lg bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 transition-colors duration-200">
              编辑
            </button>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors duration-200">
            <UserPlus size={16} className="mr-2" />
            <span>添加管理员</span>
          </button>
          <div className="text-gray-400 text-sm ml-2">
            最多可添加5个管理员账户
          </div>
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10">
        <h3 className="text-lg font-semibold mb-4">用户管理</h3>
        <div className="space-y-3">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="autoApproveUsers"
              className="h-4 w-4 text-blue-600 border-white/10 rounded focus:ring-blue-500"
              defaultChecked={true}
            />
            <label htmlFor="autoApproveUsers" className="ml-2 block text-sm text-gray-300">
              自动批准新用户注册
            </label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="userRegistrationEnabled"
              className="h-4 w-4 text-blue-600 border-white/10 rounded focus:ring-blue-500"
              defaultChecked={true}
            />
            <label htmlFor="userRegistrationEnabled" className="ml-2 block text-sm text-gray-300">
              启用用户注册
            </label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="requireEmailVerification"
              className="h-4 w-4 text-blue-600 border-white/10 rounded focus:ring-blue-500"
              defaultChecked={true}
            />
            <label htmlFor="requireEmailVerification" className="ml-2 block text-sm text-gray-300">
              要求邮箱验证
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">默认用户角色</label>
            <select
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              defaultValue="user"
            >
              <option value="user">普通用户</option>
              <option value="premium">高级用户</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10">
        <h3 className="text-lg font-semibold mb-4">用户清理</h3>
        <div className="space-y-3">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="autoCleanInactiveUsers"
              className="h-4 w-4 text-blue-600 border-white/10 rounded focus:ring-blue-500"
              defaultChecked={false}
            />
            <label htmlFor="autoCleanInactiveUsers" className="ml-2 block text-sm text-gray-300">
              自动清理不活跃用户
            </label>
          </div>
          <div className="ml-6">
            <label className="block text-sm font-medium text-gray-300 mb-1">不活跃期限 (天)</label>
            <select
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              defaultValue="180"
            >
              <option value="30">30天</option>
              <option value="90">90天</option>
              <option value="180">180天</option>
              <option value="365">365天</option>
            </select>
            <p className="mt-1 text-xs text-gray-400">清理前将发送通知邮件提醒用户</p>
          </div>
        </div>
      </div>
    </div>
  );

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
              <Settings className="mr-2 text-blue-500" size={20} />
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
              <h1 className="text-2xl font-bold">系统设置</h1>
              <p className="text-gray-400">配置系统参数和偏好</p>
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

          {/* 设置标签导航 */}
          <div className="mb-6 border-b border-white/10">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab('general')}
                className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${activeTab === 'general' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:text-white hover:border-white/20'}`}
              >
                <div className="flex items-center">
                  <Info size={16} className="mr-2" />
                  通用设置
                </div>
              </button>
              <button
                onClick={() => setActiveTab('security')}
                className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${activeTab === 'security' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:text-white hover:border-white/20'}`}
              >
                <div className="flex items-center">
                  <Shield size={16} className="mr-2" />
                  安全设置
                </div>
              </button>
              <button
                onClick={() => setActiveTab('performance')}
                className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${activeTab === 'performance' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:text-white hover:border-white/20'}`}
              >
                <div className="flex items-center">
                  <Zap size={16} className="mr-2" />
                  性能设置
                </div>
              </button>
              <button
                onClick={() => setActiveTab('backup')}
                className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${activeTab === 'backup' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:text-white hover:border-white/20'}`}
              >
                <div className="flex items-center">
                  <FileText size={16} className="mr-2" />
                  备份管理
                </div>
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${activeTab === 'users' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:text-white hover:border-white/20'}`}
              >
                <div className="flex items-center">
                  <Users size={16} className="mr-2" />
                  用户管理
                </div>
              </button>
            </nav>
          </div>

          {/* 设置内容 */}
          <div className="space-y-6">
            {renderSettingsTab()}
          </div>

          {/* 保存按钮 - 不在密码修改和备份管理页面显示 */}
          {activeTab !== 'backup' && activeTab !== 'users' && (
            <div className="mt-8 flex justify-end">
              <button
                onClick={saveSettings}
                className={`flex items-center px-6 py-2.5 rounded-lg transition-colors duration-200 ${isSaving ? 'bg-gray-700 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                disabled={isSaving}
              >
                {isSaving ? (
                  <RefreshCw size={16} className="mr-2 animate-spin" />
                ) : (
                  <Save size={16} className="mr-2" />
                )}
                保存设置
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsManagement;