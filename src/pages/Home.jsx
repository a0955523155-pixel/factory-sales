import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
// FIX: 補上 doc, getDoc
import { collection, getDocs, limit, query, orderBy, where, doc, getDoc } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ContactSection from '../components/ContactSection';
import { ArrowRight, MapPin, Newspaper, Megaphone } from 'lucide-react';

const Home = () => {
  const [properties, setProperties] = useState([]);
  const [latestNews, setLatestNews] = useState([]);
  const [globalSettings, setGlobalSettings] = useState({ heroTitleCN: "未來工廠", heroTitleEN: "FUTURE FACTORY" });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const propRef = collection(db, "properties");
        
        // 1. 優先抓取「設為首頁熱銷」的案子
        let q = query(propRef, where("basicInfo.showOnHome", "==", true), limit(6)); 
        let propSnap = await getDocs(q);
        
        // 2. 如果沒有設定任何熱銷，則抓取最新的 3 筆
        if (propSnap.empty) {
           q = query(propRef, orderBy("updatedAt", "desc"), limit(3));
           propSnap = await getDocs(q);
        }

        const propList = [];
        propSnap.forEach((doc) => propList.push({ id: doc.id, ...doc.data() }));
        setProperties(propList);

        // 3. 抓新聞
        const newsRef = collection(db, "articles");
        const newsSnap = await getDocs(query(newsRef, orderBy("createdAt", "desc"), limit(3)));
        const newsList = [];
        newsSnap.forEach((doc) => newsList.push({ id: doc.id, ...doc.data() }));
        setLatestNews(newsList);

        // 4. 抓全域設定
        const settingsSnap = await getDoc(doc(db, "settings", "global"));
        if (settingsSnap.exists()) setGlobalSettings(settingsSnap.data());

      } catch (error) {
        console.error("Error fetching home data:", error);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="font-sans text-slate-900 bg-white selection:bg-orange-100 selection:text-orange-900">
      <Navbar />

      <header className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop" 
            alt="Factory Background" 
            className="w-full h-full object-cover brightness-50"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80" />
        </div>

        <div className="relative z-10 text-center px-6 max-w-5xl mx-auto mt-20">
          <span className="text-orange-400 font-bold tracking-[0.3em] uppercase mb-4 block animate-fadeIn">Premium Industrial Assets</span>
          <h1 className="text-6xl md:text-8xl font-black text-white mb-6 leading-tight tracking-tight drop-shadow-2xl animate-slideUp">
            {globalSettings.heroTitleCN}
            <span className="block text-2xl md:text-3xl font-light text-slate-300 mt-2 tracking-widest font-mono opacity-80">{globalSettings.heroTitleEN}</span>
          </h1>
          <p className="text-slate-300 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed font-light">
            專注於工業地產開發與銷售，為您的企業尋找最佳據點。整合交通優勢與產業聚落，打造極具競爭力的生產基地。
          </p>
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <Link to="/works" className="bg-orange-600 text-white px-10 py-4 rounded-full font-bold hover:bg-orange-700 transition transform hover:scale-105 shadow-lg shadow-orange-900/50 flex items-center justify-center gap-2">
              瀏覽經典案件 <ArrowRight size={20}/>
            </Link>
            <Link to="/contact" className="bg-white/10 backdrop-blur-md border border-white/30 text-white px-10 py-4 rounded-full font-bold hover:bg-white hover:text-slate-900 transition flex items-center justify-center gap-2">
              預約諮詢
            </Link>
          </div>
        </div>
        
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-60 animate-bounce">
          <span className="text-white text-xs tracking-widest uppercase">Scroll</span>
          <div className="w-[1px] h-12 bg-gradient-to-b from-white to-transparent"></div>
        </div>
      </header>

      <section className="py-24 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-end mb-12">
            <div>
              <span className="text-orange-600 font-bold tracking-widest uppercase text-sm">Featured Projects</span>
              <h2 className="text-4xl md:text-5xl font-black text-slate-900 mt-2">熱銷建案</h2>
            </div>
            <Link to="/works" className="hidden md:flex items-center gap-2 font-bold text-slate-500 hover:text-orange-600 transition">
              查看全部 <ArrowRight size={18}/>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {properties.map((item) => (
              <Link to={`/property/${item.id}`} key={item.id} className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl transition duration-500 transform hover:-translate-y-2">
                <div className="relative h-72 overflow-hidden bg-slate-200">
                  {/* FIX: 檢查圖片網址是否存在 */}
                  {item.basicInfo.thumb ? (
                    <img src={item.basicInfo.thumb} alt={item.basicInfo.title} className="w-full h-full object-cover group-hover:scale-110 transition duration-700" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold">NO IMAGE</div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80 group-hover:opacity-60 transition" />
                  <div className="absolute bottom-6 left-6 text-white">
                    <span className="bg-orange-600 text-xs font-bold px-3 py-1 rounded-full mb-2 inline-block shadow-lg">New Arrival</span>
                    <h3 className="text-2xl font-bold leading-tight mb-1">{item.basicInfo.title}</h3>
                    <p className="text-sm opacity-90 flex items-center gap-1"><MapPin size={14}/> {item.basicInfo.city} {item.basicInfo.usageType}</p>
                  </div>
                </div>
                <div className="p-8">
                  <p className="text-slate-500 line-clamp-2 mb-6 h-12 text-sm leading-relaxed">{item.basicInfo.description}</p>
                  <div className="flex justify-between items-center border-t border-slate-100 pt-6">
                    <span className="text-2xl font-black text-slate-900">{item.basicInfo.price}</span>
                    <span className="text-orange-600 font-bold text-sm flex items-center gap-1 group-hover:gap-2 transition-all">詳情 <ArrowRight size={16}/></span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          
          <Link to="/works" className="md:hidden mt-10 flex items-center justify-center gap-2 font-bold text-slate-600 bg-white border border-slate-200 py-4 rounded-xl shadow-sm">
            查看全部案件 <ArrowRight size={18}/>
          </Link>
        </div>
      </section>

      <section className="py-24 px-6 bg-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-slate-50 skew-x-12 translate-x-20 -z-0" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <span className="text-orange-600 font-bold tracking-widest uppercase text-sm">Latest Updates</span>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mt-2">最新動態</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {latestNews.map((news) => (
              <div key={news.id} className="border-b border-slate-100 pb-8 last:border-0 md:border-0 md:pb-0">
                <span className={`text-[10px] font-bold px-2 py-1 rounded text-white mb-3 inline-block ${news.category.includes('local') ? 'bg-blue-500' : 'bg-green-500'}`}>
                   {news.category.includes('local') ? '本地新聞' : '新案消息'}
                </span>
                <h3 className="text-xl font-bold text-slate-900 mb-2 hover:text-orange-600 transition cursor-pointer">{news.title}</h3>
                <p className="text-slate-400 text-sm mb-4 line-clamp-2">{news.content}</p>
                <span className="text-xs text-slate-300 font-mono">{news.date}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col md:flex-row gap-6 justify-center">
             <Link to="/news/local" className="group relative bg-slate-900 text-white px-8 py-5 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all w-full md:w-auto min-w-[240px] text-center">
                <div className="absolute inset-0 bg-blue-600 opacity-0 group-hover:opacity-100 transition duration-500"></div>
                <div className="relative z-10 flex flex-col items-center">
                   <Newspaper className="mb-2 w-8 h-8 opacity-80"/>
                   <span className="text-lg font-bold">查看本地新聞</span>
                   <span className="text-xs text-slate-400 group-hover:text-blue-100 mt-1">Local News & Updates</span>
                </div>
             </Link>

             <Link to="/news/project" className="group relative bg-slate-900 text-white px-8 py-5 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all w-full md:w-auto min-w-[240px] text-center">
                <div className="absolute inset-0 bg-green-600 opacity-0 group-hover:opacity-100 transition duration-500"></div>
                <div className="relative z-10 flex flex-col items-center">
                   <Megaphone className="mb-2 w-8 h-8 opacity-80"/>
                   <span className="text-lg font-bold">查看新案消息</span>
                   <span className="text-xs text-slate-400 group-hover:text-green-100 mt-1">New Projects & Launches</span>
                </div>
             </Link>
          </div>

        </div>
      </section>

      <ContactSection dark={true} />
      <Footer />
    </div>
  );
};

export default Home;