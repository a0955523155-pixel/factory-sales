import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import PropertyDetail from './pages/PropertyDetail';
import Admin from './pages/Admin'; // 1. 引入剛剛建立的後台頁面

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* === 前台公開頁面 === */}
        {/* 首頁列表 */}
        <Route path="/" element={<Home />} />
        
        {/* 案場詳情頁 (例如 /property/jiuda) */}
        <Route path="/property/:id" element={<PropertyDetail />} />

        {/* === 後台管理頁面 === */}
        {/* 新增案場 (輸入 /admin 即可進入) */}
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;