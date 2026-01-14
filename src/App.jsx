import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import PropertyDetail from './pages/PropertyDetail';
import Admin from './pages/Admin';
import ArticlePage from './pages/ArticlePage'; // 新增通用文章頁

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/property/:id" element={<PropertyDetail />} />
        <Route path="/admin" element={<Admin />} />
        
        {/* 新增三個頁面，共用同一個元件但帶入不同類別 */}
        <Route path="/news" element={<ArticlePage category="news" title="市場最新消息" />} />
        <Route path="/academy" element={<ArticlePage category="academy" title="房地產小學堂" />} />
        <Route path="/cases" element={<ArticlePage category="cases" title="成交案例分享" />} />
      </Routes>
    </Router>
  );
}

export default App;