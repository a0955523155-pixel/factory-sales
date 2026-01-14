import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 py-8 border-t border-slate-800 font-sans">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="text-sm font-bold tracking-wider">
          © 2026 優質房地產買賣. All rights reserved.
        </div>
        <div className="flex gap-6 text-xs font-mono">
           <span>PRIVACY POLICY</span>
           <span>TERMS OF SERVICE</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;