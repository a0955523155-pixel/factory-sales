import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, getDocs, limit, query, orderBy, where, doc, getDoc } from 'firebase/firestore';
import { Link } from 'react-router-dom';
// ★★★ 確保這裡有引入 Helmet ★★★
import { Helmet } from 'react-helmet-async';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ContactSection from '../components/ContactSection';
import { ArrowRight, MapPin, Newspaper, Megaphone, Flame } from 'lucide-react';

const Home = () => {
  const [properties, setProperties] = useState([]);
  const [latestNews, setLatestNews] = useState([]);
  const [globalSettings, setGlobalSettings] = useState({ heroTitleCN: "未來工廠", heroTitleEN: "FUTURE FACTORY" });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const propRef = collection(db, "properties");
        let q = query(propRef, where("basicInfo.showOnHome", "==", true), limit(6)); 
        let propSnap = await getDocs(q);
        
        if (propSnap.empty) {
           q = query(propRef, orderBy("updatedAt", "desc"), limit(3));
           propSnap = await getDocs(q);
        }

        const propList = [];
        propSnap.forEach((doc) => propList.push({ id: doc.id, ...doc.data() }));
        setProperties(propList);

       // --- 修改 Home.jsx 中的 fetchData 區段 ---
const newsRef = collection(db, "articles");
const categories = ['news_local', 'news_project', 'academy'];
const newsList = [];

// 分別為三個分類執行查詢，各取一筆最新的
for (const cat of categories) {
  const q = query(
    newsRef, 
    where("category", "==", cat), 
    orderBy("createdAt", "desc"), 
    limit(1)
  );
  const snap = await getDocs(q);
  snap.forEach((doc) => newsList.push({ id: doc.id, ...doc.data() }));
}

// 依照分類固定順序顯示 (或是您可以依照時間重新排序)
setLatestNews(newsList);

        const settingsSnap = await getDoc(doc(db, "settings", "global"));
        if (settingsSnap.exists()) setGlobalSettings(settingsSnap.data());

      } catch (error) {
        console.error("Error fetching home data:", error);
      }
    };
    fetchData();
  }, []);

  const getProjectStatus = (item) => {
    const units = item.units || [];
    const totalUnits = units.length;
    if (totalUnits === 0) return { type: 'coming', label: '即將上市', subLabel: '敬請期待', priceDisplay: '價格研擬中' };
    const availableUnits = units.filter(u => u.status === 'available');
    const availableCount = availableUnits.length;
    if (availableCount === 0) return { type: 'soldout', label: '全案完售', subLabel: 'SOLD OUT', priceDisplay: item.basicInfo.price };
    const prices = availableUnits.map(u => parseFloat(u.price?.replace(/[^0-9.]/g, '') || 0)).filter(n => n > 0);
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
    const displayPrice = minPrice > 0 ? `${minPrice} 萬起` : item.basicInfo.price;
    return { type: 'selling', label: '熱銷中', count: availableCount, priceDisplay: displayPrice };
  };

  return (
    <div className="font-sans text-slate-900 bg-white selection:bg-orange-100 selection:text-orange-900">
      
      {/* ★★★ SEO 設定 (首頁門面版) ★★★ */}
      <Helmet>
        <title>綠芽團隊｜高雄、屏東廠房與工業地買賣出租首選品牌</title>
        <meta name="description" content="專注於高雄與屏東地區的工業地產開發與銷售。綠芽團隊提供專業的廠房買賣、工業地出租、農地與建地投資諮詢服務。整合交通優勢與產業聚落，為您的企業尋找最佳生產據點！" />
        <meta name="keywords" content="高雄廠房, 屏東廠房, 工業地買賣, 廠房出租, 天車廠房, 綠芽團隊, 高雄不動產, 農地買賣,大成工業城,九大工業城,華富工業城,新鎮工業城,弓鼎工業城,工業城,可廠登,合法廠房" />
        <meta property="og:title" content="綠芽團隊｜高雄屏東工業地產專業顧問" />
        <meta property="og:type" content="website" />
      </Helmet>

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
            {properties.map((item) => {
              const status = getProjectStatus(item);
              return (
                <Link to={`/property/${item.basicInfo.title}`} key={item.id} className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl transition duration-500 transform hover:-translate-y-2 flex flex-col h-full relative">
                  <div className="relative h-72 overflow-hidden bg-slate-200">
                    {item.basicInfo.thumb ? (
                      <img src={item.basicInfo.thumb} alt={item.basicInfo.title} className={`w-full h-full object-cover transition duration-700 ${status.type === 'soldout' ? 'grayscale opacity-50' : 'group-hover:scale-110'}`} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold">NO IMAGE</div>
                    )}
                    
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80 group-hover:opacity-60 transition" />
                    
                    {status.type === 'coming' && <div className="absolute inset-0 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm"><div className="text-center"><span className="block text-2xl font-black text-white tracking-widest mb-1">{status.label}</span><span className="text-sm font-bold text-blue-300 uppercase tracking-widest">{status.subLabel}</span></div></div>}
                    {status.type === 'soldout' && <div className="absolute inset-0 flex items-center justify-center bg-black/60"><div className="border-4 border-white/80 p-4 transform -rotate-12"><span className="text-3xl font-black text-white tracking-widest uppercase">SOLD OUT</span></div></div>}
                    {status.type === 'selling' && <div className="absolute top-4 right-4 bg-orange-600 text-white px-3 py-1.5 rounded-lg font-bold text-sm shadow-lg flex items-center gap-1 animate-pulse"><Flame size={14} fill="currentColor"/> 剩餘 {status.count} 戶</div>}

                    <div className="absolute bottom-6 left-6 text-white">
                      <h3 className="text-2xl font-bold leading-tight mb-1 drop-shadow-md">{item.basicInfo.title}</h3>
                      <p className="text-sm opacity-90 flex items-center gap-1"><MapPin size={14}/> {item.basicInfo.city} {item.basicInfo.transactionType || '出售'}</p>
                    </div>
                  </div>

                  <div className="p-8 flex flex-col flex-1">
                    <p className="text-slate-500 line-clamp-2 mb-6 h-12 text-sm leading-relaxed">{item.basicInfo.description}</p>
                    <div className="mt-auto flex justify-between items-center border-t border-slate-100 pt-6">
                      <div className="flex flex-col"><span className="text-xs font-bold text-slate-400 uppercase">{status.type === 'coming' ? '預計售價' : status.type === 'soldout' ? '成交總價' : '最低總價'}</span><span className={`text-2xl font-black ${status.type === 'soldout' ? 'text-slate-400 line-through decoration-2' : 'text-slate-900'}`}>{status.priceDisplay}</span></div>
                      <span className="text-orange-600 font-bold text-sm flex items-center gap-1 group-hover:gap-2 transition-all">詳情 <ArrowRight size={16}/></span>
                    </div>
                  </div>
                </Link>
              );
            })}
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

{/* ✅ 修正後的最新動態卡片 (含圖片與去標籤解析) */}
<div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
  {latestNews.map((news) => (
    <Link to={`/article/${news.id}`} key={news.id} className="group block cursor-pointer">
      {/* 圖片顯示區 */}
      <div className="aspect-video w-full mb-4 overflow-hidden rounded-2xl bg-slate-100 shadow-sm">
        {news.image ? (
          <img 
            src={news.image} 
            alt="" 
            className="w-full h-full object-cover group-hover:scale-105 transition duration-500" 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300 bg-slate-100">
            <FileText size={40} />
          </div>
        )}
      </div>

      <span className={`text-[10px] font-bold px-2 py-1 rounded text-white mb-3 inline-block ${
        news.category === 'news_local' ? 'bg-blue-500' : 
        news.category === 'academy' ? 'bg-purple-500' : 'bg-green-500'
      }`}>
         {news.category === 'news_local' ? '本地新聞' : 
          news.category === 'academy' ? '小學堂' : '建案新訊'}
      </span>
      
      {/* 標題：解析 HTML 樣式 */}
      <h3 
        className="text-lg font-bold text-slate-900 mb-2 group-hover:text-orange-600 transition ql-editor line-clamp-2"
        style={{ padding: 0, minHeight: 'auto' }}
        dangerouslySetInnerHTML={{ __html: news.title }} 
      />
      
      {/* 內文摘要：過濾 HTML 標籤 */}
      <p className="text-slate-500 text-sm mb-4 line-clamp-2 leading-relaxed">
        {news.content ? news.content.replace(/<[^>]*>?/gm, '').substring(0, 60) : ''}...
      </p>
      
      <div className="flex items-center justify-between text-xs text-slate-300">
        <span className="font-mono">{news.date}</span>
        <span className="text-orange-500 font-bold opacity-0 group-hover:opacity-100 transition">閱讀全文 →</span>
      </div>
    </Link>
  ))}
</div>

          <div className="flex flex-col md:flex-row gap-6 justify-center">
             <Link to="/news/local" className="group relative bg-slate-900 text-white px-8 py-5 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all w-full md:w-auto min-w-[240px] text-center">
                <div className="absolute inset-0 bg-blue-600 opacity-0 group-hover:opacity-100 transition duration-500"></div>
                <div className="relative z-10 flex flex-col items-center"><Newspaper className="mb-2 w-8 h-8 opacity-80"/><span className="text-lg font-bold">查看本地新聞</span><span className="text-xs text-slate-400 group-hover:text-blue-100 mt-1">Local News & Updates</span></div>
             </Link>
             <Link to="/news/project" className="group relative bg-slate-900 text-white px-8 py-5 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all w-full md:w-auto min-w-[240px] text-center">
                <div className="absolute inset-0 bg-green-600 opacity-0 group-hover:opacity-100 transition duration-500"></div>
                <div className="relative z-10 flex flex-col items-center"><Megaphone className="mb-2 w-8 h-8 opacity-80"/><span className="text-lg font-bold">查看新案消息</span><span className="text-xs text-slate-400 group-hover:text-green-100 mt-1">New Projects & Launches</span></div>
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