import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc, addDoc, collection } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, ArrowLeft, Calendar, Phone, Activity, CheckCircle2, Map as MapIcon, X } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ContactSection from '../components/ContactSection'; 

// 深色卡片風格 (保持不變)
const SpecsAndFeatures = ({ specs, features, title, description }) => (
  <section className="py-20 px-6 max-w-7xl mx-auto">
    <div className="bg-slate-900 rounded-3xl p-8 md:p-16 text-white relative overflow-hidden">
       <div className="absolute top-0 right-0 w-64 h-64 bg-orange-600/20 rounded-full blur-3xl -mr-16 -mt-16"></div>
       <div className="flex flex-col lg:flex-row gap-16 relative z-10">
          <div className="lg:w-1/3">
             <h2 className="text-4xl md:text-5xl font-black mb-6 leading-tight">稀有釋出，<br/><span className="text-orange-500">頂規資產配置</span></h2>
             <p className="text-slate-400 text-lg leading-relaxed mb-8 whitespace-pre-line">
                {description || `${title} 位於交通核心，具備極佳的產業優勢。全新鋼構，挑高設計適合物流或高架倉儲。不僅具備極佳的交通優勢，且周邊產業聚落成熟，是企業佈局的最佳選擇。`}
             </p>
             <div className="space-y-4">
                {features.map((f, i) => (<div key={i} className="flex items-center gap-3 text-orange-400"><CheckCircle2 size={20}/><span className="text-white font-bold">{f.title}</span></div>))}
             </div>
          </div>
          <div className="lg:w-2/3 grid grid-cols-1 md:grid-cols-2 gap-6">
             {specs.map((s, i) => (<div key={i} className="bg-slate-800 p-8 rounded-2xl border border-slate-700 hover:border-orange-500 transition duration-300 flex flex-col items-center justify-center text-center group"><div className="mb-4 p-3 bg-slate-700 rounded-full text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition"><Activity size={24}/></div><h3 className="text-2xl font-black mb-1">{s.value}</h3><span className="text-slate-400 text-sm font-mono tracking-wider">{s.label}</span></div>))}
          </div>
       </div>
    </div>
  </section>
);

// --- 互動平面圖 (還原版：無邊框 / 狀態文字 / 不變形) ---
const InteractiveMap = ({ mapUrl, units }) => {
  const [selectedUnit, setSelectedUnit] = useState(null);
  
  if (!mapUrl) return null;

  const pointsToString = (points) => points.map(p => `${p.x},${p.y}`).join(" ");
  
  // 計算中心點 (用來放文字)
  const getPolygonCenter = (points) => {
    if (!points || points.length === 0) return { x: 50, y: 50 };
    const x = points.reduce((sum, p) => sum + p.x, 0) / points.length;
    const y = points.reduce((sum, p) => sum + p.y, 0) / points.length;
    return { x, y };
  };

  // 狀態文字對照表
  const statusTextMap = { available: '可銷售', reserved: '已預訂', sold: '已售出' };

  return (
    <section className="py-20 px-6 max-w-7xl mx-auto">
       <div className="text-center mb-10"><h2 className="text-3xl font-black text-slate-900">基地配置平面圖</h2><p className="text-slate-500 mt-2">點擊圖上區塊查看詳細資訊</p></div>
       
       <div className="relative rounded-xl overflow-hidden shadow-2xl border border-slate-200 bg-slate-100 select-none w-full group/map">
          {/* 1. 底圖：自然撐開容器，不強制變形 */}
          <img src={mapUrl} className="w-full h-auto block" alt="Site Plan" />
          
          {/* 2. SVG 互動層：絕對定位覆蓋 */}
          <svg 
             className="absolute inset-0 w-full h-full"
             viewBox="0 0 100 100" 
             preserveAspectRatio="none" 
          >
             {units.map((u, i) => u.mapPoints && (
                <g 
                   key={i} 
                   onClick={() => setSelectedUnit(u)}
                   className="cursor-pointer transition-opacity duration-300 hover:opacity-80 group/poly"
                >
                   {/* 多邊形區域 */}
                   <polygon 
                      points={pointsToString(u.mapPoints)}
                      fill={u.status === 'sold' ? '#64748b' : u.status === 'reserved' ? '#eab308' : (u.mapColor || '#ea580c')}
                      fillOpacity={u.status === 'sold' ? "0.7" : "0.5"}
                      stroke="none" // 移除邊框
                   />
                   
                   {/* 狀態文字 */}
                   <text 
                      x={getPolygonCenter(u.mapPoints).x} 
                      y={getPolygonCenter(u.mapPoints).y}
                      fontSize={u.mapFontSize/5 || 2.5} 
                      fill={u.mapTextColor || 'white'} 
                      textAnchor={u.mapTextAlign || "middle"}
                      alignmentBaseline="middle"
                      fontFamily={u.mapFont}
                      className="pointer-events-none drop-shadow-md"
                      style={{ textShadow: '0 0.5px 2px rgba(0,0,0,0.8)' }}
                   >
                      {statusTextMap[u.status]}
                   </text>
                </g>
             ))}
          </svg>
       </div>

       {/* Modal 彈窗 (還原樣式) */}
       <AnimatePresence>
         {selectedUnit && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedUnit(null)} className="absolute inset-0 bg-black/60 backdrop-blur-sm"></motion.div>
               <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-3xl p-8 max-w-lg w-full relative z-10 shadow-2xl">
                  <button onClick={() => setSelectedUnit(null)} className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full hover:bg-slate-200"><X size={20}/></button>
                  <div className="flex items-center gap-3 mb-4">
                     <span className={`px-3 py-1 rounded text-xs font-bold ${selectedUnit.status==='sold'?'bg-slate-200 text-slate-500':selectedUnit.status==='reserved'?'bg-yellow-100 text-yellow-700':'bg-orange-100 text-orange-600'}`}>
                        {selectedUnit.status === 'sold' ? '已售出' : selectedUnit.status === 'reserved' ? '已預訂' : '銷售中'}
                     </span>
                     <h3 className="text-3xl font-black text-slate-900">{selectedUnit.number}</h3>
                  </div>
                  <div className="space-y-4 border-t border-slate-100 pt-4">
                     <div className="flex justify-between border-b border-slate-50 pb-2"><span className="text-slate-500">坪數</span><span className="font-bold text-lg">{selectedUnit.ping} 坪</span></div>
                     <div className="flex justify-between border-b border-slate-50 pb-2"><span className="text-slate-500">價格</span><span className="font-bold text-lg text-orange-600">{selectedUnit.price}</span></div>
                  </div>
                  {selectedUnit.layout && <div className="mt-6"><img src={selectedUnit.layout} className="w-full rounded-lg border"/></div>}
                  <button onClick={() => setSelectedUnit(null)} className="w-full mt-8 bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-orange-600 transition">關閉</button>
               </motion.div>
            </div>
         )}
       </AnimatePresence>
    </section>
  );
};

const UnitList = ({ units }) => {
  if (!units || units.length === 0) return null;
  return (
    <section className="py-20 px-6 max-w-7xl mx-auto bg-slate-50 border-y border-slate-200">
       <div className="text-center mb-10"><h2 className="text-3xl font-black text-slate-900">戶別銷控列表</h2></div>
       <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">{units.map((u, i) => (<div key={i} className={`p-4 rounded-xl border-2 font-bold text-lg flex flex-col items-center justify-center h-24 relative transition hover:-translate-y-1 ${u.status === 'sold' ? 'bg-slate-100 border-slate-200 text-slate-400' : 'bg-white border-orange-500 text-orange-600 shadow-sm'}`}>{u.number}<span className="text-xs font-normal mt-1 opacity-80">{u.status === 'sold' ? '已售出' : u.status === 'reserved' ? '已預訂' : '可銷售'}</span></div>))}</div>
    </section>
  );
};

const LocationMap = ({ mapUrl, address }) => { if (!mapUrl) return null; return ( <section className="py-20 px-6 max-w-7xl mx-auto"><div className="bg-white p-2 rounded-3xl shadow-xl border border-slate-200 overflow-hidden"><div className="bg-slate-900 px-8 py-4 flex items-center justify-between"><h3 className="text-white font-bold flex items-center gap-2"><MapIcon className="text-orange-500"/> 物件位置</h3><span className="text-slate-400 text-sm font-mono">{address}</span></div><div className="aspect-video w-full"><iframe src={mapUrl} width="100%" height="100%" style={{ border: 0 }} allowFullScreen="" loading="lazy" referrerPolicy="no-referrer-when-downgrade"></iframe></div></div></section> ); };

const PropertyDetail = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  useEffect(() => { window.scrollTo(0, 0); const fetch = async () => { const docSnap = await getDoc(doc(db, "properties", id)); if (docSnap.exists()) setData(docSnap.data()); }; fetch(); }, [id]);
  if (!data) return <div className="h-screen bg-slate-50 flex items-center justify-center font-mono text-2xl">LOADING...</div>;

  return (
    <div className="font-sans min-h-screen text-slate-900 bg-slate-50">
      <Navbar /> 
      <div className="relative h-[90vh] w-full bg-slate-900 overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${data.basicInfo.thumb})` }} />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/grid-me.png')] opacity-20 pointer-events-none"></div>
        <div className="relative z-10 h-full flex flex-col justify-end pb-24 px-6 max-w-7xl mx-auto">
          <Link to="/" className="absolute top-28 left-6 md:left-auto text-white/80 flex items-center gap-2 hover:text-orange-400 bg-white/10 px-6 py-3 rounded-full backdrop-blur border border-white/10 font-bold transition"><ArrowLeft size={20}/> 回列表</Link>
          <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="md:w-3/4">
            <span className="bg-orange-600 text-white px-4 py-1 text-sm font-bold uppercase tracking-widest rounded-sm mb-6 inline-block shadow-lg shadow-orange-500/50">Premium Industrial Asset</span>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white mb-6 leading-tight drop-shadow-lg">{data.basicInfo.title}</h1>
            {data.basicInfo.subtitleEN && <p className="text-2xl text-orange-300 font-mono mb-8 tracking-widest uppercase">{data.basicInfo.subtitleEN}</p>}
            <div className="inline-flex flex-col md:flex-row gap-10 bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-3xl shadow-2xl"><div className="pr-10 md:border-r border-white/20"><p className="text-sm text-slate-300 uppercase mb-2 font-bold tracking-wider">Asking Price</p><p className="text-4xl lg:text-5xl font-black text-white">{data.basicInfo.price}</p></div><div><p className="text-sm text-slate-300 uppercase mb-2 font-bold tracking-wider">Location</p><div className="flex items-center gap-3 text-white text-2xl font-bold"><MapPin className="text-orange-500" size={28} />{data.basicInfo.address}</div></div></div>
          </motion.div>
        </div>
      </div>
      <SpecsAndFeatures specs={data.specs || []} features={data.features || []} title={data.basicInfo.title} description={data.basicInfo.description} />
      
      {/* 新增：互動地圖 (如果有上傳底圖才顯示) */}
      {data.basicInfo.interactiveMap && <InteractiveMap mapUrl={data.basicInfo.interactiveMap} units={data.units || []} />}
      
      <UnitList units={data.units || []} />
      <LocationMap mapUrl={data.basicInfo.googleMapUrl} address={data.basicInfo.address} />
      <ContactSection title="預約賞屋與諮詢" dark={true} />
      <Footer />
    </div>
  );
};

export default PropertyDetail;