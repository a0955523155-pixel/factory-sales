import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, query, where, limit } from 'firebase/firestore';
import { MapPin, Maximize, Zap, Loader2 } from 'lucide-react';

const TvDisplay = () => {
  const [properties, setProperties] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // 1. 抓取要在電視上輪播的案場 (這裡預設抓取設定為顯示在首頁的案場，最多 10 筆)
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const q = query(
          collection(db, 'properties'),
          where('basicInfo.showOnHome', '==', true),
          limit(10)
        );
        const snap = await getDocs(q);
        const data = [];
        snap.forEach(doc => data.push({ id: doc.id, ...doc.data() }));
        setProperties(data);
        setLoading(false);
      } catch (error) {
        console.error("抓取展示資料失敗:", error);
        setLoading(false);
      }
    };
    fetchProperties();
  }, []);

  // 2. 設定自動輪播計時器 (每 8 秒切換一張)
  useEffect(() => {
    if (properties.length === 0) return;
    
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % properties.length);
    }, 8000); // 8000 毫秒 = 8 秒

    return () => clearInterval(timer);
  }, [properties]);

  if (loading) {
    return (
      <div className="h-screen w-screen bg-slate-950 flex flex-col items-center justify-center text-orange-500">
        <Loader2 className="animate-spin mb-4" size={64} />
        <h2 className="text-2xl font-bold tracking-widest animate-pulse">載入展示資料中...</h2>
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div className="h-screen w-screen bg-slate-950 flex items-center justify-center text-white text-3xl font-bold">
        目前沒有可展示的物件
      </div>
    );
  }

  const currentProp = properties[currentIndex];
  
  // 自動生成該物件的專屬 QR Code 網址 (使用免費 API，不需安裝套件)
  // 這樣客戶掃描就會直接連到您的網站該物件頁面
  const propertyUrl = `${window.location.origin}/property/${currentProp.basicInfo.title}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(propertyUrl)}&bgcolor=ffffff`;

  return (
    // 使用 h-screen w-screen 佔滿整個螢幕，並隱藏滾動條
    <div className="h-screen w-screen overflow-hidden bg-black relative flex items-center justify-center">
      
      {/* 背景大圖 (帶有淡入淡出動畫效果) */}
      <div className="absolute inset-0 z-0">
        {properties.map((prop, index) => (
          <img
            key={prop.id}
            src={prop.basicInfo.thumb || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab'}
            alt={prop.basicInfo.title}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${
              index === currentIndex ? 'opacity-60 scale-105' : 'opacity-0 scale-100'
            }`}
            style={{ transitionDuration: '1.5s' }} // 讓切換更柔和
          />
        ))}
        {/* 漸層遮罩，讓文字更清楚 */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent"></div>
      </div>

      {/* 頂部 LOGO 區塊 */}
      <div className="absolute top-10 left-12 z-20 flex items-center gap-4">
        <div className="bg-orange-600 text-white px-4 py-2 rounded-lg font-black text-2xl tracking-widest shadow-lg">
          綠芽團隊
        </div>
        <span className="text-white text-xl font-bold tracking-widest opacity-80">鼎龍資產管理服務有限公司</span>
      </div>

      {/* 主要資訊區塊 (左下角) */}
      <div className="absolute bottom-16 left-12 z-20 max-w-4xl">
        <div className="flex items-center gap-3 mb-4">
          <span className="bg-blue-600 text-white px-4 py-1.5 rounded-full text-lg font-bold flex items-center gap-2">
            <MapPin size={20} /> {currentProp.basicInfo.city}
          </span>
          <span className="bg-white/20 backdrop-blur-md border border-white/30 text-white px-4 py-1.5 rounded-full text-lg font-bold">
            {currentProp.basicInfo.transactionType || '出售'}
          </span>
        </div>
        
        <h1 className="text-6xl md:text-8xl font-black text-white mb-6 leading-tight drop-shadow-2xl">
          {currentProp.basicInfo.title}
        </h1>
        
        <div className="flex gap-8 mb-8">
          <div className="text-white">
            <p className="text-slate-400 text-xl font-bold mb-1">土地面積</p>
            <p className="text-4xl font-black flex items-baseline gap-2">
              <Maximize size={28} className="text-orange-500"/>
              {currentProp.specs?.landSize || '--'} <span className="text-2xl font-normal">坪</span>
            </p>
          </div>
          <div className="text-white">
            <p className="text-slate-400 text-xl font-bold mb-1">電力設備</p>
            <p className="text-4xl font-black flex items-baseline gap-2">
              <Zap size={28} className="text-orange-500"/>
              {currentProp.specs?.power || '--'}
            </p>
          </div>
        </div>

        <div>
          <p className="text-slate-400 text-2xl font-bold mb-2">總價</p>
          <p className="text-6xl font-black text-orange-500 drop-shadow-lg">
            {currentProp.basicInfo.price}
          </p>
        </div>
      </div>

      {/* 右下角 QR Code 掃描區塊 */}
      <div className="absolute bottom-16 right-12 z-20 bg-white/10 backdrop-blur-xl border border-white/20 p-6 rounded-3xl flex flex-col items-center shadow-2xl">
        <p className="text-white text-xl font-bold tracking-widest mb-4">掃描查看完整資訊</p>
        <div className="bg-white p-3 rounded-2xl">
          <img src={qrCodeUrl} alt="掃描看案場" className="w-48 h-48 object-contain" />
        </div>
        <p className="text-orange-400 text-sm font-bold mt-4 animate-pulse">
          立即預約賞屋
        </p>
      </div>

      {/* 底部進度條 */}
      <div className="absolute bottom-0 left-0 h-2 bg-orange-600 transition-all duration-1000 ease-linear z-30" 
           style={{ width: `${((currentIndex + 1) / properties.length) * 100}%` }}>
      </div>

    </div>
  );
};

export default TvDisplay;