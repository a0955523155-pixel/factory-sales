import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { MapPin, ArrowRight, Database, Cpu } from 'lucide-react';
import { motion } from 'framer-motion';

const Home = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({ heroTitleCN: "未來工廠", heroTitleEN: "FUTURE FACTORY" });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const settingSnap = await getDoc(doc(db, "settings", "global"));
        if (settingSnap.exists()) setSettings(settingSnap.data());
      } catch(e) {}
      const querySnapshot = await getDocs(collection(db, "properties"));
      const list = [];
      querySnapshot.forEach((doc) => list.push({ id: doc.id, ...doc.data() }));
      setProperties(list);
      setLoading(false);
    };
    fetchData();
  }, []);

  return (
    <div className="min-h-screen tech-bg-light font-sans selection:bg-orange-500 selection:text-white pb-20">
      <Navbar /> 
      <div className="scanline"></div>
      <div className="pt-32 pb-16 px-6 max-w-7xl mx-auto w-full relative">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1 bg-white border border-orange-200 text-orange-600 rounded-full text-sm font-bold mb-6 shadow-sm"><Cpu size={14} /> INDUSTRIAL DATABASE V2.0</div>
          <h1 className="text-6xl md:text-8xl font-black text-slate-900 mb-6 tracking-tight leading-none">
            {settings.heroTitleCN || "未來工廠"} <br/>
            <span className="text-3xl md:text-4xl text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-red-600 font-bold tracking-widest block mt-2">{settings.heroTitleEN || "FUTURE FACTORY"}</span>
          </h1>
          <p className="text-slate-500 text-xl font-medium max-w-2xl border-l-4 border-orange-500 pl-6 leading-relaxed">為企業主打造的智能工業地產平台。<br/>數據化分析，即時掌握全台工業用地與廠房資訊。</p>
        </motion.div>
        <div className="absolute top-10 right-0 opacity-10 hidden md:block"><Database size={200} /></div>
      </div>
      
      <div className="px-6 max-w-7xl mx-auto w-full relative z-10">
        <div className="flex items-center justify-between mb-10 border-b border-slate-200 pb-4"><h2 className="text-3xl font-bold flex items-center gap-3 text-slate-800"><span className="w-3 h-8 bg-orange-600 block"></span>精選案場</h2><span className="font-mono text-slate-400 text-lg font-bold">DATA: {properties.length} ITEMS</span></div>
        {loading ? <div className="text-center py-20 text-2xl font-mono text-slate-400">LOADING DATA...</div> : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {properties.map((item, index) => (
              <motion.div key={item.id} initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }}>
                <Link to={`/property/${item.id}`} className="group block bg-white border border-slate-200 hover:border-orange-500 transition-all duration-300 relative overflow-hidden rounded-2xl shadow-sm hover:shadow-2xl hover:-translate-y-2">
                  <div className="h-72 overflow-hidden relative"><img src={item.basicInfo?.thumb || "https://via.placeholder.com/400x300"} alt={item.basicInfo?.title} className="w-full h-full object-cover transition duration-700 group-hover:scale-110"/><div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 text-xs font-bold font-mono border border-slate-200 rounded">ID: {item.id.slice(0,6)}</div></div>
                  <div className="p-8">
                    <div className="mb-4"><h3 className="text-2xl font-bold text-slate-900 group-hover:text-orange-600 transition line-clamp-1">{item.basicInfo?.title}</h3><p className="text-slate-500 mt-1 line-clamp-1">{item.basicInfo?.subtitle}</p></div>
                    <div className="flex items-center gap-2 text-slate-500 mb-6 pb-6 border-b border-slate-100"><MapPin size={18} className="text-orange-500" /><span className="text-lg">{item.basicInfo?.address}</span></div>
                    <div className="flex justify-between items-center"><span className="text-2xl font-black text-slate-900">{item.basicInfo?.price}</span><div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-orange-600 group-hover:text-white transition"><ArrowRight size={20}/></div></div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default Home;