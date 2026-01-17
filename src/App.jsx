import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// 1. 改用 lazy import (懶加載)
// 這樣做可以讓 Admin, PropertyDetail 等頁面在需要時才下載
const Home = lazy(() => import('./pages/Home'));
const PropertyDetail = lazy(() => import('./pages/PropertyDetail'));
const Admin = lazy(() => import('./pages/Admin'));
const ArticlePage = lazy(() => import('./pages/ArticlePage'));
const Contact = lazy(() => import('./pages/Contact'));

// 2. 建立一個簡單的載入中畫面
const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50">
    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-orange-500"></div>
  </div>
);

function App() {
  return (
    <Router>
      {/* 3. 使用 Suspense 包裹 Routes，並設定 fallback (載入中畫面) */}
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/property/:id" element={<PropertyDetail />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/news" element={<ArticlePage categoryGroup="news" title="最新消息" />} />
          <Route path="/works" element={<ArticlePage categoryGroup="works" title="經典作品" />} />
          <Route path="/about" element={<ArticlePage categoryGroup="about" title="關於我們" />} />
          
          {/* 舊連結兼容 (可選) */}
          <Route path="/academy" element={<ArticlePage categoryGroup="academy" title="房地產小學堂" />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;