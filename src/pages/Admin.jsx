import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, getDocs, doc, updateDoc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { X, Plus, Trash2, Link as LinkIcon, Settings, Layout, Users, Search, Map as MapIcon, Upload, Languages } from 'lucide-react';

// --- 輔助函式 ---
const safeStr = (val) => (val === undefined || val === null) ? "" : String(val);

const compressImage = (file) => {
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
        const maxWidth = 800;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.6));
      };
    };
  });
};

const Admin = () => {
  const [viewMode, setViewMode] = useState('properties'); 
  const [properties, setProperties] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [editId, setEditId] = useState(null);
  const [activeTab, setActiveTab] = useState('content');

  const [formData, setFormData] = useState({ 
    title: '', subtitle: '', subtitleEN: '', price: '', address: '', 
    agentPhone: '', agentName: '', lineId: '', lineQr: '', 
    googleMapUrl: '', thumb: '', images: [] 
  });
  
  const [specs, setSpecs] = useState([{ id: 's1', label: "總建坪", value: "" }]);
  const [features, setFeatures] = useState([{ id: 'f1', title: "特色標題", desc: "" }]);
  const [concept, setConcept] = useState({ title: "建築理念", content: "", image: "" }); 
  
  // 預設帶入工商時報新聞 (模擬 AI 搜尋)
  const [envList, setEnvList] = useState([
    { 
      id: 'e1', 
      title: "科技業買爆廠房！2025年商用不動產成交衝上1,900億元", 
      desc: "受惠於AI及半導體需求帶動，工業地產穩居市場交易主力，新竹、台南科學園區周邊詢問度最高。(資料來源：工商時報)", 
      image: "", 
      link: "https://www.ctee.com.tw/news/20260110700492-430601" 
    }
  ]);
  
  const [progressList, setProgressList] = useState([{ id: 'p1', date: '', status: '' }]);
  
  const [globalSettings, setGlobalSettings] = useState({
    siteName: "Factory Pro",
    heroTitleCN: "未來工廠",
    heroTitleEN: "FUTURE FACTORY",
    contactPhone: "0800-666-738"
  });

  useEffect(() => { 
    fetchProperties();
    fetchGlobalSettings();
    fetchCustomers();
  }, []);

  const fetchProperties = async () => {
    try {
      const snap = await getDocs(collection(db, "properties"));
      const list = [];
      snap.forEach((doc) => list.push({ id: doc.id, ...doc.data() }));
      setProperties(list);
    } catch (e) { console.error(e); }
  };

  const fetchGlobalSettings = async () => {
    try {
      const docRef = doc(db, "settings", "global");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) setGlobalSettings(docSnap.data());
    } catch (e) {}
  };

  const fetchCustomers = async () => {
    try {
      const snap = await getDocs(collection(db, "customers"));
      const list = [];
      snap.forEach((doc) => list.push({ id: doc.id, ...doc.data() }));
      list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setCustomers(list);
    } catch (e) {}
  };

  const handleTranslate = async () => {
    if (!formData.subtitle) return alert("請先輸入中文副標題");
    setTranslating(true);
    try {
      const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(formData.subtitle)}&langpair=zh-TW|en`);
      const data = await response.json();
      if (data.responseData.translatedText) {
        setFormData(prev => ({ ...prev, subtitleEN: data.responseData.translatedText }));
      } else {
        alert("翻譯失敗");
      }
    } catch (error) { alert("翻譯服務連線錯誤"); }
    setTranslating(false);
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      await setDoc(doc(db, "settings", "global"), globalSettings);
      alert("網站設定已更新！");
      window.location.reload(); 
    } catch (e) { alert("儲存失敗：" + e.message); }
    setLoading(false);
  };

  const handleDeleteProperty = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm("⚠️ 警告：確定要永久刪除這個案場嗎？")) return;
    try {
      await deleteDoc(doc(db, "properties", id));
      alert("案場已刪除");
      fetchProperties();
      if (editId === id) resetForm();
    } catch (error) { alert("刪除失敗"); }
  };

  const loadEdit = (item) => {
    setEditId(item.id);
    const info = item.basicInfo || {};
    setFormData({
      title: safeStr(info.title), subtitle: safeStr(info.subtitle), subtitleEN: safeStr(info.subtitleEN),
      price: safeStr(info.price), address: safeStr(info.address), agentPhone: safeStr(info.agentPhone), agentName: safeStr(info.agentName),
      lineId: safeStr(info.lineId), lineQr: safeStr(info.lineQr), googleMapUrl: safeStr(info.googleMapUrl),
      thumb: safeStr(info.thumb), images: Array.isArray(info.images) ? info.images : []
    });
    setSpecs(Array.isArray(item.specs) ? item.specs : []);
    setFeatures(Array.isArray(item.features) ? item.features : []);
    setConcept({ title: safeStr(item.concept?.title), content: safeStr(item.concept?.content), image: safeStr(item.concept?.image) });
    
    let envs = item.environmentList || [];
    if(envs.length === 0 && item.environment) envs = [item.environment];
    if(envs.length === 0) envs = [{ id: 'init', title: "", desc: "", image: "", link: "" }];
    setEnvList(envs);

    if (Array.isArray(item.progressHistory)) setProgressList(item.progressHistory);
    else setProgressList([{ id: 'init', date: '', status: '' }]);
  };

  const handleUpload = async (e, callback) => {
    const file = e.target.files[0];
    if (!file) return;
    setCompressing(true);
    try {
      const compressed = await compressImage(file);
      callback(compressed);
    } catch (error) { alert("圖片處理失敗"); }
    setCompressing(false);
  };

  const resetForm = () => {
    setEditId(null);
    setFormData({ title: '', subtitle: '', subtitleEN: '', price: '', address: '', agentPhone: '', agentName: '', lineId: '', lineQr: '', googleMapUrl: '', thumb: '', images: [] });
    setSpecs([{ id: `s-${Date.now()}`, label: "總建坪", value: "" }]);
    setFeatures([{ id: `f-${Date.now()}`, title: "特色標題", desc: "" }]);
    setConcept({ title: "建築理念", content: "", image: "" });
    // 預設帶入新聞
    setEnvList([{ 
      id: `e-${Date.now()}`, 
      title: "科技業買爆廠房！2025年商用不動產成交衝上1,900億元", 
      desc: "受惠於AI及半導體需求帶動，工業地產穩居市場交易主力...(資料來源：工商時報)", 
      image: "", 
      link: "https://www.ctee.com.tw/news/20260110700492-430601" 
    }]);
    setProgressList([{ id: `p-${Date.now()}`, date: "", status: "" }]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        basicInfo: formData, specs, features, 
        concept, environmentList: envList, progressHistory: progressList, images: formData.images,
        updatedAt: new Date()
      };
      if (editId) await updateDoc(doc(db, "properties", editId), payload);
      else await addDoc(collection(db, "properties"), payload);
      alert("儲存成功！"); window.location.reload();
    } catch (err) { alert(`失敗：${err.message}`); } 
    setLoading(false);
  };

  const inputStyle = "w-full bg-white border border-slate-300 text-slate-800 p-2 text-sm focus:outline-none focus:border-orange-500 rounded-sm";
  const labelStyle = "block text-[10px] font-bold text-slate-500 mb-1 tracking-wider uppercase";
  const openSearch = () => window.open("https://www.google.com/search?q=site:ctee.com.tw+工業地產&tbs=qdr:w", "_blank");

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-slate-100 text-slate-800 font-sans overflow-hidden">
      
      {/* 左側選單 */}
      <div className="w-full lg:w-64 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-4 border-b">
          <h2 className="font-black text-xl mb-4 text-slate-900">ADMIN</h2>
          <div className="flex flex-col gap-2">
            <button onClick={() => setViewMode('properties')} className={`flex items-center gap-2 px-3 py-2 rounded text-sm font-bold ${viewMode === 'properties' ? 'bg-orange-50 text-orange-600' : 'text-slate-500 hover:bg-slate-50'}`}><Layout size={16}/> 案場管理</button>
            <button onClick={() => setViewMode('customers')} className={`flex items-center gap-2 px-3 py-2 rounded text-sm font-bold ${viewMode === 'customers' ? 'bg-orange-50 text-orange-600' : 'text-slate-500 hover:bg-slate-50'}`}><Users size={16}/> 客戶資料表</button>
            <button onClick={() => setViewMode('settings')} className={`flex items-center gap-2 px-3 py-2 rounded text-sm font-bold ${viewMode === 'settings' ? 'bg-orange-50 text-orange-600' : 'text-slate-500 hover:bg-slate-50'}`}><Settings size={16}/> 網站設定</button>
          </div>
        </div>
        {viewMode === 'properties' && (
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            <div className="flex justify-between items-center px-2 mb-2"><span className="text-xs font-bold text-slate-400">PROJECTS</span><button onClick={resetForm} className="text-orange-500 text-xs hover:underline">+ NEW</button></div>
            {properties.map(p => (
              <div key={p.id} onClick={() => loadEdit(p)} className={`p-3 border cursor-pointer hover:bg-slate-50 rounded flex justify-between items-center group ${editId === p.id ? 'border-orange-500 bg-orange-50' : 'border-slate-200'}`}>
                <div className="font-bold text-sm truncate w-32">{p.basicInfo.title}</div>
                <button onClick={(e) => handleDeleteProperty(e, p.id)} className="text-slate-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition px-1"><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 中間內容區 */}
      <div className="flex-1 flex flex-col bg-slate-50">
        
        {viewMode === 'settings' && (
           <div className="p-8 max-w-2xl mx-auto w-full">
              <h1 className="text-2xl font-black mb-8">網站全域設定</h1>
              <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 space-y-6">
                 <div><label className={labelStyle}>左上角網站名稱</label><input value={globalSettings.siteName} onChange={e=>setGlobalSettings({...globalSettings, siteName: e.target.value})} className={inputStyle} /></div>
                 <div className="grid grid-cols-2 gap-4"><div><label className={labelStyle}>首頁大標題 (中文)</label><input value={globalSettings.heroTitleCN} onChange={e=>setGlobalSettings({...globalSettings, heroTitleCN: e.target.value})} className={inputStyle} /></div><div><label className={labelStyle}>首頁大標題 (英文)</label><input value={globalSettings.heroTitleEN} onChange={e=>setGlobalSettings({...globalSettings, heroTitleEN: e.target.value})} className={inputStyle} /></div></div>
                 <div><label className={labelStyle}>全站聯絡電話</label><input value={globalSettings.contactPhone} onChange={e=>setGlobalSettings({...globalSettings, contactPhone: e.target.value})} className={inputStyle} /></div>
                 <button onClick={handleSaveSettings} disabled={loading} className="bg-slate-900 text-white px-8 py-3 rounded font-bold hover:bg-orange-600 transition w-full">{loading ? "儲存中..." : "儲存設定"}</button>
              </div>
           </div>
        )}

        {viewMode === 'customers' && (
          <div className="p-8 w-full max-w-6xl mx-auto overflow-y-auto">
             <h1 className="text-2xl font-black mb-8">客戶諮詢資料表</h1>
             <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-sm text-left">
                   <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-xs"><tr><th className="p-4">日期</th><th className="p-4">姓名</th><th className="p-4">電話</th><th className="p-4">行業</th><th className="p-4">需求</th><th className="p-4">坪數</th></tr></thead>
                   <tbody>
                      {customers.length === 0 ? <tr><td colSpan="6" className="p-8 text-center text-slate-400">目前尚無客戶資料</td></tr> : customers.map(c => (<tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50"><td className="p-4 font-mono text-slate-500">{new Date(c.createdAt?.seconds * 1000).toLocaleDateString()}</td><td className="p-4 font-bold">{c.name}</td><td className="p-4 text-orange-600">{c.phone}</td><td className="p-4">{c.industry}</td><td className="p-4">{c.needs}</td><td className="p-4">{c.ping}</td></tr>))}
                   </tbody>
                </table>
             </div>
          </div>
        )}

        {viewMode === 'properties' && (
          <>
            <div className="p-4 border-b bg-white flex justify-between items-center">
              <h1 className="font-bold">{editId ? '編輯案場' : '新增案場'}</h1>
              <button onClick={handleSubmit} disabled={loading || compressing} className="bg-slate-800 text-white px-6 py-2 text-sm font-bold hover:bg-black disabled:bg-gray-400 rounded">{compressing ? '圖片處理中...' : loading ? '存檔中...' : '儲存專案'}</button>
            </div>
            <div className="flex border-b bg-white text-sm"><button className="flex-1 py-3 uppercase font-bold border-b-2 border-orange-500 text-orange-600">內容編輯</button></div>
            <div className="flex-1 overflow-y-auto p-8 max-w-4xl mx-auto w-full">
                <div className="space-y-12 pb-20">
                  <section className="space-y-4">
                    <h3 className="font-bold text-lg border-l-4 border-orange-500 pl-2">基本資料</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <label className={labelStyle}>標題</label>
                        <input value={formData.title} onChange={e=>setFormData({...formData, title:e.target.value})} className={inputStyle}/>
                      </div>
                      
                      <div className="col-span-2">
                        <label className={labelStyle}>副標題 (中文)</label>
                        <input value={formData.subtitle} onChange={e=>setFormData({...formData, subtitle:e.target.value})} className={inputStyle}/>
                      </div>

                      <div className="col-span-2">
                        <label className={labelStyle}>Subtitle (English)</label>
                        <div className="flex gap-2">
                           <input value={formData.subtitleEN} onChange={e=>setFormData({...formData, subtitleEN:e.target.value})} className={inputStyle} placeholder="可手動輸入或點擊翻譯" />
                           <button onClick={handleTranslate} disabled={translating} className="bg-slate-800 text-white px-3 text-xs rounded flex items-center gap-1 hover:bg-black whitespace-nowrap">
                             {translating ? "..." : <><Languages size={14}/> AI 翻譯</>}
                           </button>
                        </div>
                      </div>
                      
                      <div><label className={labelStyle}>價格</label><input value={formData.price} onChange={e=>setFormData({...formData, price:e.target.value})} className={inputStyle}/></div>
                      <div><label className={labelStyle}>地址</label><input value={formData.address} onChange={e=>setFormData({...formData, address:e.target.value})} className={inputStyle}/></div>
                      
                      <div className="col-span-2">
                        <label className={labelStyle}><MapIcon size={12} className="inline mr-1"/> Google 地圖嵌入網址 (src)</label>
                        <input value={formData.googleMapUrl} onChange={e=>setFormData({...formData, googleMapUrl:e.target.value})} className={inputStyle} placeholder="貼上 iframe src 內的網址" />
                      </div>

                      <div><label className={labelStyle}>經紀人電話</label><input value={formData.agentPhone} onChange={e=>setFormData({...formData, agentPhone:e.target.value})} className={inputStyle}/></div>
                      <div><label className={labelStyle}>經紀人姓名</label><input value={formData.agentName} onChange={e=>setFormData({...formData, agentName:e.target.value})} className={inputStyle}/></div>
                      
                      <div><label className={labelStyle}>LINE ID</label><input value={formData.lineId} onChange={e=>setFormData({...formData, lineId:e.target.value})} className={inputStyle}/></div>
                      <div><label className={labelStyle}>LINE QR Code 圖片</label><div className="flex gap-2"><input type="file" onChange={e=>handleUpload(e, (url)=>setFormData({...formData, lineQr: url}))} className="text-xs"/>{formData.lineQr && <img src={formData.lineQr} className="h-10 w-10 border object-contain"/>}</div></div>

                      <div className="col-span-2"><label className={labelStyle}>封面圖</label><div className="flex gap-2"><input type="file" onChange={e=>handleUpload(e, (url)=>setFormData({...formData, thumb: url}))} className="text-xs"/>{formData.thumb && <img src={formData.thumb} className="h-10 w-10 border object-cover"/>}</div></div>
                    </div>
                  </section>
                  
                  <section className="space-y-4">
                    <h3 className="font-bold text-lg border-l-4 border-orange-500 pl-2">案場理念</h3>
                    <input value={concept.title} onChange={e=>setConcept({...concept, title:e.target.value})} className={inputStyle} placeholder="標題" />
                    <textarea value={concept.content} onChange={e=>setConcept({...concept, content:e.target.value})} className={`${inputStyle} h-32`} placeholder="內容..." />
                    <div><label className={labelStyle}>配圖 (預設為工業風建築)</label><div className="flex gap-2"><input type="file" onChange={e=>handleUpload(e, (url)=>setConcept({...concept, image: url}))} className="text-xs"/>{concept.image && <img src={concept.image} className="h-10 w-10 object-cover border"/>}</div></div>
                  </section>

                  <section className="space-y-4">
                    <div className="flex justify-between items-center">
                       <h3 className="font-bold text-lg border-l-4 border-orange-500 pl-2">周遭環境 / 新聞連結</h3>
                       <div className="flex gap-2">
                           <button type="button" onClick={openSearch} className="text-blue-600 text-xs flex items-center gap-1 border border-blue-200 px-2 py-1 rounded hover:bg-blue-50"><Search size={14}/> 搜尋工商時報</button>
                           <button type="button" onClick={()=>setEnvList([...envList, {id: Date.now(), title:"", desc:"", image:"", link:""}])} className="text-orange-500 text-xs flex items-center gap-1"><Plus size={14}/> 新增</button>
                       </div>
                    </div>
                    {envList.map((env, i) => (
                       <div key={i} className="bg-slate-50 border p-4 rounded-md space-y-2 relative">
                          <button onClick={()=>setEnvList(envList.filter((_,idx)=>idx!==i))} className="absolute top-2 right-2 text-slate-400 hover:text-red-500"><Trash2 size={16}/></button>
                          <input value={env.title} onChange={e=>{const x=[...envList];x[i].title=e.target.value;setEnvList(x)}} className={inputStyle} placeholder="標題" />
                          <textarea value={env.desc} onChange={e=>{const x=[...envList];x[i].desc=e.target.value;setEnvList(x)}} className={inputStyle} placeholder="描述..." />
                          <div className="grid grid-cols-2 gap-4">
                             <div><label className={labelStyle}>配圖</label><div className="flex gap-2"><input type="file" onChange={e=>handleUpload(e, (url)=>{const x=[...envList];x[i].image=url;setEnvList(x)})} className="text-xs"/>{env.image && <img src={env.image} className="h-8 w-8"/>}</div></div>
                             <div><label className={labelStyle}>新聞連結 URL</label><input value={env.link} onChange={e=>{const x=[...envList];x[i].link=e.target.value;setEnvList(x)}} className={inputStyle} placeholder="https://..." /></div>
                          </div>
                       </div>
                    ))}
                  </section>

                  <section className="space-y-4">
                    <div className="flex justify-between items-center"><h3 className="font-bold text-lg border-l-4 border-orange-500 pl-2">工程進度</h3><button type="button" onClick={()=>setProgressList([...progressList, {id: Date.now(), date:'', status:''}])} className="text-orange-500 text-xs flex items-center gap-1"><Plus size={14}/> 新增</button></div>
                    {progressList.map((p, i) => (<div key={i} className="flex gap-2 items-center"><input type="date" value={p.date} onChange={e=>{const x=[...progressList];x[i].date=e.target.value;setProgressList(x)}} className="w-1/3 border p-2 text-sm"/><input value={p.status} onChange={e=>{const x=[...progressList];x[i].status=e.target.value;setProgressList(x)}} className="w-full border p-2 text-sm"/><button onClick={()=>setProgressList(progressList.filter((_,idx)=>idx!==i))} className="text-slate-400 hover:text-red-500"><Trash2 size={16}/></button></div>))}
                  </section>
                  <section className="space-y-4">
                     <h3 className="font-bold text-lg border-l-4 border-orange-500 pl-2">相簿</h3><input type="file" multiple onChange={(e) => {const file = e.target.files[0];if(file) handleUpload(e, (url) => setFormData(prev => ({...prev, images: [...prev.images, url]})));}} className="text-xs"/><div className="grid grid-cols-4 gap-2">{formData.images.map((img, idx) => (<div key={idx} className="relative aspect-square bg-gray-200"><img src={img} className="w-full h-full object-cover"/><button onClick={() => setFormData(prev => ({...prev, images: prev.images.filter((_, i) => i !== idx)}))} className="absolute top-0 right-0 bg-red-500 text-white p-1"><X size={12}/></button></div>))}</div>
                  </section>
                  <section className="space-y-4">
                      <div className="flex justify-between"><h3 className="font-bold text-lg border-l-4 border-orange-500 pl-2">規格 & 特色</h3><div className="flex gap-2"><button type="button" onClick={()=>setSpecs([...specs, {id: Date.now(), label:'', value:''}])} className="text-xs text-orange-500">+ 規格</button><button type="button" onClick={()=>setFeatures([...features, {id: Date.now(), title:'', desc:''}])} className="text-xs text-orange-500">+ 特色</button></div></div>
                      {specs.map((s, i) => (<div key={i} className="flex gap-2 mb-2"><input value={s.label} onChange={e=>{const x=[...specs];x[i].label=e.target.value;setSpecs(x)}} className="w-1/3 border p-2" placeholder="規格名"/><input value={s.value} onChange={e=>{const x=[...specs];x[i].value=e.target.value;setSpecs(x)}} className="w-full border p-2" placeholder="數值"/><button onClick={()=>setSpecs(specs.filter((_,idx)=>idx!==i))}><X size={16}/></button></div>))}
                      {features.map((f, i) => (<div key={i} className="flex gap-2 mb-2"><input value={f.title} onChange={e=>{const x=[...features];x[i].title=e.target.value;setFeatures(x)}} className="w-1/3 border p-2" placeholder="特色名"/><input value={f.desc} onChange={e=>{const x=[...features];x[i].desc=e.target.value;setFeatures(x)}} className="w-full border p-2" placeholder="描述"/><button onClick={()=>setFeatures(features.filter((_,idx)=>idx!==i))}><X size={16}/></button></div>))}
                  </section>
                </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Admin;