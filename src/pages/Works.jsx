import React, { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Filter, Search, ArrowRight, Loader2, X, Building2, Ruler, DollarSign } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

// --- 篩選按鈕組件 ---
const FilterButton = ({ active, label, onClick, icon: Icon }) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all border ${
      active 
        ? 'bg-orange-600 border-orange-600 text-white shadow-lg shadow-orange-500/30' 
        : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white'
    }`}
  >
    {Icon && <Icon size={14} />}
    {label}
  </button>
);

const Works = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // 篩選狀態
  const [activeCity, setActiveCity] = useState('全部地區');
  const [activeType, setActiveType] = useState('全部類型');
  const [activeStatus, setActiveStatus] = useState('全部狀態');

  // 1. 從 Firebase 抓資料
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        // 預設依照建立時間排序 (最新的在前面)
        const q = query(collection(db, "properties"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        const list = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setProperties(list);
      } catch (error) {
        console.error("Error fetching properties:", error);
        // 如果還沒建立 index 或是欄位不存在，改用不排序抓取
        const querySnapshot = await getDocs(collection(db, "properties"));
        setProperties(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } finally {
        setLoading(false);
      }
    };
    fetchProperties();
  }, []);

  // 2. 取得所有不重複的選項 (用於產生篩選按鈕)
  const cities = useMemo(() => ['全部地區', ...new Set(properties.map(p => p.basicInfo?.city || '未分類').filter(Boolean))], [properties]);
  const types = useMemo(() => ['全部類型', ...new Set(properties.map(p => p.basicInfo?.propertyType || '未分類').filter(Boolean))], [properties]);

  // 3. 核心邏輯：過濾資料
  const filteredProperties = useMemo(() => {
    return properties.filter(item => {
      const info = item.basicInfo || {};
      
      // 搜尋關鍵字 (標題 或 地址)
      const matchesSearch = searchTerm === '' || 
        (info.title && info.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (info.address && info.address.toLowerCase().includes(searchTerm.toLowerCase()));

      // 篩選條件
      const matchesCity = activeCity === '全部地區' || info.city === activeCity;
      const matchesType = activeType === '全部類型' || info.propertyType === activeType;
      
      // 狀態篩選 (可擴充)
      const matchesStatus = activeStatus === '全部狀態' || 
        (activeStatus === '熱銷中' && info.showOnHome) ||
        (activeStatus === '已售出' && info.status === 'sold');

      return matchesSearch && matchesCity && matchesType && matchesStatus;
    });
  }, [properties, searchTerm, activeCity, activeType, activeStatus]);

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="animate-spin text-orange-500" size={40}/></div>;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-orange-500 selection:text-white">
      <Navbar />

      {/* --- 頂部搜尋與篩選區 --- */}
      <div className="pt-32 pb-12 px-6">
        <div className="max-w-7xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10 text-center md:text-left">
                <span className="text-orange-500 font-bold tracking-widest uppercase text-sm mb-2 block">Our Portfolio</span>
                <h1 className="text-4xl md:text-6xl font-black text-white mb-6">精選物件列表</h1>
                
                {/* 搜尋框 */}
                <div className="relative max-w-xl">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20}/>
                    <input 
                        type="text" 
                        placeholder="搜尋關鍵字：仁武、廠房、天車..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition shadow-xl"
                    />
                    {searchTerm && (
                        <button onClick={() => setSearchTerm('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                            <X size={16}/>
                        </button>
                    )}
                </div>
            </motion.div>

            {/* 篩選按鈕區 (可左右滑動) */}
            <div className="flex flex-col gap-4 mb-10">
                {/* 第一排：地區 */}
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    {cities.map(city => (
                        <FilterButton key={city} active={activeCity === city} label={city} onClick={() => setActiveCity(city)} icon={MapPin} />
                    ))}
                </div>
                {/* 第二排：類型 */}
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    {types.map(type => (
                        <FilterButton key={type} active={activeType === type} label={type} onClick={() => setActiveType(type)} icon={Building2} />
                    ))}
                </div>
            </div>

            {/* --- 列表結果區 --- */}
            <div className="flex justify-between items-end mb-6 border-b border-slate-800 pb-4">
                <div className="text-slate-400 font-bold">
                    共找到 <span className="text-orange-500 text-xl mx-1">{filteredProperties.length}</span> 筆物件
                </div>
                {/* 重置按鈕 */}
                {(activeCity !== '全部地區' || activeType !== '全部類型' || searchTerm) && (
                    <button 
                        onClick={() => { setActiveCity('全部地區'); setActiveType('全部類型'); setSearchTerm(''); }}
                        className="text-xs text-slate-500 hover:text-white underline transition"
                    >
                        清除所有條件
                    </button>
                )}
            </div>

            <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <AnimatePresence>
                    {filteredProperties.map((item) => {
                        const info = item.basicInfo || {};
                        return (
                            <motion.div
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                key={item.id}
                                className="group bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 hover:border-orange-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-orange-500/10 flex flex-col h-full"
                            >
                                <Link to={`/property/${item.id}`} className="block h-full flex flex-col">
                                    {/* 圖片區 */}
                                    <div className="relative aspect-[4/3] overflow-hidden">
                                        <div className="absolute inset-0 bg-slate-800 animate-pulse"></div>
                                        <img 
                                            src={info.thumb || 'https://via.placeholder.com/600x400?text=No+Image'} 
                                            alt={info.title} 
                                            className="w-full h-full object-cover transition duration-700 group-hover:scale-110 group-hover:brightness-110"
                                            loading="lazy"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80"></div>
                                        
                                        {/* 標籤區 */}
                                        <div className="absolute top-4 left-4 flex gap-2">
                                            {info.showOnHome && <span className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1"><span className="animate-pulse">🔥</span> 熱銷</span>}
                                            {info.isFeaturedWork && <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">💎 精選</span>}
                                        </div>
                                        
                                        <div className="absolute bottom-4 left-4 right-4">
                                            <div className="text-orange-400 font-bold text-xs mb-1 tracking-wider uppercase flex items-center gap-1">
                                                <MapPin size={12}/> {info.city} {info.address}
                                            </div>
                                            <h3 className="text-xl font-bold text-white leading-tight group-hover:text-orange-500 transition line-clamp-2">
                                                {info.title}
                                            </h3>
                                        </div>
                                    </div>

                                    {/* 資訊區 */}
                                    <div className="p-6 flex-1 flex flex-col justify-between relative bg-slate-900">
                                        {/* 背景紋理 */}
                                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none"></div>
                                        
                                        <div className="relative z-10 grid grid-cols-2 gap-4 mb-6">
                                            <div className="bg-slate-800/50 p-3 rounded-2xl border border-slate-800">
                                                <div className="text-xs text-slate-500 mb-1 flex items-center gap-1"><Ruler size={12}/> 地坪/建坪</div>
                                                <div className="font-bold text-slate-200">
                                                    {info.landPing || '-'} / {info.buildingPing || '-'} 坪
                                                </div>
                                            </div>
                                            <div className="bg-slate-800/50 p-3 rounded-2xl border border-slate-800">
                                                <div className="text-xs text-slate-500 mb-1 flex items-center gap-1"><Building2 size={12}/> 類型</div>
                                                <div className="font-bold text-slate-200">{info.propertyType}</div>
                                            </div>
                                        </div>

                                        <div className="relative z-10 flex items-center justify-between border-t border-slate-800 pt-4 mt-auto">
                                            <div className="text-2xl font-black text-white group-hover:text-orange-500 transition">
                                                {info.price} <span className="text-xs text-slate-500 font-normal">萬</span>
                                            </div>
                                            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-orange-600 group-hover:text-white transition duration-300">
                                                <ArrowRight size={18} className="-rotate-45 group-hover:rotate-0 transition duration-300"/>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </motion.div>

            {/* 無結果時顯示 */}
            {filteredProperties.length === 0 && (
                <div className="text-center py-20">
                    <div className="bg-slate-900 inline-block p-6 rounded-full mb-4">
                        <Search size={40} className="text-slate-700"/>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">沒有找到符合的物件</h3>
                    <p className="text-slate-500">試試看切換其他篩選條件，或是輸入其他關鍵字</p>
                    <button 
                        onClick={() => { setActiveCity('全部地區'); setActiveType('全部類型'); setSearchTerm(''); }}
                        className="mt-6 px-6 py-2 bg-orange-600 text-white rounded-full font-bold hover:bg-orange-500 transition"
                    >
                        清除篩選
                    </button>
                </div>
            )}
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Works;