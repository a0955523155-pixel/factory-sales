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
import { LogIn, Loader2 } from 'lucide-react';

// ★★★ 引入 Firebase Auth 驗證功能 ★★★
import { auth } from '../firebase'; 
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';

const Admin = () => {
  const navigate = useNavigate();
  const [isAuth, setIsAuth] = useState(false);
  const [loading, setLoading] = useState(true); // 增加讀取狀態，避免畫面閃爍
  const [loginForm, setLoginForm] = useState({ user: '', pass: '' });
  const [viewMode, setViewMode] = useState('dashboard');

  // ★★★ 改由 Firebase 官方隨時幫我們監聽登入狀態 ★★★
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAuth(true); // 擁有官方通行證
      } else {
        setIsAuth(false); // 被登出或無通行證
      }
      setLoading(false); // 驗證完畢，關閉讀取畫面
    });

    // 元件解除安裝時取消監聽
    return () => unsubscribe();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      // 貼心設計：如果您習慣只打帳號，系統自動幫您補齊成信箱格式
      const email = loginForm.user.includes('@') ? loginForm.user : `${loginForm.user}@greenbud.com`;
      
      // 去 Firebase 雲端驗證帳號密碼
      await signInWithEmailAndPassword(auth, email, loginForm.pass);
      // 成功的話，onAuthStateChanged 會自動把 isAuth 變成 true，瞬間切換畫面！
    } catch (error) {
      console.error("登入錯誤:", error);
      alert("帳號或密碼錯誤，或是您還沒在 Firebase 後台建立此帳號！");
    }
  };

  const handleLogout = async () => {
    if (window.confirm("確定要登出嗎？")) {
      await signOut(auth); // 呼叫 Firebase 官方登出
      navigate('/');
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-100">
        <Loader2 className="animate-spin text-orange-500" size={48} />
      </div>
    );
  }

  if (!isAuth) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-100 px-4">
        <form onSubmit={handleLogin} className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm border border-slate-200">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 text-white"><LogIn size={32}/></div>
            <h1 className="text-2xl font-black text-slate-900">綠芽管理員登入</h1>
          </div>
          <div className="space-y-4">
            <input type="text" placeholder="帳號 (例如: gst...)" value={loginForm.user} onChange={e=>setLoginForm({...loginForm, user:e.target.value})} className="w-full p-3 border rounded-xl bg-slate-50 focus:border-orange-500 outline-none" />
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