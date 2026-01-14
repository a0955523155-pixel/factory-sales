import React, { useState, useEffect } from 'react';
import { Menu, X, Phone, Factory, Settings, Home } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

const Navbar = ({ phone }) => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
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

  // 新版選單結構 (只留這三個)
  const navLinks = [
    { name: '經典作品', path: '/works' },
    { name: '關於我們', path: '/about' },
    { name: '聯絡我們', path: '/contact' },
  ];

  return (
    <nav className="fixed w-full z-50 top-0 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 shadow-lg font-sans text-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-center h-20">
          
          <Link to="/" className="flex items-center gap-3 group">
            <div className="bg-orange-600 p-2 rounded-lg group-hover:bg-orange-500 transition duration-300">
              <Factory className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black tracking-widest uppercase flex items-center gap-2">
                {settings.siteName}
              </h1>
            </div>
          </Link>

          {/* 電腦版選單 */}
          <div className="hidden lg:flex items-center space-x-8 font-bold text-sm">
            <Link to="/" className="hover:text-orange-500 transition">首頁</Link>
            
            {navLinks.map((link, idx) => (
              <Link key={idx} to={link.path} className={`hover:text-orange-500 transition ${location.pathname === link.path ? 'text-orange-500' : ''}`}>
                {link.name}
              </Link>
            ))}
            
            <div className="w-px h-6 bg-slate-700 mx-2"></div>

            <a href={`tel:${settings.contactPhone}`} className="flex items-center gap-2 bg-white/10 hover:bg-orange-600 px-4 py-2 rounded-full transition group">
              <Phone size={16} className="group-hover:animate-bounce"/>
              <span className="tracking-wider">{settings.contactPhone}</span>
            </a>

            <Link to="/admin" className="text-slate-500 hover:text-white transition p-2" title="管理後台">
               <Settings size={20}/>
            </Link>
          </div>

          {/* 手機版按鈕 */}
          <div className="lg:hidden">
            <button onClick={() => setIsOpen(!isOpen)} className="text-white">
              {isOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>
      
      {/* 手機版選單 */}
      {isOpen && (
         <div className="lg:hidden bg-slate-900 border-t border-slate-800 absolute w-full left-0 shadow-xl p-4 flex flex-col gap-2 h-screen pb-32 overflow-y-auto">
            <Link to="/" className="block py-4 px-4 text-white font-bold border-b border-slate-800" onClick={() => setIsOpen(false)}>首頁</Link>
            {navLinks.map((link, idx) => (
              <Link key={idx} to={link.path} className="block py-4 px-4 text-white font-bold border-b border-slate-800" onClick={() => setIsOpen(false)}>
                {link.name}
              </Link>
            ))}
            
            <a href={`tel:${settings.contactPhone}`} className="block py-4 px-4 text-orange-500 font-bold mt-2 text-lg">
               撥打電話: {settings.contactPhone}
            </a>
            
            <Link to="/admin" className="block py-4 px-4 text-slate-500 font-bold mt-4 text-center border-t border-slate-800" onClick={() => setIsOpen(false)}>
               ⚙️ 管理員登入
            </Link>
         </div>
      )}
    </nav>
  );
};

export default Navbar;