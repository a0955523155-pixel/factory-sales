import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc, addDoc, collection } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { 
  MapPin, ArrowLeft, Calendar, Phone, QrCode, Smartphone,
  Activity, Zap, Grid, CheckCircle2, Send, Map
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

// --- 1. 建築理念 (修正圖片顯示問題) ---
const Concept = ({ data }) => {
  // 如果後台沒傳圖片，使用這張穩定的工業風預設圖
  const defaultImage = "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80";
  const bgImage = (data.image && data.image !== "") ? data.image : defaultImage;
  
  return (
    <section className="py-24 px-6 max-w-7xl mx-auto">
      <div className="relative flex flex-col lg:flex-row gap-16 items-center">
         
         {/* 左側圖片區：修正為滿版顯示，並強制最小高度 */}
         <div className="w-full lg:w-1/2 relative min-h-[400px]">
            <div className="absolute inset-0 rounded-3xl overflow-hidden shadow-2xl border border-slate-200">
                <img 
                  src={bgImage} 
                  className="w-full h-full object-cover hover:scale-105 transition duration-700" 
                  alt="Concept"
                  onError={(e) => { e.target.src = defaultImage; }} // 如果圖片載入失敗，強制切回預設圖
                />
            </div>
            {/* 裝飾性背框 */}
            <div className="absolute -inset-4 border-2 border-orange-500/20 rounded-3xl -z-10 transform rotate-3"></div>
         </div>
         
         {/* 右側文字區 */}
         <motion.div 
           initial={{ x: 50, opacity: 0 }} 
           whileInView={{ x: 0, opacity: 1 }} 
           className="w-full lg:w-1/2"
         >
           <span className="text-orange-600 font-mono font-bold tracking-widest uppercase mb-4 block">Design Concept</span>
           <h2 className="text-4xl md:text-5xl font-black mb-8 text-slate-800 leading-tight">
             {data.title || "設計理念"}
           </h2>
           <div className="text-lg leading-relaxed text-slate-600 whitespace-pre-line font-medium border-l-4 border-orange-500 pl-6">
             {data.content}
           </div>
         </motion.div>
      </div>
    </section>
  );
};

const SpecsAndFeatures = ({ specs, features }) => (
  <section className="py-20 px-6 max-w-7xl mx-auto">
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-5 bg-white p-8 rounded-3xl shadow-xl border border-slate-100 h-full flex flex-col">
         <h3 className="text-2xl font-black uppercase mb-8 flex items-center gap-3 text-slate-800"><Activity className="text-orange-500"/> 物件數據</h3>
         <div className="grid grid-cols-1 gap-3 flex-1">{specs.map((s, i) => (<div key={i} className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-200"><span className="text-xs text-slate-400 font-bold uppercase tracking-widest">{s.label}</span><span className="text-xl font-black text-slate-800 font-mono">{s.value}</span></div>))}</div>
      </div>
      <div className="lg:col-span-7 bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
         <h3 className="text-2xl font-black uppercase mb-8 flex items-center gap-3 text-slate-800"><Zap className="text-orange-500"/> 核心配置</h3>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{features.map((f, i) => (<div key={i} className="p-5 bg-orange-50/50 rounded-2xl border border-orange-100 hover:bg-orange-50 transition duration-300"><div className="flex items-start gap-3"><CheckCircle2 className="text-orange-500 mt-1 shrink-0" size={18}/><div><h4 className="font-bold text-slate-900 mb-1">{f.title}</h4><p className="text-sm text-slate-500">{f.desc}</p></div></div></div>))}</div>
      </div>
    </div>
  </section>
);

const Progress = ({ history }) => {
  if (!history || history.length === 0) return null;
  const sortedHistory = [...history].sort((a, b) => new Date(b.date) - new Date(a.date));
  return (
    <section className="py-24 bg-slate-50 relative overflow-hidden">
       <div className="max-w-6xl mx-auto px-6 relative z-10">
         <h2 className="text-3xl font-black text-center mb-16 uppercase text-slate-900">工程進度歷程</h2>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
            <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-slate-300 -translate-x-1/2"></div>
            {sortedHistory.map((item, index) => (
               <motion.div key={index} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-lg transition duration-300 relative group">
                  <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-3"><span className="font-mono text-orange-600 font-bold flex items-center gap-2"><Calendar size={14}/> {item.date}</span>{index === 0 && <span className="text-[10px] bg-orange-100 text-orange-700 px-2 py-1 rounded font-bold">LATEST</span>}</div>
                  <h3 className="text-xl font-bold text-slate-800">{item.status}</h3>
                  <div className={`hidden md:block absolute top-1/2 w-4 h-4 bg-orange-500 rounded-full border-4 border-slate-50 z-10 ${index % 2 === 0 ? '-right-[33px]' : '-left-[33px]'}`}></div>
               </motion.div>
            ))}
         </div>
       </div>
    </section>
  );
};

const LocationMap = ({ mapUrl, address }) => {
  if (!mapUrl) return null;
  return (
    <section className="py-20 px-6 max-w-7xl mx-auto">
       <div className="bg-white p-2 rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="bg-slate-900 px-8 py-4 flex items-center justify-between">
             <h3 className="text-white font-bold flex items-center gap-2"><Map className="text-orange-500"/> 物件位置</h3>
             <span className="text-slate-400 text-sm font-mono">{address}</span>
          </div>
          <div className="aspect-video w-full">
             <iframe src={mapUrl} width="100%" height="100%" style={{ border: 0 }} allowFullScreen="" loading="lazy" referrerPolicy="no-referrer-when-downgrade"></iframe>
          </div>
       </div>
    </section>
  );
};

const ContactSection = ({ agentName, agentPhone, lineId, lineQr }) => {
  const [form, setForm] = useState({ name: '', industry: '', needs: '', ping: '', phone: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleSubmit = async (e) => {
    e.preventDefault(); setIsSubmitting(true);
    try { await addDoc(collection(db, "customers"), { ...form, createdAt: new Date() }); alert(`感謝 ${form.name}！您的需求已送出。`); setForm({ name: '', industry: '', needs: '', ping: '', phone: '' }); } 
    catch (error) { alert("傳送失敗"); } setIsSubmitting(false);
  };
  return (
    <div className="py-24 bg-slate-900 text-white relative overflow-hidden mt-12">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
      <div className="max-w-7xl mx-auto px-6 relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16">
          <div>
            <span className="text-orange-500 font-mono font-bold uppercase tracking-widest mb-2 block">Contact Us</span>
            <h2 className="text-5xl font-black mb-8">預約賞屋與諮詢</h2>
            <div className="space-y-6">
               <a href={`tel:${agentPhone}`} className="flex items-center gap-6 p-6 bg-white/5 rounded-2xl border border-white/10 hover:bg-orange-600 hover:border-orange-500 transition duration-300 group"><div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white group-hover:text-orange-600 transition"><Phone size={28} /></div><div><p className="text-xs text-slate-400 uppercase tracking-widest group-hover:text-white">Call Agent</p><p className="text-2xl font-black">{agentPhone} <span className="text-base font-normal opacity-70">({agentName})</span></p></div></a>
               <div className="flex items-center gap-6 p-6 bg-white/5 rounded-2xl border border-white/10">{lineQr ? <img src={lineQr} className="w-24 h-24 rounded-lg bg-white object-contain" /> : <div className="w-24 h-24 rounded-lg bg-green-600/20 flex items-center justify-center text-green-500"><QrCode size={32} /></div>}<div className="flex-1"><p className="text-xs text-slate-400 uppercase tracking-widest">Add LINE Friend</p><p className="text-2xl font-black">{lineId || "無 ID"}</p>{lineId && <a href={`https://line.me/ti/p/~${lineId}`} target="_blank" className="text-sm text-green-400 hover:underline mt-1 block">點擊加好友</a>}</div></div>
            </div>
          </div>
          <div className="bg-white text-slate-900 p-8 md:p-10 rounded-3xl shadow-2xl">
             <h3 className="text-2xl font-black mb-6 flex items-center gap-2"><Send className="text-orange-600"/> 線上需求單</h3>
             <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4"><input required name="name" value={form.name} onChange={handleChange} placeholder="您的姓名 *" className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl focus:outline-none focus:border-orange-500" /><input name="phone" value={form.phone} onChange={handleChange} placeholder="聯絡電話 *" className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl focus:outline-none focus:border-orange-500" /></div>
                <input name="industry" value={form.industry} onChange={handleChange} placeholder="所屬行業" className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl focus:outline-none focus:border-orange-500" />
                <div className="grid grid-cols-2 gap-4"><input name="ping" value={form.ping} onChange={handleChange} placeholder="需求坪數" className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl focus:outline-none focus:border-orange-500" /><select name="needs" value={form.needs} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl focus:outline-none focus:border-orange-500 text-slate-500"><option value="">需求類型</option><option value="購地自建">購地自建</option><option value="購買廠房">購買廠房</option><option value="租賃">租賃</option><option value="投資">投資</option></select></div>
                <button type="submit" disabled={isSubmitting} className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl hover:bg-orange-600 transition shadow-lg mt-2">{isSubmitting ? "傳送中..." : "送出諮詢"}</button>
             </form>
          </div>
      </div>
    </div>
  );
};

const PropertyDetail = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  useEffect(() => { window.scrollTo(0, 0); const fetch = async () => { const docSnap = await getDoc(doc(db, "properties", id)); if (docSnap.exists()) setData(docSnap.data()); }; fetch(); }, [id]);
  if (!data) return <div className="h-screen bg-slate-50 flex items-center justify-center font-mono text-2xl">LOADING...</div>;
  const agentPhone = data.basicInfo?.agentPhone || "0800-000-000";

  return (
    <div className="font-sans min-h-screen text-slate-900 bg-slate-50">
      <Navbar /> 
      <div className="relative h-[90vh] w-full bg-slate-900 overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${data.basicInfo.thumb})` }} />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/grid-me.png')] opacity-20 pointer-events-none"></div>
        <div className="relative z-10 h-full flex flex-col justify-end pb-24 px-6 max-w-7xl mx-auto">
          <Link to="/" className="absolute top-28 left-6 md:left-auto text-white/80 flex items-center gap-2 hover:text-orange-400 bg-white/10 px-6 py-3 rounded-full backdrop-blur border border-white/10 font-bold transition"><ArrowLeft size={20}/> 回列表</Link>
          <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="md:w-3/4">
            <span className="bg-orange-600 text-white px-4 py-1 text-sm font-bold uppercase tracking-widest rounded-sm mb-6 inline-block shadow-lg shadow-orange-500/50">Premium Industrial Asset</span>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white mb-6 leading-tight drop-shadow-lg">{data.basicInfo.title}</h1>
            {data.basicInfo.subtitleEN && <p className="text-2xl text-orange-300 font-mono mb-8 tracking-widest uppercase">{data.basicInfo.subtitleEN}</p>}
            <div className="inline-flex flex-col md:flex-row gap-10 bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-3xl shadow-2xl"><div className="pr-10 md:border-r border-white/20"><p className="text-sm text-slate-300 uppercase mb-2 font-bold tracking-wider">Asking Price</p><p className="text-4xl lg:text-5xl font-black text-white">{data.basicInfo.price}</p></div><div><p className="text-sm text-slate-300 uppercase mb-2 font-bold tracking-wider">Location</p><div className="flex items-center gap-3 text-white text-2xl font-bold"><MapPin className="text-orange-500" size={28} />{data.basicInfo.address}</div></div></div>
          </motion.div>
        </div>
      </div>
      <Concept data={data.concept || {}} />
      <SpecsAndFeatures specs={data.specs || []} features={data.features || []} />
      <Progress history={data.progressHistory || []} />
      <LocationMap mapUrl={data.basicInfo.googleMapUrl} address={data.basicInfo.address} />
      {data.environmentList && data.environmentList.length > 0 && (
         <section className="py-24 px-6 max-w-7xl mx-auto">
             <div className="text-center mb-12"><h2 className="text-3xl font-black text-slate-900 mb-2">周邊環境 & 相關報導</h2><div className="w-16 h-1 mx-auto bg-orange-600"></div></div>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8">{data.environmentList.map((env, i) => (<div key={i} className="bg-white rounded-2xl overflow-hidden shadow-lg border border-slate-100 flex flex-col hover:-translate-y-2 transition duration-300"><div className="h-48 bg-slate-200">{env.image && <img src={env.image} className="w-full h-full object-cover"/>}</div><div className="p-6 flex-1 flex flex-col"><h3 className="font-bold text-lg mb-2">{env.title}</h3><p className="text-sm text-slate-500 mb-4 flex-1">{env.desc}</p>{env.link && <a href={env.link} target="_blank" className="text-orange-600 text-sm font-bold hover:underline mt-auto">閱讀更多 →</a>}</div></div>))}</div>
         </section>
      )}
      <ContactSection agentName={data.basicInfo.agentName} agentPhone={agentPhone} lineId={data.basicInfo.lineId} lineQr={data.basicInfo.lineQr}/>
      <Footer />
    </div>
  );
};

export default PropertyDetail;