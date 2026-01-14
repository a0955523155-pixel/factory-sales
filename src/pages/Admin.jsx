import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, getDocs, doc, updateDoc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { X, Plus, Trash2, Link as LinkIcon, Settings, Layout, Users, Search, Map as MapIcon, Upload, Languages, FileText, Home } from 'lucide-react';

const safeStr = (val) => (val === undefined || val === null) ? "" : String(val);

// --- 圖片壓縮 + 自動浮水印 ---
const compressImage = (file, watermarkText = "Factory Pro") => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxWidth = 1000; // 稍微加大一點以保持浮水印清晰
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        // 繪製圖片
        ctx.drawImage(img, 0, 0, width, height);
        
        // 繪製浮水印 (右下角)
        const fontSize = width * 0.03; // 動態字體大小
        ctx.font = `bold ${fontSize}px Arial`;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'; // 半透明白字
        ctx.textAlign = 'right';
        ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
        ctx.shadowBlur = 4;
        ctx.fillText(watermarkText, width - 20, height - 20);

        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
    };
  });
};

const Admin = () => {
  const [viewMode, setViewMode] = useState('properties'); 
  const [properties, setProperties] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [editId, setEditId] = useState(null);
  const [activeTab, setActiveTab] = useState('content');

  // 案場表單 (新增 titleEN)
  const [formData, setFormData] = useState({ 
    title: '', titleEN: '', subtitle: '', price: '', address: '', 
    agentPhone: '', agentName: '', lineId: '', lineQr: '', 
    googleMapUrl: '', thumb: '', images: [] 
  });
  const [specs, setSpecs] = useState([{ id: 's1', label: "總建坪", value: "" }]);
  const [features, setFeatures] = useState([{ id: 'f1', title: "特色標題", desc: "" }]);
  const [concept, setConcept] = useState({ title: "建築理念", content: "", image: "" }); 
  const [envList, setEnvList] = useState([{ id: 'e1', title: "", desc: "", image: "", link: "" }]);
  const [progressList, setProgressList] = useState([{ id: 'p1', date: '', status: '' }]);
  const [units, setUnits] = useState([{ id: 'u1', number: 'A1', ping: '', price: '', status: 'available', layout: '' }]);

  // 文章表單
  const [articleForm, setArticleForm] = useState({ category: 'news', title: '', content: '', date: '', image: '' });
  const [editArticleId, setEditArticleId] = useState(null);

  const [globalSettings, setGlobalSettings] = useState({
    siteName: "Factory Pro",
    heroTitleCN: "未來工廠",
    heroTitleEN: "FUTURE FACTORY",
    contactPhone: "0800-666-738"
  });

  useEffect(() => { 
    fetchProperties(); fetchGlobalSettings(); fetchCustomers(); fetchArticles();
  }, []);

  const fetchProperties = async () => {
    try { const snap = await getDocs(collection(db, "properties")); const list = []; snap.forEach((doc) => list.push({ id: doc.id, ...doc.data() })); setProperties(list); } catch (e) {}
  };
  const fetchArticles = async () => {
    try { const snap = await getDocs(collection(db, "articles")); const list = []; snap.forEach((doc) => list.push({ id: doc.id, ...doc.data() })); list.sort((a, b) => new Date(b.date) - new Date(a.date)); setArticles(list); } catch (e) {}
  };
  const fetchGlobalSettings = async () => {
    try { const docSnap = await getDoc(doc(db, "settings", "global")); if (docSnap.exists()) setGlobalSettings(docSnap.data()); } catch (e) {}
  };
  const fetchCustomers = async () => {
    try { const snap = await getDocs(collection(db, "customers")); const list = []; snap.forEach((doc) => list.push({ id: doc.id, ...doc.data() })); list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)); setCustomers(list); } catch (e) {}
  };

  // --- 翻譯功能 (主標題) ---
  const handleTranslate = async () => {
    if (!formData.title) return alert("請先輸入中文主標題");
    setTranslating(true);
    try {
      const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(formData.title)}&langpair=zh-TW|en`);
      const data = await response.json();
      if (data.responseData.translatedText) setFormData(prev => ({ ...prev, titleEN: data.responseData.translatedText }));
    } catch (error) {}
    setTranslating(false);
  };

  const handleSaveSettings = async () => {
    setLoading(true); await setDoc(doc(db, "settings", "global"), globalSettings); alert("設定已更新"); window.location.reload(); setLoading(false);
  };
  const handleDeleteProperty = async (e, id) => { e.stopPropagation(); if (!window.confirm("確定刪除此案場？")) return; await deleteDoc(doc(db, "properties", id)); fetchProperties(); };
  const handleDeleteArticle = async (id) => { if (!window.confirm("確定刪除此文章？")) return; await deleteDoc(doc(db, "articles", id)); fetchArticles(); };

  const loadEdit = (item) => {
    setEditId(item.id);
    const info = item.basicInfo || {};
    setFormData({
      title: safeStr(info.title), titleEN: safeStr(info.titleEN), subtitle: safeStr(info.subtitle),
      price: safeStr(info.price), address: safeStr(info.address), agentPhone: safeStr(info.agentPhone), agentName: safeStr(info.agentName),
      lineId: safeStr(info.lineId), lineQr: safeStr(info.lineQr), googleMapUrl: safeStr(info.googleMapUrl),
      thumb: safeStr(info.thumb), images: Array.isArray(info.images) ? info.images : []
    });
    setSpecs(Array.isArray(item.specs) ? item.specs : []);
    setFeatures(Array.isArray(item.features) ? item.features : []);
    setConcept({ title: safeStr(item.concept?.title), content: safeStr(item.concept?.content), image: safeStr(item.concept?.image) });
    setEnvList(item.environmentList || []); setProgressList(item.progressHistory || []); setUnits(item.units || []);
  };

  const loadEditArticle = (item) => { setEditArticleId(item.id); setArticleForm({ ...item }); };

  // 上傳圖片 (含浮水印)
  const handleUpload = async (e, callback) => {
    const file = e.target.files[0];
    if (!file) return;
    setCompressing(true);
    try { const compressed = await compressImage(file, globalSettings.siteName); callback(compressed); } catch (e) {}
    setCompressing(false);
  };

  const resetForm = () => {
    setEditId(null);
    setFormData({ title: '', titleEN: '', subtitle: '', price: '', address: '', agentPhone: '', agentName: '', lineId: '', lineQr: '', googleMapUrl: '', thumb: '', images: [] });
    setSpecs([{ id: `s-${Date.now()}`, label: "總建坪", value: "" }]); setFeatures([{ id: `f-${Date.now()}`, title: "特色標題", desc: "" }]);
    setConcept({ title: "建築理念", content: "", image: "" }); setEnvList([{ id: `e-${Date.now()}`, title: "", desc: "", image: "", link: "" }]);
    setProgressList([{ id: `p-${Date.now()}`, date: "", status: "" }]); setUnits([{ id: `u-${Date.now()}`, number: '', ping: '', price: '', status: 'available', layout: '' }]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    const payload = { basicInfo: formData, specs, features, concept, environmentList: envList, progressHistory: progressList, units, images: formData.images, updatedAt: new Date() };
    if (editId) await updateDoc(doc(db, "properties", editId), payload); else await addDoc(collection(db, "properties"), payload);
    alert("案場儲存成功！"); window.location.reload(); setLoading(false);
  };

  const handleArticleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    const payload = { ...articleForm, updatedAt: new Date() };
    if (editArticleId) await updateDoc(doc(db, "articles", editArticleId), payload); else await addDoc(collection(db, "articles"), payload);
    alert("文章儲存成功！"); setArticleForm({ category: 'news', title: '', content: '', date: '', image: '' }); setEditArticleId(null); fetchArticles(); setLoading(false);
  };

  const inputStyle = "w-full bg-white border border-slate-300 text-slate-800 p-2 text-sm focus:outline-none focus:border-orange-500 rounded-sm";
  const labelStyle = "block text-[10px] font-bold text-slate-500 mb-1 tracking-wider uppercase";

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-slate-100 text-slate-800 font-sans overflow-hidden">
      <div className="w-full lg:w-64 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-4 border-b"><h2 className="font-black text-xl mb-4 text-slate-900">ADMIN PANEL</h2><div className="flex flex-col gap-2"><button onClick={() => setViewMode('properties')} className={`flex items-center gap-2 px-3 py-2 rounded text-sm font-bold ${viewMode === 'properties' ? 'bg-orange-50 text-orange-600' : 'text-slate-500 hover:bg-slate-50'}`}><Layout size={16}/> 案場管理</button><button onClick={() => setViewMode('articles')} className={`flex items-center gap-2 px-3 py-2 rounded text-sm font-bold ${viewMode === 'articles' ? 'bg-orange-50 text-orange-600' : 'text-slate-500 hover:bg-slate-50'}`}><FileText size={16}/> 文章/新聞管理</button><button onClick={() => setViewMode('customers')} className={`flex items-center gap-2 px-3 py-2 rounded text-sm font-bold ${viewMode === 'customers' ? 'bg-orange-50 text-orange-600' : 'text-slate-500 hover:bg-slate-50'}`}><Users size={16}/> 客戶資料表</button><button onClick={() => setViewMode('settings')} className={`flex items-center gap-2 px-3 py-2 rounded text-sm font-bold ${viewMode === 'settings' ? 'bg-orange-50 text-orange-600' : 'text-slate-500 hover:bg-slate-50'}`}><Settings size={16}/> 網站設定</button></div></div>
        {viewMode === 'properties' && (<div className="flex-1 overflow-y-auto p-2 space-y-2"><div className="flex justify-between items-center px-2 mb-2"><span className="text-xs font-bold text-slate-400">PROJECTS</span><button onClick={resetForm} className="text-orange-500 text-xs hover:underline">+ NEW</button></div>{properties.map(p => (<div key={p.id} onClick={() => loadEdit(p)} className={`p-3 border cursor-pointer hover:bg-slate-50 rounded flex justify-between items-center group ${editId === p.id ? 'border-orange-500 bg-orange-50' : 'border-slate-200'}`}><div className="font-bold text-sm truncate w-24">{p.basicInfo.title}</div><button onClick={(e) => handleDeleteProperty(e, p.id)} className="text-slate-400 hover:text-red-600 opacity-0 group-hover:opacity-100"><Trash2 size={14} /></button></div>))}</div>)}
      </div>
      <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden">
        {viewMode === 'settings' && (<div className="p-8 max-w-2xl mx-auto w-full"><h1 className="text-2xl font-black mb-8">網站全域設定</h1><div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 space-y-6"><div><label className={labelStyle}>左上角網站名稱</label><input value={globalSettings.siteName} onChange={e=>setGlobalSettings({...globalSettings, siteName: e.target.value})} className={inputStyle} /></div><div className="grid grid-cols-2 gap-4"><div><label className={labelStyle}>首頁大標題 (中文)</label><input value={globalSettings.heroTitleCN} onChange={e=>setGlobalSettings({...globalSettings, heroTitleCN: e.target.value})} className={inputStyle} /></div><div><label className={labelStyle}>首頁大標題 (英文)</label><input value={globalSettings.heroTitleEN} onChange={e=>setGlobalSettings({...globalSettings, heroTitleEN: e.target.value})} className={inputStyle} /></div></div><div><label className={labelStyle}>全站聯絡電話</label><input value={globalSettings.contactPhone} onChange={e=>setGlobalSettings({...globalSettings, contactPhone: e.target.value})} className={inputStyle} /></div><button onClick={handleSaveSettings} disabled={loading} className="bg-slate-900 text-white px-8 py-3 rounded font-bold hover:bg-orange-600 transition w-full">{loading ? "儲存中..." : "儲存設定"}</button></div></div>)}
        {viewMode === 'customers' && (<div className="p-8 w-full max-w-6xl mx-auto overflow-y-auto"><h1 className="text-2xl font-black mb-8">客戶諮詢資料表</h1><div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"><table className="w-full text-sm text-left"><thead className="bg-slate-100 text-slate-600 font-bold uppercase text-xs"><tr><th className="p-4">日期</th><th className="p-4">姓名</th><th className="p-4">電話</th><th className="p-4">行業</th><th className="p-4">需求</th><th className="p-4">坪數</th></tr></thead><tbody>{customers.map(c => (<tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50"><td className="p-4 font-mono text-slate-500">{new Date(c.createdAt?.seconds * 1000).toLocaleDateString()}</td><td className="p-4 font-bold">{c.name}</td><td className="p-4 text-orange-600">{c.phone}</td><td className="p-4">{c.industry}</td><td className="p-4">{c.needs}</td><td className="p-4">{c.ping}</td></tr>))}</tbody></table></div></div>)}
        {viewMode === 'articles' && (<div className="flex h-full"><div className="w-1/3 border-r border-slate-200 bg-white p-4 overflow-y-auto"><button onClick={() => {setEditArticleId(null); setArticleForm({ category: 'news', title: '', content: '', date: '', image: '' });}} className="w-full bg-slate-900 text-white py-2 rounded mb-4 text-sm font-bold">+ 新增文章</button>{articles.map(a => (<div key={a.id} onClick={()=>loadEditArticle(a)} className={`p-3 border mb-2 rounded cursor-pointer ${editArticleId===a.id ? 'border-orange-500 bg-orange-50' : 'border-slate-100'}`}><span className={`text-[10px] px-2 py-0.5 rounded text-white ${a.category==='news'?'bg-blue-500':a.category==='academy'?'bg-green-500':'bg-purple-500'}`}>{a.category}</span><div className="font-bold text-sm mt-1">{a.title}</div><button onClick={(e) => {e.stopPropagation(); handleDeleteArticle(a.id);}} className="text-xs text-red-400 mt-2 hover:underline">刪除</button></div>))}</div><div className="w-2/3 p-8 overflow-y-auto"><h2 className="text-xl font-black mb-6">{editArticleId ? '編輯文章' : '新增文章'}</h2><div className="space-y-4 max-w-2xl"><div><label className={labelStyle}>分類</label><select value={articleForm.category} onChange={e=>setArticleForm({...articleForm, category: e.target.value})} className={inputStyle}><option value="news">市場最新消息</option><option value="academy">房地產小學堂</option><option value="cases">成交案例分享</option></select></div><div><label className={labelStyle}>標題</label><input value={articleForm.title} onChange={e=>setArticleForm({...articleForm, title: e.target.value})} className={inputStyle}/></div><div><label className={labelStyle}>日期</label><input type="date" value={articleForm.date} onChange={e=>setArticleForm({...articleForm, date: e.target.value})} className={inputStyle}/></div><div><label className={labelStyle}>內容</label><textarea value={articleForm.content} onChange={e=>setArticleForm({...articleForm, content: e.target.value})} className={`${inputStyle} h-40`}/></div><div><label className={labelStyle}>封面圖 (自動加浮水印)</label><div className="flex gap-2"><input type="file" onChange={e=>handleUpload(e, (url)=>setArticleForm({...articleForm, image: url}))} className="text-xs"/>{articleForm.image && <img src={articleForm.image} className="h-20 w-20 object-cover border"/>}</div></div><button onClick={handleArticleSubmit} disabled={loading} className="bg-slate-900 text-white px-6 py-2 rounded hover:bg-orange-600 w-full">{loading ? "處理中..." : "發布文章"}</button></div></div></div>)}
        {viewMode === 'properties' && (<><div className="p-4 border-b bg-white flex justify-between items-center"><h1 className="font-bold">{editId ? '編輯案場' : '新增案場'}</h1><button onClick={handleSubmit} disabled={loading || compressing} className="bg-slate-800 text-white px-6 py-2 text-sm font-bold hover:bg-black disabled:bg-gray-400 rounded">{compressing ? '圖片處理中...' : loading ? '存檔中...' : '儲存專案'}</button></div><div className="flex-1 overflow-y-auto p-8 max-w-4xl mx-auto w-full"><div className="space-y-12 pb-20">
                  <section className="space-y-4"><h3 className="font-bold text-lg border-l-4 border-orange-500 pl-2">基本資料</h3><div className="grid grid-cols-2 gap-4"><div className="col-span-2"><label className={labelStyle}>標題</label><input value={formData.title} onChange={e=>setFormData({...formData, title:e.target.value})} className={inputStyle}/></div><div className="col-span-2"><div className="flex gap-2"><input value={formData.titleEN} onChange={e=>setFormData({...formData, titleEN:e.target.value})} className={inputStyle} placeholder="Title (EN)" /><button onClick={handleTranslate} disabled={translating} className="bg-slate-800 text-white px-3 text-xs rounded">{translating?"...":"AI翻譯"}</button></div></div><div className="col-span-2"><label className={labelStyle}>副標題</label><input value={formData.subtitle} onChange={e=>setFormData({...formData, subtitle:e.target.value})} className={inputStyle}/></div><div><label className={labelStyle}>價格</label><input value={formData.price} onChange={e=>setFormData({...formData, price:e.target.value})} className={inputStyle}/></div><div><label className={labelStyle}>地址</label><input value={formData.address} onChange={e=>setFormData({...formData, address:e.target.value})} className={inputStyle}/></div><div className="col-span-2"><label className={labelStyle}>Google地圖網址</label><input value={formData.googleMapUrl} onChange={e=>setFormData({...formData, googleMapUrl:e.target.value})} className={inputStyle}/></div><div><label className={labelStyle}>電話</label><input value={formData.agentPhone} onChange={e=>setFormData({...formData, agentPhone:e.target.value})} className={inputStyle}/></div><div><label className={labelStyle}>姓名</label><input value={formData.agentName} onChange={e=>setFormData({...formData, agentName:e.target.value})} className={inputStyle}/></div><div><label className={labelStyle}>LINE ID</label><input value={formData.lineId} onChange={e=>setFormData({...formData, lineId:e.target.value})} className={inputStyle}/></div><div><label className={labelStyle}>LINE QR</label><input type="file" onChange={e=>handleUpload(e, (url)=>setFormData({...formData, lineQr: url}))} className="text-xs"/></div><div className="col-span-2"><label className={labelStyle}>封面圖</label><input type="file" onChange={e=>handleUpload(e, (url)=>setFormData({...formData, thumb: url}))} className="text-xs"/></div></div></section>
                  <section className="space-y-4"><div className="flex justify-between items-center"><h3 className="font-bold text-lg border-l-4 border-orange-500 pl-2">戶別銷控表</h3><button onClick={()=>setUnits([...units, {id: Date.now(), number:'', ping:'', price:'', status:'available', layout:''}])} className="text-orange-500 text-xs">+ 新增</button></div><div className="grid grid-cols-5 gap-2">{units.map((u, i) => (<div key={i} className="grid grid-cols-5 gap-2 bg-white p-2 border rounded"><input value={u.number} onChange={e=>{const x=[...units];x[i].number=e.target.value;setUnits(x)}} placeholder="戶號"/><input value={u.ping} onChange={e=>{const x=[...units];x[i].ping=e.target.value;setUnits(x)}} placeholder="坪數"/><input value={u.price} onChange={e=>{const x=[...units];x[i].price=e.target.value;setUnits(x)}} placeholder="價格"/><select value={u.status} onChange={e=>{const x=[...units];x[i].status=e.target.value;setUnits(x)}}><option value="available">可售</option><option value="sold">已售</option></select><button onClick={()=>setUnits(units.filter((_,idx)=>idx!==i))} className="text-red-400">X</button></div>))}</div></section>
                  <section className="space-y-4"><h3 className="font-bold text-lg border-l-4 border-orange-500 pl-2">案場理念</h3><input value={concept.title} onChange={e=>setConcept({...concept, title:e.target.value})} className={inputStyle} /><textarea value={concept.content} onChange={e=>setConcept({...concept, content:e.target.value})} className={`${inputStyle} h-32`}/><input type="file" onChange={e=>handleUpload(e, (url)=>setConcept({...concept, image: url}))} className="text-xs"/></section>
                  <section className="space-y-4"><div className="flex justify-between"><h3 className="font-bold text-lg border-l-4 border-orange-500 pl-2">周遭環境</h3><button onClick={()=>setEnvList([...envList, {id: Date.now(), title:"", desc:"", image:"", link:""}])} className="text-orange-500 text-xs">+ 新增</button></div>{envList.map((env, i) => (<div key={i} className="bg-white p-2 border rounded mb-2"><input value={env.title} onChange={e=>{const x=[...envList];x[i].title=e.target.value;setEnvList(x)}} className={inputStyle} placeholder="標題"/><textarea value={env.desc} onChange={e=>{const x=[...envList];x[i].desc=e.target.value;setEnvList(x)}} className={inputStyle} placeholder="描述"/><input type="file" onChange={e=>handleUpload(e, (url)=>{const x=[...envList];x[i].image=url;setEnvList(x)})} className="text-xs"/><input value={env.link} onChange={e=>{const x=[...envList];x[i].link=e.target.value;setEnvList(x)}} className={inputStyle} placeholder="連結"/></div>))}</section>
                  <section className="space-y-4"><div className="flex justify-between"><h3 className="font-bold text-lg border-l-4 border-orange-500 pl-2">工程進度</h3><button onClick={()=>setProgressList([...progressList, {id: Date.now(), date:'', status:''}])} className="text-orange-500 text-xs">+ 新增</button></div>{progressList.map((p, i) => (<div key={i} className="flex gap-2"><input type="date" value={p.date} onChange={e=>{const x=[...progressList];x[i].date=e.target.value;setProgressList(x)}} className="border p-2"/><input value={p.status} onChange={e=>{const x=[...progressList];x[i].status=e.target.value;setProgressList(x)}} className="w-full border p-2"/><button onClick={()=>setProgressList(progressList.filter((_,idx)=>idx!==i))}><Trash2 size={14}/></button></div>))}</section>
                  <section className="space-y-4"><h3 className="font-bold text-lg border-l-4 border-orange-500 pl-2">規格 & 特色</h3><div className="flex gap-2"><button onClick={()=>setSpecs([...specs, {id: Date.now(), label:'', value:''}])}>+規格</button><button onClick={()=>setFeatures([...features, {id: Date.now(), title:'', desc:''}])}>+特色</button></div>{specs.map((s,i)=>(<div key={i} className="flex gap-2 mb-1"><input value={s.label} onChange={e=>{const x=[...specs];x[i].label=e.target.value;setSpecs(x)}} className="border w-1/3"/><input value={s.value} onChange={e=>{const x=[...specs];x[i].value=e.target.value;setSpecs(x)}} className="border w-full"/><button onClick={()=>setSpecs(specs.filter((_,idx)=>idx!==i))}>X</button></div>))}{features.map((f,i)=>(<div key={i} className="flex gap-2 mb-1"><input value={f.title} onChange={e=>{const x=[...features];x[i].title=e.target.value;setFeatures(x)}} className="border w-1/3"/><input value={f.desc} onChange={e=>{const x=[...features];x[i].desc=e.target.value;setFeatures(x)}} className="border w-full"/><button onClick={()=>setFeatures(features.filter((_,idx)=>idx!==i))}>X</button></div>))}</section>
                </div>
            </div></>)}
      </div>
    </div>
  );
};

export default Admin;