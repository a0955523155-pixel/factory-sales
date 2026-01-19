import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Phone, ChevronDown, Lock, UserCog } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [mobileExpand, setMobileExpand] = useState(null);
  
  const [settings, setSettings] = useState({ siteName: "Factory Pro", contactPhone: "0800-666-738" });
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docSnap = await getDoc(doc(db, "settings", "global"));
        if (docSnap.exists()) setSettings(docSnap.data());
      } catch (e) {}
    };
    fetchSettings();
  }, []);

  const links = [
    { name: '首頁', path: '/' },
    { 
      name: '最新動態', 
      path: '#', 
      submenu: [
        { name: '本地新聞', path: '/news/local' },
        { name: '新案消息', path: '/news/project' }
      ]
    },
    { name: '經典作品', path: '/works' },
    { name: '關於我們', path: '/about' },
    { name: '聯絡諮詢', path: '/contact' },
  ];

  const isHome = location.pathname === '/';
  const isTransparent = isHome && !scrolled;
  const bgClass = isTransparent ? "bg-transparent border-transparent" : "bg-white/95 backdrop-blur-md shadow-sm border-slate-200";
  const textColorClass = isTransparent ? "text-white drop-shadow-md" : "text-slate-900";
  const hoverColorClass = isTransparent ? "hover:text-orange-300" : "hover:text-orange-600";
  const activeColorClass = isTransparent ? "text-orange-300" : "text-orange-600";

  const handleLinkClick = () => {
    setIsOpen(false);
    setMobileExpand(null);
    setActiveDropdown(null);
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${bgClass}`}>
      <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
        <Link to="/" className={`text-2xl font-black tracking-tighter flex items-center gap-2 ${textColorClass}`} onClick={handleLinkClick}>
          {settings.siteName}
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {links.map((link) => (
            <div 
              key={link.name} 
              className="relative group h-20 flex items-center"
              onMouseEnter={() => setActiveDropdown(link.name)}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <Link 
                to={link.path} 
                className={`text-sm font-bold uppercase tracking-wider flex items-center gap-1 transition ${textColorClass} ${hoverColorClass} ${location.pathname.startsWith(link.path) && link.path !== '/' ? activeColorClass : ''}`}
                onClick={link.submenu ? (e) => e.preventDefault() : undefined}
              >
                {link.name}
                {link.submenu && <ChevronDown size={14} className={`transition-transform duration-200 ${activeDropdown === link.name ? 'rotate-180' : ''}`}/>}
              </Link>

              {link.submenu && (
                <div className={`absolute top-16 left-1/2 -translate-x-1/2 w-40 bg-white shadow-xl rounded-xl border border-slate-100 overflow-hidden transition-all duration-200 origin-top ${activeDropdown === link.name ? 'opacity-100 scale-100 visible translate-y-0' : 'opacity-0 scale-95 invisible -translate-y-2'}`}>
                  {link.submenu.map((sub) => (
                    <Link 
                      key={sub.name} 
                      to={sub.path} 
                      className="block px-4 py-3 text-sm font-bold text-slate-600 hover:bg-orange-50 hover:text-orange-600 transition text-center border-b border-slate-50 last:border-none"
                      onClick={() => setActiveDropdown(null)}
                    >
                      {sub.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
          
          <a href={`tel:${settings.contactPhone}`} className="bg-orange-600 text-white px-5 py-2.5 rounded-full text-sm font-bold hover:bg-orange-700 transition shadow-lg flex items-center gap-2">
            <Phone size={16} fill="currentColor" /> {settings.contactPhone}
          </a>

          {/* 修改這裡：title 改為 "管理員登入" */}
          <Link to="/admin" className={`p-2 rounded-full transition hover:bg-white/20 ${textColorClass}`} title="管理員登入">
            <UserCog size={20} />
          </Link>
        </div>

        <button onClick={() => setIsOpen(!isOpen)} className={`md:hidden p-2 ${textColorClass}`}>
          {isOpen ? <X size={28} className="text-slate-900" /> : <Menu size={28} />}
        </button>
      </div>

      {isOpen && (
        <div className="md:hidden absolute top-0 left-0 w-full h-screen bg-white z-50 flex flex-col animate-fadeIn">
          <div className="flex justify-between items-center p-6 border-b border-slate-100">
             <span className="text-2xl font-black text-slate-900">{settings.siteName}</span>
             <button onClick={() => setIsOpen(false)}><X size={28} className="text-slate-900"/></button>
          </div>
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-2">
            {links.map((link) => (
              <div key={link.name} className="border-b border-slate-50 last:border-none">
                <div className="flex justify-between items-center">
                  <Link 
                    to={link.path} 
                    onClick={(e) => {
                      if (link.submenu) {
                        e.preventDefault();
                        setMobileExpand(mobileExpand === link.name ? null : link.name);
                      } else {
                        handleLinkClick();
                      }
                    }}
                    className="flex-1 text-lg font-bold text-slate-800 py-4 flex justify-between items-center"
                  >
                    {link.name}
                    {link.submenu && <ChevronDown size={20} className={`text-slate-400 transition-transform ${mobileExpand === link.name ? 'rotate-180' : ''}`}/>}
                  </Link>
                </div>
                
                {link.submenu && (
                  <div className={`overflow-hidden transition-all duration-300 bg-slate-50 rounded-lg ${mobileExpand === link.name ? 'max-h-40 mb-4' : 'max-h-0'}`}>
                    {link.submenu.map(sub => (
                      <Link 
                        key={sub.name} 
                        to={sub.path} 
                        onClick={handleLinkClick}
                        className="block px-6 py-3 text-slate-600 font-medium hover:text-orange-600"
                      >
                        {sub.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            
            <Link to="/admin" onClick={handleLinkClick} className="text-lg font-bold text-slate-500 py-4 flex items-center gap-2 border-b border-slate-50 hover:text-orange-600">
               <Lock size={18}/> 管理員後台登入
            </Link>

            <a href={`tel:${settings.contactPhone}`} className="bg-orange-600 text-white py-4 rounded-xl text-center font-bold mt-8 shadow-lg">
              來電諮詢：{settings.contactPhone}
            </a>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;