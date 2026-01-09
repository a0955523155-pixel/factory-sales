import React, { useState } from 'react';
import { Menu, X, Phone, Hammer } from 'lucide-react'; // 加個 Hammer 圖標更有工業感
import { Link } from 'react-router-dom';

const Navbar = ({ phone }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed w-full z-50 top-0 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-center h-20">
          {/* Logo 區 */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="bg-orange-600 p-2 rounded-sm group-hover:bg-orange-500 transition">
              <Hammer className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-widest uppercase">Factory Pro</h1>
              <p className="text-[10px] text-slate-500 tracking-[0.2em] font-mono">INDUSTRIAL REAL ESTATE</p>
            </div>
          </Link>

          {/* 電腦版選單 */}
          <div className="hidden md:flex items-center space-x-8 font-mono text-sm">
            <Link to="/" className="text-gray-400 hover:text-white transition uppercase tracking-wider">首頁列表</Link>
            <a href={`tel:${phone}`} className="flex items-center gap-2 border border-orange-600 text-orange-500 px-6 py-2 rounded-sm hover:bg-orange-600 hover:text-white transition duration-300">
              <Phone size={16} />
              <span className="font-bold">{phone}</span>
            </a>
          </div>

          {/* 手機版按鈕 */}
          <div className="md:hidden">
            <button onClick={() => setIsOpen(!isOpen)} className="text-gray-300">
              {isOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>

      {/* 手機版選單 */}
      {isOpen && (
        <div className="md:hidden bg-slate-900 border-b border-slate-800">
          <Link to="/" className="block py-4 px-6 text-gray-300 border-b border-slate-800" onClick={() => setIsOpen(false)}>首頁列表</Link>
        </div>
      )}
    </nav>
  );
};

export default Navbar;