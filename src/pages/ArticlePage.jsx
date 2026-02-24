import React, { useEffect, useState, useMemo } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ContactSection from '../components/ContactSection';
import { Calendar, ArrowRight, MapPin, Filter, Search, Building2, Ruler, Banknote, Map, Briefcase, Award, Flame } from 'lucide-react';
import { Link } from 'react-router-dom';
// ★★★ 確保這裡有引入 Helmet ★★★
import { Helmet } from 'react-helmet-async';

const ArticlePage = ({ categoryGroup, category, title }) => {
  const [dataList, setDataList] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // 篩選狀態
  const [filters, setFilters] = useState({
    city: 'All', district: 'All', type: 'All', transaction: 'All', usage: 'All', price: 'All', ping: 'All'
  });

  const isWorksPage = categoryGroup === 'works';

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const collectionName = isWorksPage ? "properties" : "articles";
        let q;
        try { q = query(collection(db, collectionName), orderBy(isWorksPage ? "updatedAt" : "createdAt", "desc")); } 
        catch (e) { q = query(collection(db, collectionName)); }
        
        const snap = await getDocs(q);
        const list = [];
        
        snap.forEach((doc) => {
          const item = doc.data();
          if (!isWorksPage) {
             if (category && item.category === category) list.push({ id: doc.id, ...item });
             else if (categoryGroup && item.category?.includes(categoryGroup)) list.push({ id: doc.id, ...item });
             else if (!category && !categoryGroup) list.push({ id: doc.id, ...item });
          } else {
             // 計算該案場的「總」坪數 (僅用於卡片顯示)
             const totalPing = item.units ? item.units.reduce((acc, u) => acc + (parseFloat(u.ping) || 0), 0) : 0;
             const addr = item.basicInfo?.address || "";
             const districtMatch = addr.match(/(?:縣|市)(\S+?(?:區|鄉|鎮|市))/);
             const district = districtMatch ? districtMatch[1] : '其他';
             list.push({ id: doc.id, ...item, computedPing: totalPing, computedDistrict: district });
          }
        });
        setDataList(list);
      } catch (error) { console.error(error); } finally { setLoading(false); }
    };
    fetchData();
  }, [categoryGroup, category, isWorksPage]);

  // --- 指定坪數區間選項 ---
  const pingOptions = [
    { label: '不限坪數', value: 'All' },
    { label: '80 ~ 120 坪', value: '80-120' },
    { label: '120 ~ 200 坪', value: '120-200' },
    { label: '200 坪以上', value: '>200' }
  ];

  // 狀態邏輯
  const getProjectStatus = (item) => {
    const units = item.units || [];
    const totalUnits = units.length;
    if (totalUnits === 0) return { type: 'coming', label: '即將上市', subLabel: 'Coming Soon', priceDisplay: '價格研擬中' };
    const availableUnits = units.filter(u => u.status === 'available');
    if (availableUnits.length === 0) return { type: 'soldout', label: '完售', subLabel: 'SOLD', priceDisplay: item.basicInfo?.price };
    const prices = availableUnits.map(u => parseFloat(u.price?.replace(/[^0-9.]/g, '') || 0)).filter(n => n > 0);
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
    const displayPrice = minPrice > 0 ? `${minPrice} 萬起` : item.basicInfo?.price;
    return { type: 'selling', label: '熱銷', count: availableUnits.length, priceDisplay: displayPrice };
  };

  const filteredWorks = useMemo(() => {
    if (!isWorksPage) return [];
    return dataList.filter(item => {
      const info = item.basicInfo || {}; 
      if (filters.city !== 'All' && info.city !== filters.city) return false;
      if (filters.district !== 'All' && item.computedDistrict !== filters.district) return false;
      if (filters.type !== 'All' && info.propertyType !== filters.type) return false;
      if (filters.transaction !== 'All' && info.transactionType !== filters.transaction) return false;
      if (filters.usage !== 'All' && info.usageType !== filters.usage) return false;
      
      // 價格篩選
      if (filters.price !== 'All') {
        const priceVal = parseFloat(info.price?.replace(/[^0-9.]/g, '') || 0);
        if (filters.price === '<1000' && priceVal >= 1000) return false;
        if (filters.price === '1000-3000' && (priceVal < 1000 || priceVal > 3000)) return false;
        if (filters.price === '3000-6000' && (priceVal < 3000 || priceVal > 6000)) return false;
        if (filters.price === '>6000' && priceVal <= 6000) return false;
      }

      // --- 坪數篩選 (針對戶別) ---
      if (filters.ping !== 'All') {
        let hasMatchingUnit = false;
        
        if (filters.ping === '>200') {
            hasMatchingUnit = (item.units || []).some(u => {
                const p = parseFloat(u.ping);
                return !isNaN(p) && p >= 200;
            });
        } else {
            const [minStr, maxStr] = filters.ping.split('-');
            const min = parseFloat(minStr);
            const max = parseFloat(maxStr);
            
            hasMatchingUnit = (item.units || []).some(u => {
                const p = parseFloat(u.ping);
                return !isNaN(p) && p >= min && p <= max;
            });
        }

        if (!hasMatchingUnit) return false;
      }
      return true;
    });
  }, [dataList, filters, isWorksPage]);

  const groupedWorks = useMemo(() => {
    const groups = {};
    filteredWorks.forEach(item => { const type = item.basicInfo?.propertyType || '未分類'; if (!groups[type]) groups[type] = []; groups[type].push(item); });
    Object.keys(groups).forEach(key => { groups[key].sort((a, b) => (b.basicInfo?.isFeaturedWork === true ? 1 : 0) - (a.basicInfo?.isFeaturedWork === true ? 1 : 0)); });
    return groups;
  }, [filteredWorks]);

  const availableDistricts = useMemo(() => {
    const districts = new Set(dataList.map(i => i.computedDistrict).filter(Boolean));
    return ['All', ...Array.from(districts).sort()];
  }, [dataList]);

  const FilterSelect = ({ icon: Icon, label, value, onChange, options }) => (
    <div className="flex flex-col gap-1 w-full sm:w-auto flex-1 min-w-[140px]">
      <label className="text-xs font-bold text-slate-400 flex items-center gap-1"><Icon size={10}/> {label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full bg-white border border-slate-200 text-slate-700 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-orange-500 font-bold shadow-sm">
        {options.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
      </select>
    </div>
  );

  return (
    <div className="font-sans min-h-screen bg-slate-50 flex flex-col">
      
      {/* ★★★ SEO 設定 (列表與文章版) ★★★ */}
      <Helmet>
        <title>{`${title || '精選列表'}｜高雄屏東工業地產與最新市場資訊｜綠芽團隊`}</title>
        <meta name="description" content={isWorksPage 
          ? "瀏覽綠芽團隊精選的高雄與屏東廠房、工業地、農地物件列表。透過多條件快速篩選，精準找到符合您企業需求的廠房與土地。" 
          : "綠芽團隊房地產小學堂與最新動態。掌握大高雄與屏東工業地產最新法規、稅務解析、區域發展建設利多與實價登錄行情。"} 
        />
        <meta property="og:title" content={`${title || '精選列表'}｜綠芽團隊`} />
        <meta property="og:description" content={isWorksPage ? "高雄屏東優質廠房/工業地精選推薦" : "房地產小學堂與最新動態"} />
        <meta property="og:type" content="website" />
      </Helmet>

      <Navbar />
      <div className="bg-slate-900 pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
           <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">{title}</h1>
           <div className="w-20 h-1 bg-orange-500 mx-auto rounded-full"></div>
        </div>
      </div>

      {isWorksPage ? (
        <div className="flex-1 max-w-7xl mx-auto px-6 py-12 w-full">
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100 mb-12 -mt-24 relative z-10">
             <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3"><Filter className="text-orange-500" size={20}/><span className="font-black text-slate-800 text-lg">快速找房</span></div>
             <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                <FilterSelect icon={Map} label="縣市" value={filters.city} onChange={v => setFilters({...filters, city: v})} options={[{label:'所有縣市', value:'All'}, {label:'高雄市', value:'高雄'}, {label:'屏東縣', value:'屏東'}]} />
                <FilterSelect icon={MapPin} label="區域" value={filters.district} onChange={v => setFilters({...filters, district: v})} options={availableDistricts.map(d => ({label: d==='All'?'所有區域':d, value: d}))} />
                <FilterSelect icon={Building2} label="案件屬性" value={filters.type} onChange={v => setFilters({...filters, type: v})} options={[{label:'所有屬性', value:'All'}, {label:'工業地', value:'工業地'}, {label:'農地', value:'農地'}, {label:'建地', value:'建地'}]} />
                <FilterSelect icon={Briefcase} label="交易類別" value={filters.transaction} onChange={v => setFilters({...filters, transaction: v})} options={[{label:'不限', value:'All'}, {label:'出售', value:'出售'}, {label:'出租', value:'出租'}]} />
                <FilterSelect icon={Building2} label="用途" value={filters.usage} onChange={v => setFilters({...filters, usage: v})} options={[{label:'不限', value:'All'}, {label:'廠房', value:'廠房'}, {label:'透天', value:'透天'}, {label:'農地', value:'農地'}]} />
                <FilterSelect icon={Banknote} label="預算總價" value={filters.price} onChange={v => setFilters({...filters, price: v})} options={[{label:'不限預算', value:'All'}, {label:'1000萬以下', value:'<1000'}, {label:'1000-3000萬', value:'1000-3000'}, {label:'3000-6000萬', value:'3000-6000'}, {label:'6000萬以上', value:'>6000'}]} />
                <FilterSelect icon={Ruler} label="坪數" value={filters.ping} onChange={v => setFilters({...filters, ping: v})} options={pingOptions} />
             </div>
             <button onClick={() => setFilters({ city: 'All', district: 'All', type: 'All', transaction: 'All', usage: 'All', price: 'All', ping: 'All' })} className="mt-4 w-full bg-slate-100 text-slate-500 px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-200 transition">重置篩選</button>
          </div>

          {loading ? (
            <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-t-4 border-orange-500"></div></div>
          ) : Object.keys(groupedWorks).length === 0 ? (
            <div className="text-center py-20 text-slate-400 bg-white rounded-3xl border border-dashed border-slate-300"><Search size={48} className="mx-auto mb-4 opacity-20"/><p className="text-lg font-bold">沒有符合篩選條件的物件</p></div>
          ) : (
            <div className="space-y-16">
              {Object.entries(groupedWorks).map(([type, items]) => (
                <div key={type} className="animate-fadeIn">
                  <div className="flex items-center gap-4 mb-8"><h2 className="text-3xl font-black text-slate-800">{type}精選</h2><div className="h-[1px] flex-1 bg-slate-200"></div><span className="text-sm font-bold text-slate-400 bg-white px-3 py-1 rounded-full border border-slate-200">{items.length} 個案件</span></div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {items.map((item) => {
                      const status = getProjectStatus(item);
                      return (
                      <Link to={`/property/${item.basicInfo?.title || item.id}`} key={item.id} className={`group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition duration-500 border flex flex-col h-full transform hover:-translate-y-1 relative ${item.basicInfo?.isFeaturedWork ? 'border-orange-200 ring-2 ring-orange-100' : 'border-slate-100'}`}>
                        <div className="relative h-64 overflow-hidden bg-slate-100">
                          {item.basicInfo?.thumb ? <img src={item.basicInfo.thumb} alt={item.basicInfo.title} className={`w-full h-full object-cover transition duration-700 ${status.type === 'soldout' ? 'grayscale opacity-50' : 'group-hover:scale-110'}`} /> : <div className="w-full h-full flex items-center justify-center text-slate-300 font-bold">NO IMAGE</div>}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60 group-hover:opacity-40 transition" />
                          
                          {status.type === 'coming' && <div className="absolute inset-0 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm"><span className="text-xl font-black text-white tracking-widest border-2 border-white px-4 py-1">COMING SOON</span></div>}
                          {status.type === 'soldout' && <div className="absolute inset-0 flex items-center justify-center bg-black/60"><span className="text-3xl font-black text-white tracking-widest uppercase transform -rotate-12 border-4 border-white/80 p-2">SOLD OUT</span></div>}
                          {status.type === 'selling' && <span className="absolute top-12 right-2 bg-orange-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-md flex items-center gap-1 animate-pulse"><Flame size={10}/> 剩 {status.count} 戶</span>}

                          <div className="absolute top-4 left-4 flex gap-2">
                             {item.basicInfo?.isFeaturedWork && <span className="bg-blue-600 text-white text-[10px] font-black px-2 py-1 rounded shadow-md flex items-center gap-1"><Award size={10}/> 熱銷</span>}
                             {item.basicInfo?.transactionType === '出租' && <span className="bg-green-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-md">出租</span>}
                             <span className="bg-slate-900/80 text-white text-[10px] font-bold px-2 py-1 rounded backdrop-blur-sm">{item.basicInfo?.city || '未分類'}</span>
                          </div>
                          <div className="absolute bottom-4 left-4 text-white">
                             <h3 className="text-xl font-bold leading-tight mb-1 drop-shadow-md">{item.basicInfo?.title || '未命名案件'}</h3>
                             <p className="text-xs opacity-90 font-mono">{item.computedPing > 0 ? `總坪數約 ${item.computedPing.toFixed(2)} 坪` : '詳情請洽專員'}</p>
                          </div>
                        </div>
                        <div className="p-5 flex flex-col flex-1">
                          <div className="flex justify-between items-center mb-4">
                             <span className={`text-2xl font-black ${status.type === 'soldout' ? 'text-slate-400 line-through' : 'text-orange-600'}`}>{status.priceDisplay}</span>
                             <span className="text-xs text-slate-400 font-bold border border-slate-200 px-2 py-1 rounded">{item.basicInfo?.transactionType || '出售'}</span>
                          </div>
                          <p className="text-slate-500 text-sm line-clamp-2 mb-4 flex-1">{item.basicInfo?.description || '暫無描述...'}</p>
                          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-sm font-bold text-slate-600 group-hover:text-orange-600 transition"><span>了解更多</span><ArrowRight size={16}/></div>
                        </div>
                      </Link>
                    )})}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* News List */
        <div className="flex-1 max-w-7xl mx-auto px-6 py-16 w-full">
          {loading ? ( <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-t-4 border-orange-500"></div></div> ) : dataList.length === 0 ? ( <div className="text-center py-20 text-slate-400 bg-white rounded-3xl border border-dashed border-slate-300"><p className="text-lg font-bold">目前尚無相關文章</p></div> ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {dataList.map((article) => (
                <Link to={`/article/${article.id}`} key={article.id} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition duration-300 group border border-slate-100 flex flex-col h-full cursor-pointer">
                  <div className="aspect-video w-full overflow-hidden bg-slate-100 relative">
                     {article.image ? ( <img src={article.image} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" /> ) : ( <div className="w-full h-full flex items-center justify-center text-slate-300 bg-slate-50 font-black text-2xl">NO IMAGE</div> )}
                     <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-slate-800 shadow-sm flex items-center gap-1"><Calendar size={12} className="text-orange-500"/> {article.date}</div>
                  </div>
                  <div className="p-6 flex flex-col flex-1">
                    <h3 className="text-xl font-bold text-slate-800 mb-3 line-clamp-2 leading-tight group-hover:text-orange-600 transition">{article.title}</h3>
                    <p className="text-slate-500 text-sm line-clamp-3 mb-6 flex-1 leading-relaxed">{article.content ? article.content.substring(0, 100).replace(/[#*`]/g, '') : ''}...</p>
                    <span className="text-orange-600 font-bold text-sm flex items-center gap-1 group-hover:gap-2 transition-all mt-auto">閱讀更多 <ArrowRight size={16}/></span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      <ContactSection dark={false} />
      <Footer />
    </div>
  );
};

export default ArticlePage;