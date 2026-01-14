import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { MapPin, ArrowRight, Database, Cpu, Search, Newspaper } from 'lucide-react';
import { motion } from 'framer-motion';

const Home = () => {
  const [properties, setProperties] = useState([]);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchRegion, setSearchRegion] = useState("");
  const [regions, setRegions] = useState([]);
  const [settings, setSettings] = useState({ heroTitleCN: "未來工廠", heroTitleEN: "FUTURE FACTORY" });

  useEffect(() => {
    const fetchData = async () => {
      try { const settingSnap = await getDoc(doc(db, "settings", "global")); if (settingSnap.exists()) setSettings(settingSnap.data()); } catch(e) {}
      
      const querySnapshot = await getDocs(collection(db, "properties"));
      const list = [];
      const regionSet = new Set();
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        list.push({ id: doc.id, ...data });
        if (data.basicInfo?.address) regionSet.add(data.basicInfo.address.substring(0, 3));
      });
      setProperties(list);
      setRegions([...regionSet]);

      try {
        const articleSnap = await getDocs(collection(db, "articles"));
        const allArticles = [];
        articleSnap.forEach((doc) => allArticles.push({ id: doc.id, ...doc.data() }));
        
        // 排序：新 -> 舊 (createdAt 優先)
        allArticles.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

        // 分別找出各類別的第一篇
        const latestNews = allArticles.find(a => a.category === 'news');
        const latestAcademy = allArticles.find(a => a.category === 'academy');
        const latestCase = allArticles.find(a => a.category === 'cases');

        const displayList = [latestNews, latestAcademy, latestCase].filter(Boolean);
        setArticles(displayList);
      } catch(e) {}
      
      setLoading(false);
    };
    fetchData();
  }, []);

  const filteredProps = searchRegion ? properties.filter(p => p.basicInfo.address.includes(searchRegion)) : properties;

  const getCatName = (cat) => {
    switch(cat) { case 'news': return '市場消息'; case 'academy': return '房地產小學堂'; case 'cases': return '成交案例'; default: return '動態'; }
  };
  const getCatColor = (cat) => {
    switch(cat) { case 'news': return 'bg-blue-500'; case 'academy': return 'bg-green-500'; case 'cases': return 'bg-purple-500'; default: return 'bg-gray-500'; }
  };

  return (
    <div className="min-h-screen tech-bg-light font-sans selection:bg-orange-500 selection:text-white pb-20 w-full overflow-x-hidden">
      <Navbar /> 
      <div className="scanline"></div>
      
      <div className="pt-32 pb-10 px-6 max-w-7xl mx-auto w-full relative">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1 bg-white border border-orange-200 text-orange-600 rounded-full text-sm font-bold mb-6 shadow-sm"><Cpu size={14} /> INDUSTRIAL DATABASE V2.0</div>
          <h1 className="text-6xl md:text-8xl font-black text-slate-900 mb-6 tracking-tight leading-none">
            {settings.heroTitleCN || "未來工廠"} <br/>
            <span className="text-3xl md:text-4xl text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-red-600 font-bold tracking-widest block mt-2">{settings.heroTitleEN || "FUTURE FACTORY"}</span>
          </h1>
          <div className="max-w-md relative mt-8">
             <select value={searchRegion} onChange={(e) => setSearchRegion(e.target.value)} className="w-full p-4 pl-12 rounded-full border-2 border-slate-200 focus:border-orange-500 focus:outline-none shadow-lg text-lg appearance-none bg-white cursor-pointer"><option value="">顯示所有地區物件</option>{regions.map(r => <option key={r} value={r}>{r}</option>)}</select>
             <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500" /><div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">▼</div>
          </div>
        </motion.div>
        <div className="absolute top-10 right-0 opacity-10 hidden md:block"><Database size={200} /></div>
      </div>
      
      <div className="pl-6 max-w-7xl mx-auto w-full relative z-10 overflow-hidden mb-20">
        <div className="flex items-center justify-between mb-6 pr-6 border-b border-slate-200 pb-4"><h2 className="text-3xl font-bold flex items-center gap-3 text-slate-800"><span className="w-3 h-8 bg-orange-600 block"></span>精選案場</h2><div className="flex gap-4 items-center"><span className="font-mono text-slate-400 text-sm font-bold hidden md:block">SCROLL &rarr;</span><span className="font-mono text-slate-400 text-lg font-bold">DATA: {filteredProps.length}</span></div></div>
        {loading ? <div className="text-center py-20 text-2xl font-mono text-slate-400">LOADING DATA...</div> : (
          // 修改處：card 寬度設為 calc(100vw - 32px)，扣掉左右 padding，確保完全滿版
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
               <h2 className="text-3xl font-black text-slate-900 flex items-center gap-3"><Newspaper className="text-orange-600"/> 最新動態</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               {articles.length === 0 ? (
                  <div className="col-span-3 text-center text-slate-400 py-10 bg-white rounded-xl border border-slate-200">目前尚無文章</div>
               ) : (
                  articles.map((article) => (
                     <Link to={`/${article.category}`} key={article.id} className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition duration-300 group flex flex-col h-full relative">
                        <div className="h-48 overflow-hidden relative">
                           {article.image ? <img src={article.image} className="w-full h-full object-cover transition duration-500 group-hover:scale-110"/> : <div className="w-full h-full bg-slate-200 flex items-center justify-center text-slate-400">NO IMAGE</div>}
                           <span className={`absolute top-4 left-4 px-3 py-1 text-xs text-white font-bold rounded shadow ${getCatColor(article.category)}`}>{getCatName(article.category)}</span>
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

      <Footer />
    </div>
  );
};

export default Home;