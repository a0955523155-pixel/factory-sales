import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-gray-400 py-8 text-center text-sm">
      <p>© {new Date().getFullYear()} 優質工業地產專賣. All rights reserved.</p>
    </footer>
  );
};

export default Footer;