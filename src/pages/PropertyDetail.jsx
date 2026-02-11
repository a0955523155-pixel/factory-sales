// src/pages/PropertyDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase'; // 請確認路徑是否正確
import { 
  MapPin, Check, Ruler, Zap, Calendar, ArrowLeft, 
  LayoutDashboard, Building2, Map as MapIcon, Share2, 
  Loader2, Phone, MessageCircle, ChevronRight
} from 'lucide-react';

// 引入剛剛做好的手機版按鈕
import MobileStickyBar from '../components/MobileStickyBar';

const PropertyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0); // 控制目前顯示哪張大圖

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const docRef = doc(db, "properties", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProperty({ id: docSnap.id, ...docSnap.data() });
        } else {
          alert("案件不存在");
          navigate('/'); // 回首頁
        }
      } catch (error) {
        console.error("讀取失敗", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProperty();
  }, [id, navigate]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <Loader2 size={40} className="animate-spin text-orange-500 mx-auto mb-4"/>
        <p className="text-slate-400 font-bold">載入案件資料中...</p>
      </div>
    </div>
  );

  if (!property) return null;

  // 解構資料，設定預設值避免報錯
  const info = property.basicInfo || {};
  const specs = property.specs || [];
  const features = property.features || [];
  const units = property.units || [];
  const images = info.images && info.images.length > 0 ? info.images : [info.thumb || 'https://via.placeholder.com/800x600?text=No+Image'];

  // 格式化價格
  const displayPrice = (price) => {
    if (!price) return "價格洽詢";
    if (String(price).includes("萬") || String(price).includes("億")) return price;
    return `${price} 萬`;
  };

  return (
    <div className="min-h-screen bg-white pb-24 md:pb-10">
      
      {/* --- 頂部導航 (手機版顯示返回) --- */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100 p-4 flex justify-between items-center md:hidden">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-slate-100 rounded-full">
            <ArrowLeft size={24} className="text-slate-700"/>
        </button>
        <h1 className="font-bold text-slate-800 truncate px-4">{info.title}</h1>
        <button onClick={() => navigator.share && navigator.share({url: window.location.href})} className="p-2 -mr-2 hover:bg-slate-100 rounded-full">
            <Share2 size={24} className="text-slate-700"/>
        </button>
      </div>

      <div className="max-w-7xl mx-auto md:p-6 lg:p-8">
        
        {/* --- 電腦版麵包屑與標題 --- */}
        <div className="hidden md:block mb-6">
            <button onClick={() => navigate(-1)} className="flex items-center text-slate-400 hover:text-orange-500 text-sm font-bold mb-4 transition">
                <ArrowLeft size={16} className="mr-1"/> 返回列表
            </button>
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-2">{info.title}</h1>
                    <div className="flex items-center gap-2 text-slate-500 font-bold">
                        <MapPin size={18} className="text-orange-500"/>
                        <span>{info.city}{info.address ? ` · ${info.address}` : ''}</span>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-3xl font-black text-orange-600">{displayPrice(info.price)}</div>
                    <div className="text-sm font-bold text-slate-400 mt-1">{info.propertyType} | {info.usageType}</div>
                </div>
            </div>
        </div>

        {/* --- 圖片展示區 (Gallery) --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
            {/* 左側大圖 */}
            <div className="lg:col-span-2">
                <div className="relative aspect-video bg-slate-100 rounded-2xl overflow-hidden shadow-sm group">
                    <img 
                        src={images[activeImage]} 
                        alt="Main" 
                        className="w-full h-full object-cover transition duration-500 group-hover:scale-105"
                    />
                    <div className="absolute bottom-4 right-4 bg-black/70 text-white text-xs px-3 py-1 rounded-full backdrop-blur font-bold">
                        {activeImage + 1} / {images.length}
                    </div>
                </div>
                
                {/* 縮圖列表 (如果有多張圖) */}
                {images.length > 1 && (
                    <div className="flex gap-2 mt-4 overflow-x-auto pb-2 px-4 md:px-0">
                        {images.map((img, idx) => (
                            <button 
                                key={idx} 
                                onClick={() => setActiveImage(idx)}
                                className={`flex-shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 transition ${activeImage === idx ? 'border-orange-500 ring-2 ring-orange-200' : 'border-transparent opacity-60 hover:opacity-100'}`}
                            >
                                <img src={img} alt={`thumb-${idx}`} className="w-full h-full object-cover"/>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* 右側：關鍵數據 (手機版會變到下面) */}
            <div className="lg:col-span-1 space-y-6 px-4 md:px-0">
                {/* 手機版價格顯示區 */}
                <div className="md:hidden mb-4">
                     <div className="text-3xl font-black text-orange-600 mb-1">{displayPrice(info.price)}</div>
                     <div className="flex flex-wrap gap-2">
                        <span className="bg-slate-100 px-2 py-1 rounded text-xs font-bold text-slate-600">{info.propertyType}</span>
                        <span className="bg-slate-100 px-2 py-1 rounded text-xs font-bold text-slate-600">{info.usageType}</span>
                        <span className="bg-slate-100 px-2 py-1 rounded text-xs font-bold text-slate-600">{info.transactionType}</span>
                     </div>
                </div>

                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><LayoutDashboard className="text-slate-400"/> 物件規格</h3>
                    <div className="space-y-3">
                        {specs.map((s, i) => (
                            <div key={i} className="flex justify-between items-center border-b border-slate-200 pb-2 last:border-0">
                                <span className="text-slate-500 font-bold text-sm">{s.label}</span>
                                <span className="text-slate-800 font-bold">{s.value}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 經紀人資訊卡片 */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-black text-xl">
                            {info.agentName ? info.agentName[0] : '綠'}
                        </div>
                        <div>
                            <div className="text-xs text-slate-400 font-bold uppercase">專屬經紀人</div>
                            <div className="font-bold text-lg">{info.agentName || '綠芽團隊'}</div>
                        </div>
                    </div>
                    {/* 電腦版顯示的按鈕 (手機版會被 Sticky Bar 取代) */}
                    <div className="hidden md:grid grid-cols-2 gap-3">
                        <button className="bg-slate-900 text-white py-2 rounded-lg font-bold hover:bg-slate-800 transition">
                            {info.agentPhone || '09XX-XXX-XXX'}
                        </button>
                        <button 
                             onClick={() => info.lineId && window.open(`https://line.me/ti/p/~${info.lineId}`, '_blank')}
                             className="bg-[#06C755] text-white py-2 rounded-lg font-bold hover:brightness-110 transition flex items-center justify-center gap-2"
                        >
                            <MessageCircle size={18}/> 加 LINE
                        </button>
                    </div>
                </div>
            </div>
        </div>

        {/* --- 詳細介紹與特色 --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 px-4 md:px-0">
            <div className="lg:col-span-2 space-y-10">
                
                {/* 描述 */}
                <section>
                    <h3 className="text-xl font-bold text-slate-800 mb-4 border-l-4 border-orange-500 pl-3">物件介紹</h3>
                    <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed whitespace-pre-line">
                        {info.description || "暫無詳細介紹..."}
                    </div>
                </section>

                {/* 特色亮點 */}
                {features.length > 0 && (
                    <section>
                        <h3 className="text-xl font-bold text-slate-800 mb-4 border-l-4 border-orange-500 pl-3">核心特色</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {features.map((f, i) => (
                                <div key={i} className="flex items-start gap-3 bg-orange-50/50 p-4 rounded-xl border border-orange-100">
                                    <div className="mt-1 bg-orange-100 p-1 rounded text-orange-600"><Check size={14} strokeWidth={4}/></div>
                                    <div>
                                        <div className="font-bold text-slate-800">{f.title}</div>
                                        <div className="text-sm text-slate-500">{f.desc}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Google Map */}
                {info.googleMapUrl && (
                    <section>
                         <h3 className="text-xl font-bold text-slate-800 mb-4 border-l-4 border-orange-500 pl-3">地理位置</h3>
                         <div className="aspect-video w-full rounded-2xl overflow-hidden shadow-sm border border-slate-200 bg-slate-100">
                             <iframe 
                                src={info.googleMapUrl} 
                                width="100%" 
                                height="100%" 
                                style={{border:0}} 
                                allowFullScreen="" 
                                loading="lazy" 
                                referrerPolicy="no-referrer-when-downgrade"
                             ></iframe>
                         </div>
                    </section>
                )}
            </div>

            {/* 右側：戶別銷控表 (如果有) */}
            <div className="lg:col-span-1">
                {units.length > 0 && (
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 sticky top-24 shadow-sm">
                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Building2 className="text-blue-500"/> 銷售狀況</h3>
                        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                            {units.map((u, i) => (
                                <div key={i} className={`p-3 rounded-xl border flex justify-between items-center ${
                                    u.status === 'sold' ? 'bg-slate-100 border-slate-200 opacity-60' : 
                                    u.status === 'reserved' ? 'bg-yellow-50 border-yellow-200' : 
                                    'bg-white border-blue-100 hover:border-blue-300'
                                }`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full ${
                                            u.status === 'sold' ? 'bg-slate-400' : 
                                            u.status === 'reserved' ? 'bg-yellow-400' : 'bg-green-500'
                                        }`}></div>
                                        <div>
                                            <div className="font-bold text-slate-800">{u.number}</div>
                                            <div className="text-xs text-slate-500">{u.ping} 坪</div>
                                        </div>
                                    </div>
                                    <div className="font-bold text-sm">
                                        {u.status === 'sold' ? <span className="text-slate-400">已售出</span> : 
                                         u.status === 'reserved' ? <span className="text-yellow-600">已預訂</span> : 
                                         <span className="text-orange-600">{u.price}</span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>

      </div>

      {/* ★★★ 手機版底部黏人按鈕 ★★★ */}
      <MobileStickyBar 
        agentPhone={info.agentPhone} 
        lineId={info.lineId} 
        title={info.title}
      />

    </div>
  );
};

export default PropertyDetail;