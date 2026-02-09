import React from 'react';
import { LogOut, Layout, FileText, Users, Calendar as CalendarIcon, Building, Settings, BarChart3 } from 'lucide-react';

const Sidebar = ({ viewMode, setViewMode, handleLogout }) => {
  const menuItems = [
    { id: 'dashboard', label: '數據中心', icon: BarChart3 },
    { id: 'properties', label: '案場管理', icon: Layout },
    { id: 'articles', label: '文章管理', icon: FileText },
    { id: 'customers', label: '客戶資料', icon: Users },
    { id: 'schedule', label: '排班管理', icon: CalendarIcon },
    { id: 'about', label: '關於頁面', icon: Building },
    { id: 'settings', label: '網站設定', icon: Settings },
  ];

  return (
    <div className="w-full lg:w-64 bg-white border-b lg:border-b-0 lg:border-r border-slate-200 flex flex-col shrink-0">
      <div className="p-4 md:p-5 flex justify-between items-center lg:block">
        <h2 className="font-black text-xl text-slate-900 tracking-tight">綠芽管理員</h2>
        <button onClick={handleLogout} className="lg:hidden text-slate-400 hover:text-red-500"><LogOut size={20}/></button>
      </div>
      
      <div className="flex lg:flex-col gap-2 p-2 overflow-x-auto lg:overflow-visible scrollbar-hide">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setViewMode(item.id)}
            className={`flex-shrink-0 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition whitespace-nowrap ${
              viewMode === item.id ? 'bg-orange-50 text-orange-600' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <item.icon size={18} /> {item.label}
          </button>
        ))}
      </div>

      <div className="mt-auto p-4 hidden lg:block border-t border-slate-100">
        <button onClick={handleLogout} className="flex items-center gap-2 text-slate-400 hover:text-red-500 text-sm font-bold transition w-full px-4 py-2 hover:bg-red-50 rounded-xl">
          <LogOut size={18}/> 登出系統
        </button>
      </div>
    </div>
  );
};

export default Sidebar;