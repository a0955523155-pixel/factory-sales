import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/admin/Sidebar';
import DashboardPanel from '../components/admin/DashboardPanel';
import PropertyPanel from '../components/admin/PropertyPanel';
import ArticlePanel from '../components/admin/ArticlePanel';
import CustomerPanel from '../components/admin/CustomerPanel';
import SchedulePanel from '../components/admin/SchedulePanel';
import AboutPanel from '../components/admin/AboutPanel';
import SettingsPanel from '../components/admin/SettingsPanel';
import { LogIn } from 'lucide-react';

const Admin = () => {
  const navigate = useNavigate();
  const [isAuth, setIsAuth] = useState(false);
  const [loginForm, setLoginForm] = useState({ user: '', pass: '' });
  const [viewMode, setViewMode] = useState('dashboard');

  useEffect(() => {
    const storedAuth = localStorage.getItem('isAuth');
    if (storedAuth === 'true') setIsAuth(true);
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    if (loginForm.user === 'gst0800666738' && loginForm.pass === '0800666738') {
      setIsAuth(true);
      localStorage.setItem('isAuth', 'true');
    } else {
      alert("帳號或密碼錯誤");
    }
  };

  const handleLogout = () => {
    if (window.confirm("登出？")) {
      setIsAuth(false);
      localStorage.removeItem('isAuth');
      navigate('/');
    }
  };

  if (!isAuth) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-100 px-4">
        <form onSubmit={handleLogin} className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm border border-slate-200">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 text-white"><LogIn size={32}/></div>
            <h1 className="text-2xl font-black text-slate-900">綠芽管理員登入</h1>
          </div>
          <div className="space-y-4">
            <input type="text" placeholder="帳號" value={loginForm.user} onChange={e=>setLoginForm({...loginForm, user:e.target.value})} className="w-full p-3 border rounded-xl bg-slate-50 focus:border-orange-500 outline-none" />
            <input type="password" placeholder="密碼" value={loginForm.pass} onChange={e=>setLoginForm({...loginForm, pass:e.target.value})} className="w-full p-3 border rounded-xl bg-slate-50 focus:border-orange-500 outline-none" />
            <button type="submit" className="w-full bg-orange-600 text-white py-3 rounded-xl font-bold hover:bg-orange-700 transition shadow-lg">登入系統</button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-slate-100 text-slate-800 font-sans overflow-hidden">
      <Sidebar viewMode={viewMode} setViewMode={setViewMode} handleLogout={handleLogout} />
      
      <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden relative">
        {viewMode === 'dashboard' && <DashboardPanel />}
        {viewMode === 'properties' && <PropertyPanel />}
        {viewMode === 'articles' && <ArticlePanel />}
        {viewMode === 'customers' && <CustomerPanel />}
        {viewMode === 'schedule' && <SchedulePanel />}
        {viewMode === 'about' && <AboutPanel />}
        {viewMode === 'settings' && <SettingsPanel />}
      </div>
    </div>
  );
};

export default Admin;