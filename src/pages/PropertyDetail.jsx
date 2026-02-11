import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc, addDoc, collection } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { 
  MapPin, ArrowLeft, Activity, CheckCircle2, X, Star, Info, Filter, 
  Flame, Medal, Newspaper, ExternalLink, Share2, Check, 
  Loader2, Phone, MessageCircle, User, FileText, Send, 
  Calculator as CalcIcon, DollarSign 
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { recordView } from '../utils/analytics'; 
import MobileStickyBar from '../components/MobileStickyBar';

// ==========================================
// 1. 房貸試算機組件 (接收動態價格)
// ==========================================
const MortgageCalculator = ({ defaultPrice, sectionRef }) => {
  const [totalPrice, setTotalPrice] = useState(defaultPrice || 5000);
  const [loanRatio, setLoanRatio] = useState(70);
  const [rate, setRate] = useState(2.1);
  const [years, setYears] = useState(20);
  const [gracePeriod, setGracePeriod] = useState(0);
  const [result, setResult] = useState({ loanAmount: 0, selfPay: 0, monthlyPay: 0, gracePay: 0 });

  // 當外部傳入的價格改變時 (例如點了戶別)，自動更新這裡
  useEffect(() => {
    if(defaultPrice && defaultPrice > 0) {
        setTotalPrice(defaultPrice);
    }
  }, [defaultPrice]);

  useEffect(() => {
    const price = totalPrice || 0;
    const loan = price * 10000 * (loanRatio / 100);
    const self = price * 10000 - loan;
    const monthlyRate = rate / 100 / 12;
    const totalMonths = years * 12;
    const graceMonths = gracePeriod * 12;
    const actualMonths = totalMonths - graceMonths;
    const graceMonthlyPay = Math.round(loan * monthlyRate);
    
    let normalMonthlyPay = 0;
    if (monthlyRate > 0 && actualMonths > 0) {
        const pow = Math.pow(1 + monthlyRate, actualMonths);
        normalMonthlyPay = Math.round((loan * monthlyRate * pow) / (pow - 1));
    } else {
        normalMonthlyPay = Math.round(loan / (actualMonths || 1));
    }

    setResult({
      loanAmount: Math.round(loan / 10000),
      selfPay: Math.round(self / 10000),
      monthlyPay: normalMonthlyPay,
      gracePay: graceMonthlyPay
    });
  }, [totalPrice, loanRatio, rate, years, gracePeriod]);

  return (
    // 加入 ref 以便讓網頁可以捲動到這裡
    <section ref={sectionRef} className="py-10 px-6 max-w-7xl mx-auto scroll-mt-24">
      <div className="bg-slate-900 rounded-3xl border-2 border-orange-500/50 p-6 md:p-10 shadow-2xl relative overflow-hidden transition-all duration-500 hover:shadow-orange-500/20">
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-600/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
        
        <div className="flex items-center gap-3 mb-8 relative z-10 border-b border-slate-700 pb-4">
            <div className="bg-orange-600 p-3 rounded-full text-white shadow-lg shadow-orange-500/30">
                <CalcIcon size={24} />
            </div>
            <div>
                <h3 className="text-2xl font-black text-white">購置試算工具</h3>
                <p className="text-orange-400 text-sm font-bold tracking-wider uppercase">Mortgage Calculator</p>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 relative z-10">
            {/* 輸入區 */}
            <div className="space-y-6">
                <div>
                    <div className="flex justify-between text-white font-bold mb-2">
                        <label className="text-sm text-slate-400">物件總價 (萬)</label>
                        <span className="text-orange-500 text-xl">{totalPrice.toLocaleString()} 萬</span>
                    </div>
                    <input type="range" min="100" max="100000" step="10" value={totalPrice} onChange={e => setTotalPrice(Number(e.target.value))} className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-orange-600"/>
                    <input type="number" value={totalPrice} onChange={e => setTotalPrice(Number(e.target.value))} className="w-full mt-2 bg-slate-800 text-white p-2 rounded border border-slate-700"/>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div><label className="text-slate-400 text-xs font-bold mb-1 block uppercase">貸款成數 (%)</label><select value={loanRatio} onChange={e => setLoanRatio(Number(e.target.value))} className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 focus:border-orange-500 outline-none"><option value="50">5 成</option><option value="60">6 成</option><option value="70">7 成</option><option value="80">8 成</option></select></div>
                    <div><label className="text-slate-400 text-xs font-bold mb-1 block uppercase">年利率 (%)</label><input type="number" step="0.1" value={rate} onChange={e => setRate(Number(e.target.value))} className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 focus:border-orange-500 outline-none"/></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div><label className="text-slate-400 text-xs font-bold mb-1 block uppercase">貸款年限 (年)</label><select value={years} onChange={e => setYears(Number(e.target.value))} className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 focus:border-orange-500 outline-none"><option value="15">15 年</option><option value="20">20 年</option><option value="30">30 年</option></select></div>
                    <div><label className="text-slate-400 text-xs font-bold mb-1 block uppercase">寬限期 (年)</label><select value={gracePeriod} onChange={e => setGracePeriod(Number(e.target.value))} className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 focus:border-orange-500 outline-none"><option value="0">無寬限期</option><option value="1">1 年</option><option value="2">2 年</option><option value="3">3 年</option></select></div>
                </div>
            </div>

            {/* 結果區 */}
            <div className="bg-slate-800/80 rounded-2xl p-6 border border-slate-600 flex flex-col justify-center relative backdrop-blur-sm">
                <div className="space-y-6">
                    <div className="flex justify-between items-end border-b border-slate-600 pb-4">
                        <div><p className="text-slate-400 text-xs font-bold uppercase mb-1">自備款 ({100-loanRatio}%)</p><p className="text-2xl font-black text-white">{result.selfPay.toLocaleString()} <span className="text-sm font-normal text-slate-500">萬</span></p></div>
                        <div className="text-right"><p className="text-slate-400 text-xs font-bold uppercase mb-1">貸款金額</p><p className="text-2xl font-black text-orange-500">{result.loanAmount.toLocaleString()} <span className="text-sm font-normal text-white">萬</span></p></div>
                    </div>
                    <div>
                        <p className="text-slate-300 font-bold mb-3 flex items-center gap-2 text-sm uppercase tracking-wide"><DollarSign size={16} className="text-green-500"/> 預估月付金</p>
                        {gracePeriod > 0 && (
                            <div className="flex justify-between items-center mb-2 bg-slate-700/50 p-3 rounded-xl border border-slate-600/50">
                                <span className="text-xs font-bold text-slate-300">前 {gracePeriod} 年 (寬限期)</span>
                                <span className="text-lg font-black text-green-400">${result.gracePay.toLocaleString()}</span>
                            </div>
                        )}
                        <div className="flex justify-between items-center bg-slate-950 p-4 rounded-xl border border-orange-500/40 shadow-lg ring-1 ring-orange-500/20">
                            <span className="text-xs font-bold text-slate-300">{gracePeriod > 0 ? `第 ${gracePeriod + 1} 年起` : '本息攤還'}</span>
                            <span className="text-3xl font-black text-white">${result.monthlyPay.toLocaleString()} <span className="text-xs text-slate-500 font-normal">/月</span></span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </section>
  );
};

// ==========================================
// 2. 規格與特色
// ==========================================
const SpecsAndFeatures = ({ specs, features, title, description }) => (
  <section className="py-20 px-6 max-w-7xl mx-auto">
    <div className="bg-slate-900 rounded-3xl p-8 md:p-16 text-white relative overflow-hidden shadow-2xl">
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

// ==========================================
// 3. 周遭環境
// ==========================================
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

// ==========================================
// 4. 預約諮詢表單
// ==========================================
const ContactFormSection = ({ propertyId, propertyTitle }) => {
  const [form, setForm] = useState({ name: '', phone: '', lineId: '', message: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if(!form.name || !form.phone) return alert("請填寫姓名與電話");
    setSubmitting(true);
    try {
        await addDoc(collection(db, "properties_leads"), {
            propertyId, propertyTitle, 
            customerName: form.name, customerPhone: form.phone, customerLine: form.lineId, 
            message: form.message, createdAt: new Date(), status: 'new'
        });
        alert("資料已送出！專員將盡快與您聯繫。");
        setForm({ name: '', phone: '', lineId: '', message: '' });
    } catch(e) { console.error(e); alert("發生錯誤，請稍後再試"); }
    setSubmitting(false);
  };

  return (
    <section id="contact-section" className="py-20 px-6 bg-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent to-black/80"></div>
        <div className="max-w-4xl mx-auto relative z-10 text-center">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">預約賞屋與諮詢</h2>
            <p className="text-slate-400 mb-10">有興趣了解更多細節？歡迎填寫下方表單，或直接加入 LINE 聯繫</p>
            <form onSubmit={handleSubmit} className="bg-white/5 backdrop-blur-md border border-white/10 p-8 rounded-3xl text-left space-y-4 shadow-2xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label className="text-xs font-bold text-slate-400 uppercase ml-2 mb-1 block">您的稱呼 *</label><div className="relative"><User className="absolute left-3 top-3 text-slate-500" size={18}/><input required value={form.name} onChange={e=>setForm({...form, name:e.target.value})} className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-3 pl-10 text-white focus:border-orange-500 focus:outline-none transition" placeholder="王先生/小姐"/></div></div>
                    <div><label className="text-xs font-bold text-slate-400 uppercase ml-2 mb-1 block">聯絡電話 *</label><div className="relative"><Phone className="absolute left-3 top-3 text-slate-500" size={18}/><input required value={form.phone} onChange={e=>setForm({...form, phone:e.target.value})} className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-3 pl-10 text-white focus:border-orange-500 focus:outline-none transition" placeholder="0912-345-678"/></div></div>
                </div>
                <div><label className="text-xs font-bold text-slate-400 uppercase ml-2 mb-1 block">LINE ID (選填)</label><div className="relative"><MessageCircle className="absolute left-3 top-3 text-slate-500" size={18}/><input value={form.lineId} onChange={e=>setForm({...form, lineId:e.target.value})} className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-3 pl-10 text-white focus:border-orange-500 focus:outline-none transition" placeholder="方便我們加您好友"/></div></div>
                <div><label className="text-xs font-bold text-slate-400 uppercase ml-2 mb-1 block">留言內容</label><div className="relative"><FileText className="absolute left-3 top-3 text-slate-500" size={18}/><textarea value={form.message} onChange={e=>setForm({...form, message:e.target.value})} rows="3" className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-3 pl-10 text-white focus:border-orange-500 focus:outline-none transition" placeholder="我想詢問價格、預約看廠時間..."></textarea></div></div>
                <button disabled={submitting} className="w-full bg-gradient-to-r from-orange-600 to-red-600 text-white font-black py-4 rounded-xl hover:shadow-lg hover:shadow-orange-500/30 transition transform active:scale-95 flex items-center justify-center gap-2">{submitting ? <Loader2 className="animate-spin"/> : <Send size={20}/>}{submitting ? "傳送中..." : "送出諮詢"}</button>
            </form>
        </div>
    </section>
  );
};

// ==========================================
// 5. 戶別列表 (包含點擊後傳值給父層的功能)
// ==========================================
const UnitList = ({ units, onUnitSelect }) => {
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

  // 處理點擊戶別：開彈窗 + 通知父層更新價格
  const handleUnitClick = (unit) => {
    setSelectedUnit(unit);
    // 解析價格
    const priceNum = parseInt(unit.price?.replace(/[^\d]/g, '') || 0);
    if(priceNum > 0 && onUnitSelect) {
        onUnitSelect(priceNum);
    }
  };

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
                <div key={i} onClick={() => handleUnitClick(u)} className={`p-4 rounded-xl border-2 font-bold text-lg flex flex-col items-center justify-center h-32 relative transition cursor-pointer hover:-translate-y-1 hover:shadow-lg group overflow-hidden ${u.status === 'sold' ? 'bg-slate-100 border-slate-200 text-slate-400' : u.status === 'reserved' ? 'bg-yellow-50 border-yellow-400 text-yellow-700' : u.isHot ? 'bg-white border-red-500 text-slate-800 shadow-md ring-2 ring-red-100' : 'bg-white border-slate-200 text-slate-700 hover:border-orange-500'}`}>
                   <div className={`absolute top-3 right-3 w-3 h-3 rounded-full shadow-sm ${u.status === 'sold' ? 'bg-slate-300' : u.status === 'reserved' ? 'bg-yellow-400 animate-pulse' : 'bg-green-500'}`}></div>
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

// ==========================================
// 7. 主頁面 (PropertyDetail)
// ==========================================
const PropertyDetail = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0); 
  const [copied, setCopied] = useState(false);
  
  // ★★★ 新增：計算機的價格狀態 ★★★
  const [calcPrice, setCalcPrice] = useState(5000);
  
  // ★★★ 新增：計算機的 DOM 參考點 (為了自動捲動) ★★★
  const calculatorRef = useRef(null);

  useEffect(() => { 
    window.scrollTo(0, 0); 
    const fetch = async () => { 
      const docSnap = await getDoc(doc(db, "properties", id)); 
      if (docSnap.exists()) {
        const docData = docSnap.data();
        setData(docData);
        recordView(id, docData.basicInfo?.title, 'property');
        
        // 預設將計算機價格設為總價
        const defaultP = parseInt(docData.basicInfo?.price?.replace(/[^\d]/g, '') || 5000);
        setCalcPrice(defaultP);
      }
      setLoading(false);
    }; 
    fetch(); 
  }, [id]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ★★★ 當用戶點擊戶別列表的某一戶時 ★★★
  const handleUnitSelect = (price) => {
    setCalcPrice(price);
    // 平滑捲動到計算機
    if(calculatorRef.current) {
        calculatorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  if (loading) return <div className="min-h-screen flex justify-center items-center bg-slate-900"><Loader2 className="animate-spin text-orange-500" size={40}/></div>;
  if (!data) return null;

  const info = data.basicInfo || {};
  const displayImages = [info.thumb, ...(info.images || [])].filter(Boolean);
  const currentBg = displayImages[activeImage] || info.thumb;

  return (
    <div className="font-sans min-h-screen text-slate-900 bg-slate-50 pb-24 md:pb-0">
      
      {/* SEO 設定 */}
      <Helmet>
        <title>{info.title} | 綠芽團隊</title>
        <meta name="description" content={info.description ? info.description.substring(0, 150) : "優質工業地產物件推薦"} />
        <meta property="og:title" content={info.title} />
        <meta property="og:description" content={`${info.city} ${info.propertyType} | 售價 ${info.price}`} />
        <meta property="og:image" content={info.thumb} />
        <meta property="og:url" content={window.location.href} />
        <meta property="og:type" content="website" />
      </Helmet>

      <Navbar /> 
      
      {/* Hero Section */}
      <div className="relative h-[90vh] w-full bg-slate-900 overflow-hidden group">
        <div className="absolute inset-0 bg-cover bg-center transition-all duration-700 ease-in-out" style={{ backgroundImage: `url(${currentBg})` }} />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/grid-me.png')] opacity-20 pointer-events-none"></div>
        
        {displayImages.length > 1 && (
            <>
                <button onClick={() => setActiveImage((prev) => (prev - 1 + displayImages.length) % displayImages.length)} className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 p-3 rounded-full text-white backdrop-blur transition md:opacity-0 group-hover:opacity-100 z-20">
                    <ArrowLeft size={24} />
                </button>
                <button onClick={() => setActiveImage((prev) => (prev + 1) % displayImages.length)} className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 p-3 rounded-full text-white backdrop-blur transition md:opacity-0 group-hover:opacity-100 rotate-180 z-20">
                    <ArrowLeft size={24} />
                </button>
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                    {displayImages.map((_, idx) => (
                        <button key={idx} onClick={() => setActiveImage(idx)} className={`w-2 h-2 rounded-full transition-all ${activeImage === idx ? 'bg-orange-500 w-8' : 'bg-white/50 hover:bg-white'}`}/>
                    ))}
                </div>
            </>
        )}

        <div className="relative z-10 h-full flex flex-col justify-end pb-24 px-6 max-w-7xl mx-auto pointer-events-none">
          <Link to="/works" className="absolute top-28 left-6 text-white/80 flex items-center gap-2 hover:text-orange-400 bg-white/10 px-6 py-3 rounded-full backdrop-blur border border-white/10 font-bold transition pointer-events-auto"><ArrowLeft size={20}/> 回經典作品</Link>
          <button onClick={handleShare} className={`absolute top-28 right-6 text-white/80 flex items-center gap-2 hover:text-orange-400 px-6 py-3 rounded-full backdrop-blur border font-bold transition pointer-events-auto ${copied ? 'bg-green-600/80 border-green-500 text-white' : 'bg-white/10 border-white/10'}`}>
             {copied ? <Check size={20}/> : <Share2 size={20}/>}
             {copied ? "已複製連結" : "分享案場"}
          </button>

          <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="md:w-3/4 pointer-events-auto">
            <span className="bg-orange-600 text-white px-4 py-1 text-sm font-bold uppercase tracking-widest rounded-sm mb-6 inline-block shadow-lg shadow-orange-500/50">Premium Industrial Asset</span>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white mb-6 leading-tight drop-shadow-lg">{info.title}</h1>
            {info.subtitleEN && <p className="text-2xl text-orange-300 font-mono mb-8 tracking-widest uppercase">{info.subtitleEN}</p>}
            <div className="inline-flex flex-col md:flex-row gap-10 bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-3xl shadow-2xl"><div className="pr-10 md:border-r border-white/20"><p className="text-sm text-slate-300 uppercase mb-2 font-bold tracking-wider">Asking Price</p><p className="text-4xl lg:text-5xl font-black text-white">{info.price}</p></div><div><p className="text-sm text-slate-300 uppercase mb-2 font-bold tracking-wider">Location</p><div className="flex items-center gap-3 text-white text-2xl font-bold"><MapPin className="text-orange-500" size={28} />{info.address}</div></div></div>
          </motion.div>
        </div>
      </div>
      
      <SpecsAndFeatures specs={data.specs || []} features={data.features || []} title={info.title} description={info.description} />
      
      <SurroundingsSection list={data.environmentList || []} />

      {/* ★★★ 將 UnitList 的點擊事件傳遞給父層 ★★★ */}
      <UnitList units={data.units || []} onUnitSelect={handleUnitSelect} />
      
      {/* ★★★ 計算機放在戶別列表下方，並接收 calcPrice 狀態 ★★★ */}
      <MortgageCalculator defaultPrice={calcPrice} sectionRef={calculatorRef} />

      <LocationMap mapUrl={info.googleMapUrl} address={info.address} />

      <ContactFormSection propertyId={id} propertyTitle={info.title} />

      <Footer />
      
      <MobileStickyBar agentPhone={info.agentPhone} lineId={info.lineId} title={info.title} />
    </div>
  );
};

export default PropertyDetail;