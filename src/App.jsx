import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import PropertyDetail from './pages/PropertyDetail';
import Admin from './pages/Admin';
import ArticlePage from './pages/ArticlePage';
import Contact from './pages/Contact'; // 新增

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/property/:id" element={<PropertyDetail />} />
        <Route path="/admin" element={<Admin />} />
        
        {/* 新選單架構 */}
        <Route path="/contact" element={<Contact />} /> {/* 聯絡我們頁面 */}
        <Route path="/news" element={<ArticlePage categoryGroup="news" title="最新消息" />} />
        <Route path="/works" element={<ArticlePage categoryGroup="works" title="經典作品" />} />
        <Route path="/about" element={<ArticlePage categoryGroup="about" title="關於我們" />} />
      </Routes>
    </Router>
  );
}

export default App;