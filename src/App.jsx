import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'; // 引入 Navigate

// Lazy Load 區塊 (保持您原本的設定)
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
          <Route path="/news" element={<ArticlePage categoryGroup="news" title="最新消息" />} />
          <Route path="/works" element={<ArticlePage categoryGroup="works" title="經典作品" />} />
          <Route path="/about" element={<ArticlePage categoryGroup="about" title="關於我們" />} />
          <Route path="/academy" element={<ArticlePage categoryGroup="academy" title="房地產小學堂" />} />

          {/* 🔥 新增這行：捕捉所有未知的路徑，強制導回首頁 (或是您可以導向 /admin) */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;