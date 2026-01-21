import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// 頁面元件載入
const Home = lazy(() => import('./pages/Home'));
const PropertyDetail = lazy(() => import('./pages/PropertyDetail'));
const Admin = lazy(() => import('./pages/Admin'));
const ArticlePage = lazy(() => import('./pages/ArticlePage'));
const ArticleDetail = lazy(() => import('./pages/ArticleDetail')); // 記得引入這個！
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
          
          {/* [關鍵修正] 文章詳情頁路由 */}
          <Route path="/article/:id" element={<ArticleDetail />} />
          
          <Route path="/admin" element={<Admin />} />
          <Route path="/contact" element={<Contact />} />
          
          <Route path="/news/local" element={<ArticlePage category="news_local" title="本地新聞" />} />
          <Route path="/news/project" element={<ArticlePage category="news_project" title="新案消息" />} />
          <Route path="/academy" element={<ArticlePage category="academy" title="房地產小學堂" />} />
          
          <Route path="/works" element={<ArticlePage categoryGroup="works" title="經典作品" />} />
          <Route path="/about" element={<ArticlePage categoryGroup="about" title="關於我們" />} />
          
          {/* 萬用路由 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;