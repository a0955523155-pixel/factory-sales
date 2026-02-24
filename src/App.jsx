import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import 'react-quill-new/dist/quill.snow.css'; // 確保前台也能讀取 Quill 的樣式定義

// ★★★ 1. 隱形追蹤器 ★★★
import AnalyticsTracker from './components/AnalyticsTracker';

const Home = lazy(() => import('./pages/Home'));
const PropertyDetail = lazy(() => import('./pages/PropertyDetail'));
const Admin = lazy(() => import('./pages/Admin'));
const ArticlePage = lazy(() => import('./pages/ArticlePage'));
const Contact = lazy(() => import('./pages/Contact'));
const About = lazy(() => import('./pages/About'));
const ArticleDetail = lazy(() => import('./pages/ArticleDetail'));

// ★★★ 新增：引入 Sitemap 產生器 ★★★
const SitemapGenerator = lazy(() => import('./pages/SitemapGenerator'));

const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50">
    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-orange-500"></div>
  </div>
);

function App() {
  return (
    <Router>
      {/* 追蹤器放在 Router 裡面，Suspense 和 Routes 的外面 */}
      <AnalyticsTracker />
      
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/property/:id" element={<PropertyDetail />} />
          <Route path="/article/:id" element={<ArticleDetail />} />
          
          <Route path="/admin" element={<Admin />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/about" element={<About />} />
          
          <Route path="/news/local" element={<ArticlePage category="news_local" title="本地新聞" />} />
          <Route path="/news/project" element={<ArticlePage category="news_project" title="新案消息" />} />
          <Route path="/academy" element={<ArticlePage categoryGroup="academy" title="房地產小學堂" />} />
          
          <Route path="/works" element={<ArticlePage categoryGroup="works" title="經典作品" />} />
          
          {/* ★★★ 新增：隱藏的 Sitemap 產生器路由 (必須放在 * 的前面) ★★★ */}
          <Route path="/build-sitemap" element={<SitemapGenerator />} />
          
          {/* 找不到網址時，自動導回首頁 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;