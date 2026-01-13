import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { 
  MapPin, ArrowLeft, ArrowRight, Calendar, ExternalLink, 
  Activity, Grid, Zap, Layers 
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

// --- 1. 案場理念 (支援圖片) ---
const Concept = ({ data, theme }) => (
  <section className="py-24 px-6 max-w-7xl mx-auto relative z-10">
    <div className="flex flex-col lg:flex-row items-center gap-16">
      
      {/* 文字區 */}
      <motion.div 
        initial={{ x: -50, opacity: 0 }}
        whileInView={{ x: 0, opacity: 1 }}
        className="lg:w-1/2"
      >
        <div className="flex items-center gap-2 mb-4">
          <span className="w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: theme.primaryColor }}></span>
          <span className="text-xs font-mono tracking-[0.2em] text-slate-500 uppercase">Architecture Concept</span>
        </div>
        
        <h2 className="text-4xl md:text-5xl font-black mb-8 leading-tight text-slate-800">
          {data.title || "設計理念"}
        </h2>
        
        <div className="p-8 bg-white rounded-2xl shadow-lg border border-slate-100 relative group">
          <div className="absolute top-0 left-0 w-1 h-full transition-all duration-300 group-hover:h-full h-8" style={{ backgroundColor: theme.primaryColor }}></div>
          <p className="text-lg leading-loose text-slate-600 whitespace-pre-line relative z-10">
            {data.content}
          </p>
        </div>
      </motion.div>

      {/* 圖片區 (顯示上傳的圖片) */}
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        className="lg:w-1/2 relative"
      >
        <div className="rounded-[2rem] overflow-hidden shadow-2xl border-4 border-white aspect-[4/3] bg-slate-200">
           {data.image ? (
             <img src={data.image} className="w-full h-full object-cover" alt="Concept" />
           ) : (
             <div className="w-full h-full flex items-center justify-center text-slate-400 font-mono flex-col gap-2">
               <Layers size={48} />
               <span>NO CONCEPT IMAGE</span>
             </div>
           )}
        </div>
        <div className="absolute -inset-4 rounded-[2.5rem] blur-xl opacity-20 z-0" style={{ backgroundColor: theme.primaryColor }}></div>
      </motion.div>
    </div>
  </section>
);

// --- 2. 工程進度 (科技軌跡) ---
const Progress = ({ history, theme }) => {
  if (!history || history.length === 0) return null;
  const sortedHistory = [...history].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <section className="py-24 bg-white relative">
       {/* 網點背景裝飾 (減少留白感) */}
       <div className="absolute inset-0 opacity-5" style={{ backgroundImage: `radial-gradient(#000 1px, transparent 1px)`, backgroundSize: '20px 20px' }}></div>

       <div className="max-w-4xl mx-auto px-6 relative z-10">
         <div className="text-center mb-16">
            <span className="inline-block py-1 px-3 rounded-full bg-slate-100 text-xs font-mono text-slate-500 mb-2">TIMELINE LOG</span>
            <h2 className="text-3xl font-black uppercase text-slate-900">工程進度</h2>
         </div>

         <div className="relative pl-8 md:pl-0">
            <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-[2px] bg-slate-100"></div>
            {sortedHistory.map((item, index) => (
              <motion.div 
                key={index}
                initial={{ y: 20, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ delay: index * 0.1 }}
                className={`flex flex-col md:flex-row items-center mb-12 relative ${index % 2 === 0 ? 'md:flex-row-reverse' : ''}`}
              >
                <div className="w-full md:w-1/2 pl-8 md:pl-0 md:px-10">
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:border-orange-300 transition duration-300">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-sm text-slate-400 flex items-center gap-1"><Calendar size={12}/> {item.date}</span>
                      {index === 0 && <span className="px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase" style={{ backgroundColor: theme.primaryColor }}>Latest</span>}
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">{item.status}</h3>
                  </div>
                </div>
                <div className="absolute left-8 md:left-1/2 -translate-x-1/2 w-4 h-4 rounded-full border-4 border-white shadow-lg z-10" style={{ backgroundColor: theme.primaryColor }}></div>
                <div className="w-full md:w-1/2 hidden md:block"></div>
              </motion.div>
            ))}
         </div>
       </div>
    </section>
  );
};

// --- 3. 周遭環境 (1~3欄排版) ---
const Environment = ({ list, theme }) => {
  if (!list || list.length === 0) return null;
  
  // 決定 grid 欄位數 (最大 3 欄)
  const gridClass = list.length === 1 ? "grid-cols-1 max-w-4xl" : list.length === 2 ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1 md:grid-cols-3";

  return (
    <section className="py-24 px-6 max-w-7xl mx-auto">
      <div className="text-center mb-12">
         <h2 className="text-3xl font-black text-slate-900 mb-2">地理位置 & 周邊機能</h2>
         <div className="w-16 h-1 mx-auto" style={{ backgroundColor: theme.primaryColor }}></div>
      </div>
      
      <div className={`grid ${gridClass} gap-8 mx-auto`}>
        {list.map((item, i) => (
          <motion.div 
            key={i}
            whileHover={{ y: -5 }}
            className="bg-white rounded-2xl overflow-hidden shadow-lg border border-slate-100 flex flex-col h-full"
          >
            {/* 圖片區 */}
            <div className="h-48 overflow-hidden relative bg-slate-200">
               {item.image ? (
                 <img src={item.image} className="w-full h-full object-cover transition duration-700 hover:scale-110" alt={item.title}/>
               ) : (
                 <div className="w-full h-full flex items-center justify-center text-slate-400"><MapPin /></div>
               )}
            </div>
            
            {/* 內容區 */}
            <div className="p-8 flex flex-col flex-grow">
               <h3 className="text-xl font-bold mb-3 text-slate-800">{item.title}</h3>
               <p className="text-slate-500 leading-relaxed mb-6 flex-grow text-sm">{item.desc}</p>
               
               {item.link && (
                 <a href={item.link} target="_blank" rel="noopener noreferrer" 
                    className="mt-auto inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider transition hover:opacity-70"
                    style={{ color: theme.primaryColor }}>
                    相關報導 <ExternalLink size={14} />
                 </a>
               )}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

// --- 4. 規格與特色 ---
const SpecsAndFeatures = ({ specs, features, theme }) => (
  <section className="py-24 px-6 max-w-7xl mx-auto bg-white rounded-3xl shadow-sm border border-slate-100 my-12">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
      <div>
        <h3 className="text-2xl font-black uppercase mb-8 flex items-center gap-2 text-slate-900">
          <Activity className="text-orange-500"/> 物件規格
        </h3>
        <div className="grid grid-cols-1 gap-4">
          {specs.map((s, i) => (
            <div key={i} className="flex justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-xs font-mono uppercase text-slate-400 tracking-wider">{s.label}</span>
              <span className="text-lg font-black text-slate-800 font-mono">{s.value}</span>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h3 className="text-2xl font-black uppercase mb-8 flex items-center gap-2 text-slate-900">
          <Grid className="text-orange-500"/> 核心特色
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {features.map((f, i) => (
            <div key={i} className="p-4 bg-slate-50 rounded-lg border border-slate-100">
              <h4 className="font-bold text-slate-800 mb-1 flex items-center gap-2"><Zap size={14} className="text-orange-400"/>{f.title}</h4>
              <p className="text-xs text-slate-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  </section>
);

// --- 主頁面 ---
const PropertyDetail = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const defaultTheme = { primaryColor: '#ea580c', bgColor: '#f1f5f9', textColor: '#1e293b' }; // 改為稍微深一點的底色

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetch = async () => {
      const docSnap = await getDoc(doc(db, "properties", id));
      if (docSnap.exists()) setData(docSnap.data());
    };
    fetch();
  }, [id]);

  if (!data) return <div className="h-screen bg-slate-100 flex items-center justify-center font-mono">LOADING...</div>;

  const theme = data.theme || defaultTheme;
  
  // 相容舊資料：如果 environmentList 沒資料，試著讀舊的 environment
  let envList = data.environmentList || [];
  if (envList.length === 0 && data.environment && data.environment.title) {
     envList = [data.environment];
  }

  return (
    <div className="font-sans min-h-screen text-slate-900" style={{ backgroundColor: theme.bgColor }}>
      <Navbar phone={data.basicInfo?.agentPhone} />
      
      {/* 1. HERO (深色背景，對比強烈) */}
      <div className="relative h-[85vh] w-full bg-slate-900 overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${data.basicInfo.thumb})` }} />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent" />
        
        <div className="relative z-10 h-full flex flex-col justify-end pb-20 px-6 max-w-7xl mx-auto">
          <Link to="/" className="absolute top-28 left-6 text-white/80 flex items-center gap-2 hover:text-orange-400 bg-black/20 px-4 py-2 rounded-full backdrop-blur">
            <ArrowLeft size={16}/> BACK
          </Link>

          <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="md:w-2/3">
            <span className="bg-orange-600 text-white px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-sm mb-4 inline-block">Industrial Asset</span>
            <h1 className="text-5xl md:text-7xl font-black text-white mb-8 leading-none">{data.basicInfo.title}</h1>
            <div className="inline-flex flex-col md:flex-row gap-8 bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-2xl">
              <div><p className="text-xs text-slate-400 uppercase">Price</p><p className="text-3xl font-black text-white">{data.basicInfo.price}</p></div>
              <div className="w-px bg-white/20 hidden md:block"></div>
              <div><p className="text-xs text-slate-400 uppercase">Address</p><div className="flex items-center gap-2 text-white font-bold"><MapPin className="text-orange-500" size={18} />{data.basicInfo.address}</div></div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* --- 內容區塊 (背景交替：灰->白->灰) --- */}
      
      {/* 理念 */}
      <div style={{ backgroundColor: theme.bgColor }}>
         <Concept data={data.concept || {}} theme={theme} />
      </div>

      {/* 規格 */}
      <div className="bg-white">
         <SpecsAndFeatures specs={data.specs || []} features={data.features || []} theme={theme} />
      </div>
      
      {/* 進度 */}
      <div style={{ backgroundColor: theme.bgColor }}>
         <Progress history={data.progressHistory || []} theme={theme} />
      </div>

      {/* 環境 */}
      <div className="bg-white">
         <Environment list={envList} theme={theme} />
      </div>

      {/* 相簿 (修正為 4 列小圖) */}
      {data.images && data.images.length > 0 && (
        <section className="py-24" style={{ backgroundColor: theme.bgColor }}>
           <div className="max-w-7xl mx-auto px-6">
             <div className="flex items-end justify-between mb-10">
                <h2 className="text-3xl font-black text-slate-900 uppercase">Gallery</h2>
                <span className="text-slate-500 font-mono text-xs">TOTAL: {data.images.length} PHOTOS</span>
             </div>
             {/* 修正：改成 grid-cols-4，且限制高度，避免圖片過大 */}
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               {data.images.map((img, i) => (
                 <div key={i} className="rounded-lg overflow-hidden shadow-sm border border-slate-200 aspect-[4/3] group cursor-pointer">
                   <img src={img} className="w-full h-full object-cover transition duration-500 group-hover:scale-110" alt="Gallery" />
                 </div>
               ))}
             </div>
           </div>
        </section>
      )}

      {/* Footer Call to Action */}
      <div className="py-24 bg-slate-900 text-center relative overflow-hidden">
         <div className="relative z-10 px-6">
            <h2 className="text-4xl font-black text-white mb-8">預約現場賞屋</h2>
            <div className="flex justify-center gap-4">
              <a href={`tel:${data.basicInfo.agentPhone}`} className="px-8 py-4 text-lg font-bold bg-orange-600 text-white rounded-full hover:bg-orange-500 transition shadow-lg flex items-center gap-2">
                 <ArrowRight /> 撥打電話：{data.basicInfo.agentName}
              </a>
            </div>
         </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default PropertyDetail;