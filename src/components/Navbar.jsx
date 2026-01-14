import React, { useState, useEffect } from 'react';
import { Menu, X, Phone, Factory, Newspaper, GraduationCap, Trophy, Home, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

const Navbar = ({ phone }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState({
    siteName: "Factory Pro",
    contactPhone: phone || "0800-666-738"
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docSnap = await getDoc(doc(db, "settings", "global"));
        if (docSnap.exists()) setSettings(prev => ({...prev, ...docSnap.data()}));
      } catch(e) {}
    };
    fetchSettings();
  }, [phone]);

  const navLinks = [
    { name: '首頁', path: '/', icon: <Home size={18}/> },
    { name: '最新消息', path: '/news', icon: <Newspaper size={18}/> },
    { name: '房地產小學堂', path: '/academy', icon: <GraduationCap size={18}/> },
    { name: '成交案例', path: '/cases', icon: <Trophy size={18}/> },
  ];

  return (
    <nav className="fixed w-full z-50 top-0 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm font-sans">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-center h-20">
          
          <Link to="/" className="flex items-center gap-3 group">
            <div className="bg-slate-800 p-2 rounded-sm border-2 border-slate-600 group-hover:border-orange-500 group-hover:bg-slate-900 transition duration-300">
              <Factory className="text-orange-500 group-hover:text-white transition" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-widest uppercase flex items-center gap-2">
                {settings.siteName} <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
              </h1>
            </div>
          </Link>

          {/* 電腦 & 平板版選單 (大螢幕顯示) */}
          <div className="hidden lg:flex items-center space-x-6 font-bold text-sm">
            {navLinks.map((link) => (
              <Link key={link.path} to={link.path} className="flex items-center gap-2 text-slate-600 hover:text-orange-600 transition tracking-wider">
                {link.icon} {link.name}
              </Link>
            ))}
            
            {/* 撥打電話 */}
            <a href={`tel:${settings.contactPhone}`} className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2 rounded hover:bg-orange-600 transition duration-300 shadow-lg group ml-4">
              <Phone size={16} className="group-hover:animate-bounce"/>
              <span className="tracking-wider">{settings.contactPhone}</span>
            </a>

            {/* 後台入口 (全裝置顯示) */}
            <Link to="/admin" className="text-slate-400 hover:text-slate-800 p-2" title="管理後台">
               <Settings size={20}/>
            </Link>
          </div>

          {/* 手機版漢堡按鈕 (小螢幕顯示) */}
          <div className="lg:hidden">
            <button onClick={() => setIsOpen(!isOpen)} className="text-slate-800">
              {isOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>
      
      {/* 手機版下拉選單 */}
      {isOpen && (
         <div className="lg:hidden bg-white border-t border-slate-100 absolute w-full left-0 shadow-xl p-4 flex flex-col gap-2 h-screen pb-32 overflow-y-auto">
            {navLinks.map((link) => (
              <Link key={link.path} to={link.path} className="flex items-center gap-3 py-4 px-4 text-slate-800 font-bold hover:bg-slate-50 rounded text-lg border-b border-slate-50" onClick={() => setIsOpen(false)}>
                {link.icon} {link.name}
              </Link>
            ))}
            <a href={`tel:${settings.contactPhone}`} className="block py-4 px-4 text-orange-600 font-bold mt-2 text-lg">撥打電話: {settings.contactPhone}</a>
            
            {/* 手機版後台入口 */}
            <Link to="/admin" className="flex items-center gap-3 py-4 px-4 text-slate-400 font-bold hover:bg-slate-50 rounded mt-4 border-t border-slate-100" onClick={() => setIsOpen(false)}>
               <Settings size={18}/> 管理員登入
            </Link>
         </div>
      )}
    </nav>
  );
};

export default Navbar;