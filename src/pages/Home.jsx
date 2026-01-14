import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ContactSection from '../components/ContactSection'; // 引入新元件
import { MapPin, ArrowRight, Database, Search, Newspaper } from 'lucide-react';
import { motion } from 'framer-motion';

const Home = () => {
  const [properties, setProperties] = useState([]);
  const [newsLocal, setNewsLocal] = useState([]);
  const [newsProject, setNewsProject] = useState([]);
  const [activeNewsTab, setActiveNewsTab] = useState('local'); 
  const [loading, setLoading] = useState(true);
  
  const [filter, setFilter] = useState({ city: '全部區域', type: '全部屬性', mode: '全部類別' });
  const [settings, setSettings] = useState({ heroTitleCN: "未來工廠", heroTitleEN: "FUTURE FACTORY" });

  useEffect(() => {
    const fetchData = async () => {
      try { const settingSnap = await getDoc(doc(db, "settings", "global")); if (settingSnap.exists()) setSettings(settingSnap.data()); } catch(e) {}
      
      const querySnapshot = await getDocs(collection(db, "properties"));
      const list = [];
      querySnapshot.forEach((doc) => list.push({ id: doc.id, ...doc.data() }));
      setProperties(list);

      try {
        const articleSnap = await getDocs(collection(db, "articles"));
        const all = [];
        articleSnap.forEach((doc) => all.push({ id: doc.id, ...doc.data() }));
        all.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)); 

        setNewsLocal(all.filter(a => a.category === 'news_local').slice(0, 3));
        setNewsProject(all.filter(a => a.category === 'news_project').slice(0, 3));
      } catch(e) {}
      
      setLoading(false);
    };
    fetchData();
  }, []);

  const filteredProps = properties.filter(p => {
    const info = p.basicInfo || {};
    const matchCity = filter.city === '全部區域' || info.city === filter.city;
    const matchType = filter.type === '全部屬性' || info.propertyType === filter.type;
    const matchMode = filter.mode === '全部類別' || info.usageType === filter.mode;
    return matchCity && matchType && matchMode;
  });

  const displayNews = activeNewsTab === 'local' ? newsLocal : newsProject;

  return (
    <div className="min-h-screen tech-bg-light font-sans selection:bg-orange-500 selection:text-white pb-20 w-full overflow-x-hidden">
      <Navbar /> 
      <div className="scanline"></div>
      
      <div className="pt-32 pb-10 px-6 max-w-7xl mx-auto w-full relative">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="relative z-10">
          <h1 className="text-6xl md:text-8xl font-black text-slate-900 mb-6 tracking-tight leading-none">
            {settings.heroTitleCN || "未來工廠"} <br/>
            <span className="text-3xl md:text-4xl text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-red-600 font-bold tracking-widest block mt-2">{settings.heroTitleEN || "FUTURE FACTORY"}</span>
          </h1>
          
          <div className="max-w-4xl mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-2 rounded-2xl shadow-xl border border-slate-100">
             <select value={filter.city} onChange={(e) => setFilter({...filter, city: e.target.value})} className="p-4 rounded-xl bg-slate-50 font-bold text-slate-700 outline-none cursor-pointer"><option value="全部區域">全部區域</option><option value="高雄">高雄</option><option value="屏東">屏東</option></select>
             <select value={filter.type} onChange={(e) => setFilter({...filter, type: e.target.value})} className="p-4 rounded-xl bg-slate-50 font-bold text-slate-700 outline-none cursor-pointer"><option value="全部屬性">全部屬性</option><option value="工業地">工業地</option><option value="農地">農地</option><option value="建地">建地</option></select>
             <select value={filter.mode} onChange={(e) => setFilter({...filter, mode: e.target.value})} className="p-4 rounded-xl bg-slate-50 font-bold text-slate-700 outline-none cursor-pointer"><option value="全部類別">全部類別</option><option value="買賣">買賣</option><option value="租賃">租賃</option></select>
          </div>
        </motion.div>
        <div className="absolute top-10 right-0 opacity-10 hidden md:block"><Database size={200} /></div>
      </div>
      
      <div className="pl-6 max-w-7xl mx-auto w-full relative z-10 overflow-hidden mb-20">
        <div className="flex items-center justify-between mb-6 pr-6 border-b border-slate-200 pb-4"><h2 className="text-3xl font-bold flex items-center gap-3 text-slate-800"><span className="w-3 h-8 bg-orange-600 block"></span>精選案場</h2><div className="flex gap-4 items-center"><span className="font-mono text-slate-400 text-sm font-bold hidden md:block">SCROLL &rarr;</span><span className="font-mono text-slate-400 text-lg font-bold">DATA: {filteredProps.length}</span></div></div>
        {loading ? <div className="text-center py-20 text-2xl font-mono text-slate-400">LOADING DATA...</div> : (
          <div className="flex gap-4 overflow-x-auto pb-12 snap-x snap-mandatory pr-6 scrollbar-hide w-full" style={{ scrollBehavior: 'smooth' }}>
            {filteredProps.map((item, index) => (
              <motion.div key={item.id} initial={{ opacity: 0, x: 50 }} whileInView={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.1 }} className="snap-center shrink-0 w-[calc(100vw-48px)] md:w-[400px]">
                <Link to={`/property/${item.id}`} className="group block bg-white border border-slate-200 hover:border-orange-500 transition-all duration-300 relative overflow-hidden rounded-2xl shadow-sm hover:shadow-2xl hover:-translate-y-2 h-full flex flex-col">
                  <div className="h-64 overflow-hidden relative">
                    <img src={item.basicInfo?.thumb || "https://via.placeholder.com/400x300"} alt={item.basicInfo?.title} className="w-full h-full object-cover transition duration-700 group-hover:scale-110"/>
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 text-xs font-bold font-mono border border-slate-200 rounded">ID: {item.id.slice(0,6)}</div>
                  </div>
                  <div className="p-8 flex-1 flex flex-col">
                    <div className="mb-4"><h3 className="text-2xl font-bold text-slate-900 group-hover:text-orange-600 transition line-clamp-1">{item.basicInfo?.title}</h3><p className="text-slate-500 mt-1 line-clamp-1">{item.basicInfo?.subtitle}</p></div>
                    <div className="flex items-center gap-2 text-slate-500 mb-6 pb-6 border-b border-slate-100"><MapPin size={18} className="text-orange-500" /><span className="text-lg line-clamp-1">{item.basicInfo?.address}</span></div>
                    <div className="flex justify-between items-center mt-auto"><span className="text-2xl font-black text-slate-900">{item.basicInfo?.price}</span><div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-orange-600 group-hover:text-white transition"><ArrowRight size={20}/></div></div>
                  </div>
                </Link>
              </motion.div>
            ))}
            <div className="w-2 shrink-0"></div>
          </div>
        )}
      </div>

      <div className="bg-slate-100 py-20 border-t border-slate-200">
         <div className="max-w-7xl mx-auto px-6">
            <div className="flex justify-between items-end mb-10">
               <div className="flex items-center gap-6">
                  <h2 className="text-3xl font-black text-slate-900 flex items-center gap-3"><Newspaper className="text-orange-600"/> 最新動態</h2>
                  <div className="flex bg-white rounded-lg p-1 border border-slate-200">
                     <button onClick={()=>setActiveNewsTab('local')} className={`px-4 py-1 rounded text-sm font-bold transition ${activeNewsTab==='local' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>本地新聞</button>
                     <button onClick={()=>setActiveNewsTab('project')} className={`px-4 py-1 rounded text-sm font-bold transition ${activeNewsTab==='project' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>新案消息</button>
                  </div>
               </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               {displayNews.length === 0 ? (
                  <div className="col-span-3 text-center text-slate-400 py-10 bg-white rounded-xl border border-slate-200">目前尚無{activeNewsTab==='local'?'本地新聞':'新案消息'}</div>
               ) : (
                  displayNews.map((article) => (
                     <Link to="/news" key={article.id} className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition duration-300 group flex flex-col h-full relative">
                        <div className="h-48 overflow-hidden relative">
                           {article.image ? <img src={article.image} className="w-full h-full object-cover transition duration-500 group-hover:scale-110"/> : <div className="w-full h-full bg-slate-200 flex items-center justify-center text-slate-400">NEWS</div>}
                        </div>
                        <div className="p-6 flex-1 flex flex-col">
                           <div className="text-xs text-slate-400 font-mono mb-2">{article.date}</div>
                           <h3 className="font-bold text-lg mb-3 line-clamp-2 group-hover:text-orange-600 transition">{article.title}</h3>
                           <p className="text-slate-500 text-sm line-clamp-3 mb-4 flex-1">{article.content}</p>
                           <div className="text-orange-600 font-bold text-sm mt-auto flex items-center gap-1 group-hover:translate-x-1 transition">Read More <ArrowRight size={14}/></div>
                        </div>
                     </Link>
                  ))
               )}
            </div>
         </div>
      </div>

      {/* 首頁底部也保留聯絡區塊 */}
      <ContactSection title="預約賞屋與諮詢" />
      <Footer />
    </div>
  );
};

export default Home;