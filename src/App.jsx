import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

const Home = lazy(() => import('./pages/Home'));
const PropertyDetail = lazy(() => import('./pages/PropertyDetail'));
const Admin = lazy(() => import('./pages/Admin'));
const ArticlePage = lazy(() => import('./pages/ArticlePage'));
const Contact = lazy(() => import('./pages/Contact'));

const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50">
    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-orange-500"></div>
  </div>
);

function App() {
  return (
    <Router>
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/property/:id" element={<PropertyDetail />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/contact" element={<Contact />} />
          
          {/* 新聞動態 - 獨立頁面 */}
          <Route path="/news/local" element={<ArticlePage category="news_local" title="本地新聞" />} />
          <Route path="/news/project" element={<ArticlePage category="news_project" title="新案消息" />} />
          
          {/* 其他頁面 */}
          <Route path="/works" element={<ArticlePage categoryGroup="works" title="經典作品" />} />
          <Route path="/about" element={<ArticlePage categoryGroup="about" title="關於我們" />} />
          
          {/* 萬用路由 (404 導回首頁) */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;