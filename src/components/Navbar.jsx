import React, { useState, useEffect } from 'react';
import { Menu, X, Phone, Factory, Activity } from 'lucide-react'; // 改用 Factory
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
        if (docSnap.exists()) {
          const data = docSnap.data();
          setSettings({
            siteName: data.siteName || "Factory Pro",
            contactPhone: data.contactPhone || phone || "0800-666-738"
          });
        }
      } catch(e) {}
    };
    fetchSettings();
  }, [phone]);

  return (
    <nav className="fixed w-full z-50 top-0 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-center h-20">
          
          <Link to="/" className="flex items-center gap-3 group">
            {/* Logo 圖示更換為工廠 */}
            <div className="bg-slate-800 p-2 rounded-sm border-2 border-slate-600 group-hover:border-orange-500 group-hover:bg-slate-900 transition duration-300">
              <Factory className="text-orange-500 group-hover:text-white transition" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-widest uppercase flex items-center gap-2">
                {settings.siteName} <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
              </h1>
            </div>
          </Link>

          <div className="hidden md:flex items-center space-x-8 font-mono font-bold">
            <Link to="/" className="text-slate-600 hover:text-orange-600 transition uppercase tracking-wider flex items-center gap-2 text-lg">
              <Activity size={20} /> 物件列表
            </Link>
            
            <a href={`tel:${settings.contactPhone}`} className="flex items-center gap-2 bg-slate-900 text-white px-6 py-2 rounded hover:bg-orange-600 transition duration-300 shadow-lg group">
              <Phone size={18} className="group-hover:animate-bounce"/>
              <span className="text-lg tracking-wider">{settings.contactPhone}</span>
            </a>
          </div>

          <div className="md:hidden">
            <button onClick={() => setIsOpen(!isOpen)} className="text-slate-800">
              {isOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>
      
      {isOpen && (
         <div className="md:hidden bg-white border-t border-slate-100 absolute w-full left-0 shadow-xl p-4">
            <Link to="/" className="block py-3 px-4 text-slate-800 font-bold hover:bg-slate-50 rounded">物件列表</Link>
            <a href={`tel:${settings.contactPhone}`} className="block py-3 px-4 text-orange-600 font-bold">撥打電話: {settings.contactPhone}</a>
         </div>
      )}
    </nav>
  );
};

export default Navbar;