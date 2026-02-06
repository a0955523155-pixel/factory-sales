import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, ArrowLeft, Activity, CheckCircle2, X, Star, Info, Filter, Flame, Medal, Newspaper, ExternalLink, Share2, Check } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ContactSection from '../components/ContactSection'; 

// --- 規格與特色 ---
const SpecsAndFeatures = ({ specs, features, title, description }) => (
  <section className="py-20 px-6 max-w-7xl mx-auto">
    <div className="bg-slate-900 rounded-3xl p-8 md:p-16 text-white relative overflow-hidden">
       <div className="absolute top-0 right-0 w-64 h-64 bg-orange-600/20 rounded-full blur-3xl -mr-16 -mt-16"></div>
       <div className="flex flex-col lg:flex-row gap-16 relative z-10">
          <div className="lg:w-1/3">
             <h2 className="text-4xl md:text-5xl font-black mb-6 leading-tight">稀有釋出，<br/><span className="text-orange-500">頂規資產配置</span></h2>
             <p className="text-slate-400 text-lg leading-relaxed mb-8 whitespace-pre-line">
                {description || `${title} 位於交通核心...`}
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

// --- 周遭環境與新聞區塊 ---
const SurroundingsSection = ({ list }) => {
  if (!list || list.length === 0 || (list.length === 1 && !list[0].title)) return null;

  return (
    <section className="py-16 px-6 max-w-7xl mx-auto">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-black text-slate-900 flex items-center justify-center gap-2">
          <Newspaper className="text-orange-500"/> 周遭環境與建設利多
        </h2>
        <p className="text-slate-500 mt-2">掌握區域發展脈動，預見未來增值潛力</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {list.map((item, index) => (
          item.title && (
            <div key={index} className="bg-white border border-slate-100 rounded-2xl p-6 shadow-lg hover:shadow-xl transition group relative overflow-hidden">
               <div className="absolute top-0 left-0 w-1 h-full bg-orange-500"></div>
               <h3 className="text-xl font-bold text-slate-800 mb-3 group-hover:text-orange-600 transition">{item.title}</h3>
               <p className="text-slate-500 text-sm leading-relaxed mb-4 line-clamp-4">{item.desc}</p>
               {item.link && (
                 <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-blue-600 flex items-center gap-1 hover:underline">
                   閱讀相關報導 <ExternalLink size={14}/>
                 </a>
               )}
            </div>
          )
        ))}
      </div>
    </section>
  );
};

// --- 智慧型戶別列表 ---
const UnitList = ({ units }) => {
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [filterZone, setFilterZone] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [sortType, setSortType] = useState('default');

  if (!units || units.length === 0) return null;

  const zones = useMemo(() => {
    const uniqueZones = new Set(units.map(u => u.number.charAt(0).toUpperCase()));
    return ['All', ...Array.from(uniqueZones).sort()];
  }, [units]);

  const isDefaultView = filterZone === 'All' && filterStatus === 'All';

  const displayUnits = useMemo(() => {
    const parseNum = (str) => parseFloat(str?.replace(/[^0-9.]/g, '') || 0);
    let result = [...units];

    if (isDefaultView) {
      return result
        .filter(u => u.status === 'available')
        .sort((a, b) => parseNum(a.price) - parseNum(b.price))
        .slice(0, 3)
        .map(u => ({ ...u, isHot: true }));
    } else {
      if (filterZone !== 'All') result = result.filter(u => u.number.toUpperCase().startsWith(filterZone));
      if (filterStatus !== 'All') result = result.filter(u => u.status === filterStatus);
      switch (sortType) {
        case 'price-asc': result.sort((a, b) => parseNum(a.price) - parseNum(b.price)); break;
        case 'price-desc': result.sort((a, b) => parseNum(b.price) - parseNum(a.price)); break;
        case 'ping-asc': result.sort((a, b) => parseNum(a.ping) - parseNum(b.ping)); break;
        case 'ping-desc': result.sort((a, b) => parseNum(b.ping) - parseNum(a.ping)); break;
        default: result.sort((a, b) => a.number.localeCompare(b.number, undefined, { numeric: true, sensitivity: 'base' })); break;
      }
      return result;
    }
  }, [units, isDefaultView, filterZone, filterStatus, sortType]);

  const statusTextMap = { available: '銷售中', reserved: '已預訂', sold: '已售出' };

  return (
    <section className="py-20 px-6 max-w-7xl mx-auto bg-slate-50 border-y border-slate-200">
       <div className="text-center mb-10">
          <h2 className="text-3xl font-black text-slate-900">戶別銷控列表</h2>
          <p className="text-slate-500 mt-2">{isDefaultView ? "精選低總價熱銷戶別 (請使用下方篩選器查看完整列表)" : `已篩選顯示 ${displayUnits.length} 筆資料`}</p>
       </div>

       <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-8 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-3 items-center">
             <div className="flex items-center gap-2 text-slate-500 font-bold text-sm"><Filter size={16}/> 區域/狀態：</div>
             <select value={filterZone} onChange={(e)=>setFilterZone(e.target.value)} className="bg-slate-100 border-none rounded-lg px-4 py-2 text-sm font-bold text-slate-700 outline-none hover:bg-slate-200 cursor-pointer">
                <option value="All">熱銷中</option>
                {zones.filter(z=>z!=='All').map(z => <option key={z} value={z}>{z} 區</option>)}
             </select>
             <select value={filterStatus} onChange={(e)=>setFilterStatus(e.target.value)} className="bg-slate-100 border-none rounded-lg px-4 py-2 text-sm font-bold text-slate-700 outline-none hover:bg-slate-200 cursor-pointer">
                <option value="All">所有狀態</option>
                <option value="available">🟢 銷售中</option>
                <option value="reserved">🟡 已預訂</option>
                <option value="sold">🔴 已售出</option>
             </select>
          </div>
          <div className="flex flex-wrap gap-3 items-center">
             <div className="flex items-center gap-2 text-slate-500 font-bold text-sm">排序：</div>
             <select value={sortType} onChange={(e)=>setSortType(e.target.value)} className="bg-slate-100 border-none rounded-lg px-4 py-2 text-sm font-bold text-slate-700 outline-none hover:bg-slate-200 cursor-pointer">
                <option value="default">預設 (依戶號)</option>
                <option value="price-asc">價格：低 → 高</option>
                <option value="price-desc">價格：高 → 低</option>
                <option value="ping-asc">坪數：小 → 大</option>
                <option value="ping-desc">坪數：大 → 小</option>
             </select>
          </div>
       </div>

       {displayUnits.length === 0 ? (
          <div className="text-center py-20 text-slate-400 font-bold bg-white rounded-xl border border-dashed border-slate-300">沒有符合條件的戶別</div>
       ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
             {displayUnits.map((u, i) => (
                <div key={i} onClick={() => setSelectedUnit(u)} className={`p-4 rounded-xl border-2 font-bold text-lg flex flex-col items-center justify-center h-32 relative transition cursor-pointer hover:-translate-y-1 hover:shadow-lg group overflow-hidden ${u.status === 'sold' ? 'bg-slate-100 border-slate-200 text-slate-400' : u.status === 'reserved' ? 'bg-yellow-50 border-yellow-400 text-yellow-700' : u.isHot ? 'bg-white border-red-500 text-slate-800 shadow-md ring-2 ring-red-100' : 'bg-white border-slate-200 text-slate-700 hover:border-orange-500'}`}>
                   <span className={`absolute top-2 right-2 text-[10px] px-1.5 py-0.5 rounded text-white ${u.status === 'sold' ? 'bg-slate-400' : u.status === 'reserved' ? 'bg-yellow-500' : 'bg-green-500'}`}>{u.status === 'sold' ? '售' : u.status === 'reserved' ? '訂' : '售'}</span>
                   {u.isHot && (<span className="absolute top-2 left-2 flex items-center gap-0.5 text-[10px] text-red-600 bg-red-50 px-1.5 py-0.5 rounded font-black border border-red-100 animate-pulse"><Flame size={10} fill="currentColor"/> 熱銷</span>)}
                   <span className="text-2xl mb-1 font-black">{u.number}</span>
                   <div className="flex flex-col items-center text-xs opacity-80 gap-0.5 w-full">
                      {u.unitPrice && <span className="text-lg font-black text-blue-600">{u.unitPrice} <span className="text-[10px] font-normal text-slate-400">萬/坪</span></span>}
                      <span className={`text-[10px] ${u.status!=='sold'?'text-red-500':''}`}>總價: {u.price}</span>
                      <span className="text-slate-400 text-[10px]">{(parseFloat(u.ping)||0).toFixed(2)} 坪</span>
                   </div>
                </div>
             ))}
          </div>
       )}

       <AnimatePresence>
         {selectedUnit && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={() => setSelectedUnit(null)}>
               <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                  <div className={`p-6 text-white flex justify-between items-start ${selectedUnit.status === 'sold' ? 'bg-red-500' : selectedUnit.status === 'reserved' ? 'bg-yellow-500' : 'bg-blue-600'}`}>
                     <div><h3 className="text-3xl font-black">{selectedUnit.number}</h3><p className="opacity-90 font-bold tracking-widest uppercase text-sm mt-1 flex items-center gap-1">{selectedUnit.status === 'sold' && <Star size={16} fill="white"/>}{selectedUnit.status === 'sold' ? 'SOLD OUT' : selectedUnit.status === 'reserved' ? 'RESERVED' : 'AVAILABLE'}</p></div>
                     <button onClick={() => setSelectedUnit(null)} className="bg-white/20 p-2 rounded-full hover:bg-white/30 transition"><X className="w-5 h-5" /></button>
                  </div>
                  <div className="p-6 space-y-4">
                     <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50 p-4 rounded-2xl text-center border border-slate-100">
                           <span className="block text-xs text-slate-400 font-bold uppercase mb-1">登記坪數</span>
                           <span className="text-2xl font-black text-slate-800">{(parseFloat(selectedUnit.ping)||0).toFixed(2)} <span className="text-sm font-medium text-slate-500">坪</span></span>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-2xl text-center border border-slate-100">
                           <span className="block text-xs text-slate-400 font-bold uppercase mb-1">單價</span>
                           <span className="text-2xl font-black text-blue-600">{selectedUnit.unitPrice || '-'} <span className="text-xs text-slate-400">萬</span></span>
                        </div>
                     </div>
                     <div className="text-center pb-2 border-b border-slate-100">
                        <span className="text-sm text-slate-400 font-bold">總價：</span>
                        <span className="text-xl font-black text-orange-600">{selectedUnit.price}</span>
                     </div>
                     <div className="pt-2"><h4 className="text-sm font-bold text-slate-500 mb-2 flex items-center gap-1"><Info className="w-4 h-4"/> 詳細資訊</h4><ul className="text-sm text-slate-600 space-y-1 ml-1 list-disc list-inside"><li>狀態：{statusTextMap[selectedUnit.status]}</li>{selectedUnit.layout ? (<li className="text-blue-600 cursor-pointer hover:underline" onClick={()=>window.open(selectedUnit.layout, '_blank')}>查看平面圖 (點擊開啟)</li>) : <li>暫無平面圖</li>}</ul></div>
                     <button onClick={() => { document.getElementById('contact-section').scrollIntoView({ behavior: 'smooth' }); setSelectedUnit(null); }} className={`w-full py-3 rounded-xl font-bold text-white shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2 ${selectedUnit.status === 'sold' ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`} disabled={selectedUnit.status === 'sold'}>{selectedUnit.status === 'sold' ? '此案件已售出' : '預約看地 / 詢問'}</button>
                  </div>
               </motion.div>
            </div>
         )}
       </AnimatePresence>
    </section>
  );
};

const LocationMap = ({ mapUrl, address }) => { if (!mapUrl) return null; return ( <section className="py-20 px-6 max-w-7xl mx-auto"><div className="bg-white p-2 rounded-3xl shadow-xl border border-slate-200 overflow-hidden"><div className="bg-slate-900 px-8 py-4 flex items-center justify-between"><h3 className="text-white font-bold flex items-center gap-2"><MapPin className="text-orange-500"/> 物件位置</h3><span className="text-slate-400 text-sm font-mono">{address}</span></div><div className="aspect-video w-full"><iframe src={mapUrl} width="100%" height="100%" style={{ border: 0 }} allowFullScreen="" loading="lazy" referrerPolicy="no-referrer-when-downgrade"></iframe></div></div></section> ); };

const PropertyDetail = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => { 
    window.scrollTo(0, 0); 
    const fetch = async () => { const docSnap = await getDoc(doc(db, "properties", id)); if (docSnap.exists()) setData(docSnap.data()); }; 
    fetch(); 
  }, [id]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!data) return <div className="h-screen bg-slate-50 flex items-center justify-center font-mono text-2xl">LOADING...</div>;

  return (
    <div className="font-sans min-h-screen text-slate-900 bg-slate-50">
      <Navbar /> 
      <div className="relative h-[90vh] w-full bg-slate-900 overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${data.basicInfo.thumb})` }} />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/grid-me.png')] opacity-20 pointer-events-none"></div>
        <div className="relative z-10 h-full flex flex-col justify-end pb-24 px-6 max-w-7xl mx-auto">
          {/* 左上角返回按鈕 */}
          <Link to="/works" className="absolute top-28 left-6 text-white/80 flex items-center gap-2 hover:text-orange-400 bg-white/10 px-6 py-3 rounded-full backdrop-blur border border-white/10 font-bold transition"><ArrowLeft size={20}/> 回經典作品</Link>
          
          {/* 右上角分享按鈕 */}
          <button onClick={handleShare} className={`absolute top-28 right-6 text-white/80 flex items-center gap-2 hover:text-orange-400 px-6 py-3 rounded-full backdrop-blur border font-bold transition ${copied ? 'bg-green-600/80 border-green-500 text-white' : 'bg-white/10 border-white/10'}`}>
             {copied ? <Check size={20}/> : <Share2 size={20}/>}
             {copied ? "已複製連結" : "分享案場"}
          </button>

          <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="md:w-3/4">
            <span className="bg-orange-600 text-white px-4 py-1 text-sm font-bold uppercase tracking-widest rounded-sm mb-6 inline-block shadow-lg shadow-orange-500/50">Premium Industrial Asset</span>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white mb-6 leading-tight drop-shadow-lg">{data.basicInfo.title}</h1>
            {data.basicInfo.subtitleEN && <p className="text-2xl text-orange-300 font-mono mb-8 tracking-widest uppercase">{data.basicInfo.subtitleEN}</p>}
            <div className="inline-flex flex-col md:flex-row gap-10 bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-3xl shadow-2xl"><div className="pr-10 md:border-r border-white/20"><p className="text-sm text-slate-300 uppercase mb-2 font-bold tracking-wider">Asking Price</p><p className="text-4xl lg:text-5xl font-black text-white">{data.basicInfo.price}</p></div><div><p className="text-sm text-slate-300 uppercase mb-2 font-bold tracking-wider">Location</p><div className="flex items-center gap-3 text-white text-2xl font-bold"><MapPin className="text-orange-500" size={28} />{data.basicInfo.address}</div></div></div>
          </motion.div>
        </div>
      </div>
      <SpecsAndFeatures specs={data.specs || []} features={data.features || []} title={data.basicInfo.title} description={data.basicInfo.description} />
      
      <SurroundingsSection list={data.environmentList || []} />

      <UnitList units={data.units || []} />
      
      <LocationMap mapUrl={data.basicInfo.googleMapUrl} address={data.basicInfo.address} />
      <ContactSection title="預約賞屋與諮詢" dark={true} />
      <Footer />
    </div>
  );
};

export default PropertyDetail;