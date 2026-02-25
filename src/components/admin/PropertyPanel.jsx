import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../../firebase';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { safeStr, compressImage } from '../../utils/adminHelpers';
import { 
  X, Plus, Trash2, Map as MapIcon, Upload, Languages, History, Search, 
  Train, Factory, MapPin, Star, Award, Zap, Folder, FolderOpen, 
  ChevronDown, Sparkles, Copy, Loader2, Image as ImageIcon
} from 'lucide-react';

const PropertyPanel = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [editId, setEditId] = useState(null);

  // Form States
  const [formData, setFormData] = useState({ 
    title: '', titleEN: '', subtitle: '', description: '', price: '', address: '', 
    city: '高雄', propertyType: '工業地', usageType: '廠房', transactionType: '出售',
    agentPhone: '', agentName: '', lineId: '', lineQr: '', googleMapUrl: '', thumb: '', images: [],
    showOnHome: false, isFeaturedWork: false
  });
  
  const [specs, setSpecs] = useState([{ id: 's1', label: "使用分區", value: "乙種工業區" }]);
  const [features, setFeatures] = useState([{ id: 'f1', title: "特色標題", desc: "" }]);
  const [envList, setEnvList] = useState([{ id: 'e1', title: "", desc: "", image: "", link: "" }]);
  const [progressList, setProgressList] = useState([{ id: 'p1', date: '', status: '' }]);
  const [units, setUnits] = useState([{ id: 'u1', number: '', ping: '', unitPrice: '', price: '', status: 'available', layout: '' }]);
  const [batchUnitPrice, setBatchUnitPrice] = useState('');
  const [collapsedZones, setCollapsedZones] = useState({});

  const propertyTypes = ['工業地', '農地', '建地'];
  const usageTypes = { '工業地': ['廠房', '工業地'], '農地': ['農地廠房', '農地'], '建地': ['建地廠房', '透天', '套房'] };
  
  const inputStyle = "w-full bg-white border border-slate-300 text-slate-800 p-3 md:p-2.5 text-base md:text-sm focus:outline-none focus:border-orange-500 rounded-lg shadow-sm transition placeholder:text-slate-300";
  const labelStyle = "block text-xs font-bold text-slate-500 mb-1.5 tracking-wider uppercase";

  // Fetch Data
  const fetchProperties = async () => { 
    setLoading(true);
    try { 
        const snap = await getDocs(collection(db, "properties")); 
        const list = []; 
        snap.forEach((doc) => {
            list.push({ id: doc.id, ...doc.data() });
        }); 
        setProperties(list); 
    } catch (e) { 
        console.error("讀取失敗:", e);
    } 
    setLoading(false);
  };

  useEffect(() => { fetchProperties(); }, []);

  // Helpers & Logic
  const historyData = useMemo(() => {
    const specLabels = new Set(); const featureTitles = new Set(); const progressStatuses = new Set();
    properties.forEach(p => {
      if(Array.isArray(p.specs)) p.specs.forEach(s => { if(s?.label) specLabels.add(s.label); });
      if(Array.isArray(p.features)) p.features.forEach(f => { if(f?.title) featureTitles.add(f.title); });
      if(Array.isArray(p.progressHistory)) p.progressHistory.forEach(pr => { if(pr?.status) progressStatuses.add(pr.status); });
    });
    return { specs: Array.from(specLabels), features: Array.from(featureTitles), progress: Array.from(progressStatuses) };
  }, [properties]);

  const resetForm = () => {
    setEditId(null);
    setFormData({ title: '', titleEN: '', subtitle: '', description: '', price: '', address: '', city: '高雄', propertyType: '工業地', usageType: '廠房', transactionType: '出售', agentPhone: '', agentName: '', lineId: '', lineQr: '', googleMapUrl: '', thumb: '', images: [], showOnHome: false, isFeaturedWork: false });
    setSpecs([{ id: `s-${Date.now()}`, label: "使用分區", value: "乙種工業區" }]); 
    setFeatures([{ id: `f-${Date.now()}`, title: "特色標題", desc: "" }]);
    setEnvList([{ id: `e-${Date.now()}`, title: "", desc: "", image: "", link: "" }]);
    setProgressList([{ id: `p-${Date.now()}`, date: "", status: "" }]); 
    setUnits([{ id: `u-${Date.now()}`, number: '', ping: '', unitPrice: '', price: '', status: 'available', layout: '' }]);
  };

  const loadEdit = (item) => { 
    setEditId(item.id); 
    const info = item.basicInfo || item; 
    setFormData({ 
      title: safeStr(info.title), titleEN: safeStr(info.titleEN), subtitle: safeStr(info.subtitle), description: safeStr(info.description),
      price: safeStr(info.price), address: safeStr(info.address), city: safeStr(info.city) || '高雄', propertyType: safeStr(info.propertyType) || '工業地', usageType: safeStr(info.usageType) || '廠房', transactionType: safeStr(info.transactionType) || '出售',
      agentPhone: safeStr(info.agentPhone), agentName: safeStr(info.agentName), lineId: safeStr(info.lineId), lineQr: safeStr(info.lineQr), googleMapUrl: safeStr(info.googleMapUrl),
      thumb: safeStr(info.thumb), images: Array.isArray(info.images) ? info.images : [], showOnHome: info.showOnHome || false, isFeaturedWork: info.isFeaturedWork || false
    }); 
    setSpecs(Array.isArray(item.specs) ? item.specs : []); 
    setFeatures(Array.isArray(item.features) ? item.features : []); 
    setEnvList(Array.isArray(item.environmentList) ? item.environmentList : []); 
    setProgressList(Array.isArray(item.progressHistory) ? item.progressHistory : []); 
    setUnits(Array.isArray(item.units) ? item.units : []); 
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpload = async (e, callback) => { 
      const file = e.target.files[0]; if (!file) return; 
      setCompressing(true); 
      try { const compressed = await compressImage(file); callback(compressed); } catch (e) {} 
      setCompressing(false); 
  };

  const handleSubmit = async (e) => { 
      e.preventDefault(); setLoading(true); 
      const payload = { basicInfo: formData, specs, features, environmentList: envList, progressHistory: progressList, units, images: formData.images, updatedAt: new Date() }; 
      if (editId) await updateDoc(doc(db, "properties", editId), payload); else await addDoc(collection(db, "properties"), payload); 
      alert("儲存成功"); setLoading(false); fetchProperties();
  };

  const handleTranslate = async () => { 
      if (!formData.title) return alert("請先輸入中文"); setTranslating(true); 
      try { const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(formData.title)}&langpair=zh-TW|en`); const data = await response.json(); if (data.responseData.translatedText) setFormData(prev => ({ ...prev, titleEN: data.responseData.translatedText })); } catch (error) {} 
      setTranslating(false); 
  };

  const handleSmartNewsSearch = (type) => { 
    const c = (formData.city || '').replace('市', '').replace('縣', ''); 
    const k = type === 'traffic' ? `${c} 交通` : type === 'industry' ? `${c} 產業` : `${c} 建設`;
    window.open(`https://www.google.com/search?tbm=nws&q=${encodeURIComponent(k)}`, '_blank');
  };
  
  const handleSmartNewsGenerate = () => { setEnvList([...envList, { id: Date.now(), title: "AI 生成標題", desc: "...", image: "", link: "" }]); };

  // Unit Logic
  const calculateTotalPrice = (ping, unitPrice) => { const p = parseFloat(ping); const u = parseFloat(unitPrice); return (!isNaN(p) && !isNaN(u)) ? `${(p * u).toFixed(0)} 萬` : ''; };
  const handleUnitChange = (id, field, value) => { setUnits(prev => prev.map(u => { if (u.id !== id) return u; const newUnit = { ...u, [field]: value }; if (field === 'ping' || field === 'unitPrice') { newUnit.price = calculateTotalPrice(newUnit.ping, newUnit.unitPrice); } return newUnit; })); };
  const handleDuplicateUnit = (unit) => { setUnits([{ ...unit, id: Date.now(), number: `${unit.number} (複製)`, layout: '' }, ...units]); };
  const handleAddUnit = () => { setUnits([{ id: Date.now(), number: '', ping: '', unitPrice: '', price: '', status: 'available', layout: '' }, ...units]); };
  const applyBatchPrice = (onlyEmpty = false) => { if (!batchUnitPrice) return alert("請輸入單價"); if (!window.confirm("確定更新？")) return; setUnits(units.map(u => { if (onlyEmpty && u.unitPrice) return u; const newPrice = calculateTotalPrice(u.ping, batchUnitPrice); return { ...u, unitPrice: batchUnitPrice, price: newPrice }; })); alert("完成"); };
  
  const groupedUnits = useMemo(() => { 
    const groups = {}; 
    (units || []).forEach(u => { 
      if (!u) return;
      const num = u.number ? String(u.number) : '';
      const zone = num.length > 0 ? num.charAt(0).toUpperCase() : '未分類';
      const zoneKey = /^[A-Z]$/.test(zone) ? zone : '其他'; 
      if (!groups[zoneKey]) groups[zoneKey] = []; 
      groups[zoneKey].push(u); 
    }); 
    return Object.keys(groups).sort().reduce((obj, key) => { obj[key] = groups[key]; return obj; }, {}); 
  }, [units]);
  
  const toggleZone = (zone) => { setCollapsedZones(prev => ({ ...prev, [zone]: !prev[zone] })); };

  const getDisplayTitle = (p) => {
    if (p.basicInfo && p.basicInfo.title) return p.basicInfo.title;
    if (p.title) return p.title;
    return "(無標題)";
  };

  const getDisplayPrice = (p) => {
    const price = p.basicInfo?.price || p.price;
    if (!price) return "-";
    if (String(price).includes("萬") || String(price).includes("億")) return price;
    return `${price} 萬`;
  };

  const getThumbnail = (p) => {
    return p.basicInfo?.thumb || p.thumb || "";
  };

  return (
    // ★★★ 修正點 1：最外層改為 flex-col 並控制高度，解決捲軸破版問題 ★★★
    <div className="flex flex-col h-full md:h-[calc(100vh-80px)] relative overflow-hidden bg-slate-50">
      
      {/* ★★★ 修正點 2：將「儲存列」與「手機版案場列」合併成一個完整的置頂區塊 ★★★ */}
      <div className="shrink-0 sticky top-0 z-30 flex flex-col w-full shadow-sm bg-white">
        
        {/* 第一列：標題與儲存專案按鈕 */}
        <div className="p-3 md:p-4 border-b flex justify-between items-center px-4 md:px-8">
          <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg md:text-xl text-slate-800">{editId ? '編輯模式' : '新增模式'}</h1>
              {loading && <Loader2 className="animate-spin text-orange-500" size={16}/>}
          </div>
          <div className="flex gap-2">
              <button onClick={fetchProperties} className="hidden md:flex border border-slate-200 text-slate-600 px-3 py-2 text-sm font-bold hover:bg-slate-50 rounded-xl transition items-center gap-2">
                  <History size={14}/> 重整列表
              </button>
              <button onClick={handleSubmit} disabled={loading || compressing} className="bg-orange-600 text-white px-5 py-2 text-sm font-bold hover:bg-orange-500 rounded-xl shadow-lg shadow-orange-200 transition shrink-0">
                  {compressing ? '處理中...' : loading ? '存檔中...' : '儲存專案'}
              </button>
          </div>
        </div>

        {/* 第二列：手機版專用水平列表 (放在儲存按鈕正下方，滑動時不重疊) */}
        <div className="md:hidden p-2 bg-slate-50 border-b overflow-x-auto flex gap-2 w-full items-center shadow-inner">
          <button onClick={resetForm} className="bg-orange-500 text-white px-3 py-1.5 rounded-lg font-bold text-xs shrink-0 flex items-center gap-1 shadow-sm"><Plus size={14}/> 新增</button>
          {properties.map(p => (
              <button key={p.id} onClick={() => loadEdit(p)} className={`flex items-center gap-2 px-2 py-1.5 rounded-lg border text-xs font-bold shrink-0 whitespace-nowrap transition shadow-sm ${editId === p.id ? 'bg-orange-50 border-orange-500 text-orange-600 ring-1 ring-orange-200' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'}`}>
                  {getThumbnail(p) && <img src={getThumbnail(p)} alt="" className="w-5 h-5 rounded object-cover border border-slate-200"/>}
                  {getDisplayTitle(p).substring(0, 8)}...
              </button>
          ))}
        </div>
      </div>

      {/* ★★★ 修正點 3：表單與左側列表區域 ★★★ */}
      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
        
        {/* 電腦版專用：左側直式列表 */}
        <div className="hidden md:block w-64 bg-slate-50 border-r border-slate-200 overflow-y-auto p-4 shrink-0 h-full">
            <button onClick={resetForm} className="w-full bg-white border-2 border-dashed border-slate-300 text-slate-500 py-3 rounded-xl font-bold hover:border-orange-500 hover:text-orange-500 transition mb-4 flex justify-center items-center gap-2 shadow-sm">
                <Plus size={16}/> 新增案件
            </button>
            <div className="space-y-2 pb-20">
                {properties.map(p => (
                    <div key={p.id} onClick={() => loadEdit(p)} className={`p-3 rounded-xl cursor-pointer border transition hover:shadow-md group ${editId === p.id ? 'bg-white border-orange-500 shadow-sm ring-1 ring-orange-200' : 'bg-white border-slate-200 hover:border-orange-300'}`}>
                        {getThumbnail(p) ? (
                            <img src={getThumbnail(p)} alt="cover" className="w-full h-24 object-cover rounded-lg mb-2 bg-slate-100 border border-slate-100"/>
                        ) : (
                            <div className="w-full h-24 bg-slate-100 rounded-lg mb-2 flex items-center justify-center text-slate-300">
                                <ImageIcon size={24}/>
                            </div>
                        )}
                        <div className="font-bold text-sm text-slate-800 truncate group-hover:text-orange-600 transition">{getDisplayTitle(p)}</div>
                        <div className="flex justify-between mt-1">
                            <span className="text-xs text-slate-400 bg-slate-100 px-1.5 rounded border border-slate-200">
                                {(p.basicInfo?.city || p.city || "未分類").substring(0,2)}
                            </span>
                            <span className="text-xs text-orange-600 font-bold">{getDisplayPrice(p)}</span>
                        </div>
                    </div>
                ))}
                {properties.length === 0 && !loading && (
                    <div className="text-center text-xs text-slate-400 py-10">目前無資料</div>
                )}
            </div>
        </div>

        {/* 右側表單內容 */}
        {/* ★★★ 修正點 4：加上 pb-32，確保手機版滑到底部時不會被螢幕邊緣吃掉 ★★★ */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 w-full bg-slate-50 pb-32 md:pb-12">
            <div className="max-w-4xl mx-auto space-y-10">
                
                {/* 基本資料 */}
                <section className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200">
                <h3 className="font-black text-lg border-l-4 border-orange-500 pl-3 mb-6">基本資料</h3>
                <div className="mb-6 p-4 bg-orange-50 border border-orange-100 rounded-xl grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="flex items-center gap-3 cursor-pointer p-2 rounded hover:bg-white transition"><input type="checkbox" className="w-5 h-5 accent-orange-600" checked={formData.showOnHome} onChange={e=>setFormData({...formData, showOnHome: e.target.checked})}/><div><span className="font-bold text-slate-700 block">設為首頁熱銷 (Featured)</span><span className="text-xs text-slate-400">顯示於首頁輪播</span></div></label>
                    <label className="flex items-center gap-3 cursor-pointer p-2 rounded hover:bg-white transition"><input type="checkbox" className="w-5 h-5 accent-blue-600" checked={formData.isFeaturedWork} onChange={e=>setFormData({...formData, isFeaturedWork: e.target.checked})}/><div><span className="font-bold text-slate-700 block">設為經典作品推薦 (Top)</span><span className="text-xs text-slate-400">在作品分類頁置頂顯示</span></div></label>
                </div>
                <div className="mb-4"><label className={labelStyle}>物件介紹</label><textarea value={formData.description} onChange={e=>setFormData({...formData, description:e.target.value})} className={`${inputStyle} h-32`} placeholder="稀有釋出..." /></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="col-span-1 md:col-span-2"><label className={labelStyle}>標題</label><input value={formData.title} onChange={e=>setFormData({...formData, title:e.target.value})} className={inputStyle} placeholder="例如：台積電概念園區"/></div>
                    <div className="col-span-1 md:col-span-2">
                        <div className="flex gap-2">
                            <div className="flex-1"><label className={labelStyle}>英文標題 (AI)</label><input value={formData.titleEN} onChange={e=>setFormData({...formData, titleEN:e.target.value})} className={inputStyle} placeholder="點擊翻譯按鈕自動生成..."/></div>
                            <button onClick={handleTranslate} disabled={translating} className="mt-6 bg-slate-800 text-white px-4 rounded-lg text-sm font-bold hover:bg-black transition flex items-center gap-2">{translating?"...":<><Languages size={14}/> 翻譯</>}</button>
                        </div>
                    </div>
                    <div className="col-span-1 md:col-span-2"><label className={labelStyle}>副標題</label><input value={formData.subtitle} onChange={e=>setFormData({...formData, subtitle:e.target.value})} className={inputStyle} placeholder="例如：稀有釋出，機會難得"/></div>
                    <div><label className={labelStyle}>縣市區域</label><select value={formData.city} onChange={e=>setFormData({...formData, city:e.target.value})} className={inputStyle}><option value="高雄">高雄</option><option value="屏東">屏東</option></select></div>
                    <div><label className={labelStyle}>物件屬性</label><select value={formData.propertyType} onChange={e=>setFormData({...formData, propertyType:e.target.value})} className={inputStyle}>{propertyTypes.map(t=><option key={t} value={t}>{t}</option>)}</select></div>
                    <div><label className={labelStyle}>交易類別</label><select value={formData.transactionType} onChange={e=>setFormData({...formData, transactionType:e.target.value})} className={inputStyle}><option value="出售">出售</option><option value="出租">出租</option></select></div>
                    <div><label className={labelStyle}>用途分類</label><select value={formData.usageType} onChange={e=>setFormData({...formData, usageType:e.target.value})} className={inputStyle}>{(usageTypes[formData.propertyType] || []).map(u=><option key={u} value={u}>{u}</option>)}</select></div>
                    <div><label className={labelStyle}>價格</label><input value={formData.price} onChange={e=>setFormData({...formData, price:e.target.value})} className={inputStyle} placeholder="例如：1,880 萬"/></div>
                    <div className="col-span-1 md:col-span-2"><label className={labelStyle}>地址</label><input value={formData.address} onChange={e=>setFormData({...formData, address:e.target.value})} className={inputStyle} placeholder="例如：高雄市仁武區..."/></div>
                    <div className="col-span-1 md:col-span-2"><label className={labelStyle}><MapIcon size={12} className="inline mr-1"/> Google 地圖嵌入網址</label><input value={formData.googleMapUrl} onChange={e=>setFormData({...formData, googleMapUrl:e.target.value})} className={inputStyle} placeholder="貼上 iframe src 網址" /></div>
                    <div><label className={labelStyle}>經紀人電話</label><input value={formData.agentPhone} onChange={e=>setFormData({...formData, agentPhone:e.target.value})} className={inputStyle} placeholder="例如：0912-345-678"/></div>
                    <div><label className={labelStyle}>經紀人姓名</label><input value={formData.agentName} onChange={e=>setFormData({...formData, agentName:e.target.value})} className={inputStyle} placeholder="例如：王小明"/></div>
                    <div><label className={labelStyle}>LINE ID</label><input value={formData.lineId} onChange={e=>setFormData({...formData, lineId:e.target.value})} className={inputStyle} placeholder="例如：wang123"/></div>
                    
                    <div>
                        <label className={labelStyle}>LINE QR 圖片</label>
                        {formData.lineQr && <img src={formData.lineQr} alt="QR" className="w-20 h-20 object-contain mb-2 border rounded"/>}
                        <input type="file" onChange={e=>handleUpload(e, (url)=>setFormData({...formData, lineQr: url}))} className="text-xs"/>
                    </div>
                    
                    <div className="col-span-1 md:col-span-2">
                        <label className={labelStyle}>封面圖</label>
                        {formData.thumb ? (
                             <div className="relative w-full h-48 mb-2 group">
                                <img src={formData.thumb} alt="cover" className="w-full h-full object-cover rounded-lg border border-slate-200"/>
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs">目前封面圖</div>
                             </div>
                        ) : (
                            <div className="w-full h-32 bg-slate-50 border-2 border-dashed border-slate-200 rounded-lg mb-2 flex items-center justify-center text-slate-400 text-xs">尚未上傳封面</div>
                        )}
                        <input type="file" onChange={e=>handleUpload(e, (url)=>setFormData({...formData, thumb: url}))} className="text-xs w-full"/>
                    </div>
                </div>
                </section>
                
                {/* 規格 & 特色 */}
                <section className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex justify-between mb-6">
                    <h3 className="font-black text-lg border-l-4 border-orange-500 pl-3">規格 & 特色</h3>
                    <div className="flex gap-2">
                    <div className="relative group">
                        <button className="text-xs bg-slate-100 px-3 py-1 rounded hover:bg-slate-200 font-bold flex items-center gap-1"><History size={12}/> 參考過往</button>
                        <select onChange={(e)=>{if(e.target.value) setSpecs([...specs, {id: Date.now(), label: e.target.value, value: ''}])}} className="absolute inset-0 opacity-0 cursor-pointer"><option value="">選擇標籤...</option>{historyData.specs.map(s=><option key={s} value={s}>{s}</option>)}</select>
                    </div>
                    <button onClick={()=>setSpecs([...specs, {id: Date.now(), label:'', value:''}])} className="text-xs bg-slate-100 px-3 py-1 rounded hover:bg-slate-200 font-bold">+ 增加規格</button>
                    <button onClick={()=>setFeatures([...features, {id: Date.now(), title:'', desc:''}])} className="text-xs bg-slate-100 px-3 py-1 rounded hover:bg-slate-200 font-bold">+ 增加特色</button>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">物件規格 (Specs)</h4>
                    {specs.map((s,i)=>(<div key={i} className="flex gap-2"><input value={s.label} onChange={e=>{const x=[...specs];x[i].label=e.target.value;setSpecs(x)}} className="border rounded p-2 w-1/3 text-sm" placeholder="項目"/><input value={s.value} onChange={e=>{const x=[...specs];x[i].value=e.target.value;setSpecs(x)}} className="border rounded p-2 w-full text-sm" placeholder="內容"/><button onClick={()=>setSpecs(specs.filter((_,idx)=>idx!==i))} className="text-slate-300 hover:text-red-500"><X size={16}/></button></div>))}
                    </div>
                    <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">核心特色 (Features)</h4>
                    {features.map((f,i)=>(<div key={i} className="flex gap-2"><input value={f.title} onChange={e=>{const x=[...features];x[i].title=e.target.value;setFeatures(x)}} className="border rounded p-2 w-1/3 text-sm" placeholder="標題"/><input value={f.desc} onChange={e=>{const x=[...features];x[i].desc=e.target.value;setFeatures(x)}} className="border rounded p-2 w-full text-sm" placeholder="描述"/><button onClick={()=>setFeatures(features.filter((_,idx)=>idx!==i))} className="text-slate-300 hover:text-red-500"><X size={16}/></button></div>))}
                    </div>
                </div>
                </section>

                {/* 周遭環境 */}
                <section className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex justify-between mb-4">
                    <h3 className="font-black text-lg border-l-4 border-orange-500 pl-3">周遭環境 (新聞)</h3>
                    <div className="flex gap-2">
                    <div className="relative group">
                        <button className="text-blue-600 bg-blue-50 px-3 py-1 rounded text-xs font-bold flex items-center gap-1 hover:bg-blue-100"><Search size={12}/> 智慧搜尋</button>
                        <div className="absolute top-full right-0 bg-white border border-slate-100 shadow-xl rounded-lg p-2 z-10 hidden group-hover:block w-32">
                            <button onClick={()=>handleSmartNewsSearch('traffic')} className="w-full text-left px-2 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 rounded flex items-center gap-2"><Train size={12}/> 交通建設</button>
                            <button onClick={()=>handleSmartNewsSearch('industry')} className="w-full text-left px-2 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 rounded flex items-center gap-2"><Factory size={12}/> 產業發展</button>
                            <button onClick={()=>handleSmartNewsSearch('area')} className="w-full text-left px-2 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 rounded flex items-center gap-2"><MapPin size={12}/> 區域利多</button>
                        </div>
                    </div>
                    <button onClick={handleSmartNewsGenerate} className="text-purple-600 bg-purple-50 px-3 py-1 rounded text-xs font-bold flex items-center gap-1 hover:bg-purple-100"><Sparkles size={12}/> AI 文案</button>
                    <button onClick={()=>setEnvList([...envList, {id: Date.now(), title:"", desc:"", image:"", link:""}])} className="text-orange-500 text-xs font-bold">+ 新增</button>
                    </div>
                </div>
                {envList.map((env, i) => (
                    <div key={i} className="bg-slate-50 p-4 border border-slate-100 rounded-xl mb-3 space-y-2">
                    <input value={env.title} onChange={e=>{const x=[...envList];x[i].title=e.target.value;setEnvList(x)}} className={inputStyle} placeholder="新聞標題"/>
                    <textarea value={env.desc} onChange={e=>{const x=[...envList];x[i].desc=e.target.value;setEnvList(x)}} className={inputStyle} placeholder="簡述"/>
                    <input value={env.link} onChange={e=>{const x=[...envList];x[i].link=e.target.value;setEnvList(x)}} className={inputStyle} placeholder="連結網址"/>
                    </div>
                ))}
                </section>

                {/* 工程進度 */}
                <section className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex justify-between mb-4">
                    <h3 className="font-black text-lg border-l-4 border-orange-500 pl-3">工程進度</h3>
                    <div className="flex gap-2">
                    <div className="relative group">
                        <button className="text-xs bg-slate-100 px-3 py-1 rounded hover:bg-slate-200 font-bold flex items-center gap-1"><History size={12}/> 參考過往</button>
                        <select onChange={(e)=>{if(e.target.value) setProgressList([...progressList, {id: Date.now(), date: new Date().toISOString().split('T')[0], status: e.target.value}])}} className="absolute inset-0 opacity-0 cursor-pointer"><option value="">選擇進度...</option>{historyData.progress.map(s=><option key={s} value={s}>{s}</option>)}</select>
                    </div>
                    <button onClick={()=>setProgressList([...progressList, {id: Date.now(), date:'', status:''}])} className="text-orange-500 text-xs font-bold">+ 新增</button>
                    </div>
                </div>
                {progressList.map((p, i) => (
                    <div key={i} className="flex gap-2 mb-2">
                    <input type="date" value={p.date} onChange={e=>{const x=[...progressList];x[i].date=e.target.value;setProgressList(x)}} className="border rounded p-2 text-sm"/>
                    <input value={p.status} onChange={e=>{const x=[...progressList];x[i].status=e.target.value;setProgressList(x)}} className="border rounded p-2 w-full text-sm" placeholder="進度描述"/>
                    <button onClick={()=>setProgressList(progressList.filter((_,idx)=>idx!==i))}><Trash2 size={16} className="text-slate-300 hover:text-red-500"/></button>
                    </div>
                ))}
                </section>
                
                {/* 戶別銷控表 */}
                <section className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex flex-col gap-4 mb-6">
                    <div className="flex justify-between items-center">
                        <h3 className="font-black text-lg border-l-4 border-orange-500 pl-3">戶別銷控表 (Unit List)</h3>
                        <button onClick={handleAddUnit} className="bg-orange-50 text-orange-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-orange-100 transition flex items-center gap-1"><Plus size={14}/> 新增戶別</button>
                    </div>
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2 text-blue-800 font-bold text-sm"><Zap size={16} fill="currentColor"/> 快速工具：</div>
                        <input value={batchUnitPrice} onChange={e=>setBatchUnitPrice(e.target.value)} className="bg-white border border-blue-200 rounded-lg px-3 py-1.5 text-sm w-32 focus:outline-none focus:border-blue-500" placeholder="輸入統一單價"/>
                        <div className="flex gap-2">
                        <button onClick={()=>applyBatchPrice(false)} className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-700 transition">套用全部</button>
                        <button onClick={()=>applyBatchPrice(true)} className="bg-white border border-blue-200 text-blue-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-50 transition">只填補空白</button>
                        </div>
                        <span className="text-[10px] text-blue-400 ml-auto hidden md:inline-block">* 系統將自動計算總價</span>
                    </div>
                </div>
                
                <div className="space-y-4">
                    {Object.entries(groupedUnits).map(([zone, zoneUnits]) => (
                        <div key={zone} className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-slate-50/50">
                            <div onClick={() => toggleZone(zone)} className="bg-slate-100 px-4 py-3 flex justify-between items-center cursor-pointer hover:bg-slate-200 transition">
                            <div className="flex items-center gap-2">
                                {collapsedZones[zone] ? <Folder size={18} className="text-slate-400"/> : <FolderOpen size={18} className="text-orange-500"/>}
                                <span className="font-bold text-slate-700">{zone} 區</span>
                                <span className="bg-slate-200 text-slate-500 text-[10px] px-2 py-0.5 rounded-full">{zoneUnits.length} 戶</span>
                            </div>
                            <ChevronDown size={16} className={`text-slate-400 transition-transform ${collapsedZones[zone] ? '-rotate-90' : ''}`} />
                            </div>
                            
                            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 transition-all ${collapsedZones[zone] ? 'hidden' : 'block'}`}>
                            {zoneUnits.map((u) => (
                                <div key={u.id} className="p-4 border border-slate-200 rounded-xl bg-white hover:border-orange-300 transition shadow-sm relative group">
                                    <div className="grid grid-cols-2 gap-3 mb-3">
                                        <div className="col-span-1"><label className="text-[10px] text-slate-400 font-bold block uppercase mb-1">戶號</label><input value={u.number} onChange={e=>handleUnitChange(u.id, 'number', e.target.value)} className="w-full bg-slate-50 border rounded p-1.5 text-sm font-bold text-center" placeholder="A1"/></div>
                                        <div className="col-span-1"><label className="text-[10px] text-slate-400 font-bold block uppercase mb-1">狀態</label><select value={u.status} onChange={e=>handleUnitChange(u.id, 'status', e.target.value)} className="w-full bg-slate-50 border rounded p-1.5 text-xs"><option value="available">🟢 可銷售</option><option value="reserved">🟡 已預訂</option><option value="sold">🔴 已售出</option></select></div>
                                        <div className="col-span-1"><label className="text-[10px] text-slate-400 font-bold block uppercase mb-1">坪數</label><input value={u.ping} onChange={e=>handleUnitChange(u.id, 'ping', e.target.value)} className="w-full border-b bg-transparent p-1 text-sm focus:outline-none focus:border-orange-500" placeholder="0"/></div>
                                        <div className="col-span-1"><label className="text-[10px] text-slate-400 font-bold block uppercase mb-1">單價 (萬/坪)</label><input value={u.unitPrice} onChange={e=>handleUnitChange(u.id, 'unitPrice', e.target.value)} className="w-full border-b bg-transparent p-1 text-sm focus:outline-none focus:border-orange-500 text-blue-600" placeholder="0.0"/></div>
                                        <div className="col-span-2"><label className="text-[10px] text-slate-400 font-bold block uppercase mb-1">總價 (自動計算)</label><input value={u.price} readOnly className="w-full border-b bg-transparent p-1 text-sm font-black text-orange-600 outline-none" placeholder="總價"/></div>
                                    </div>
                                    <div className="flex justify-between items-center border-t border-slate-200 pt-2">
                                        <label className="cursor-pointer text-xs text-blue-500 hover:text-blue-700 font-bold flex items-center gap-1"><Upload size={12}/> {u.layout ? "更換圖檔" : "上傳平面圖"}<input type="file" className="hidden" onChange={e=>handleUpload(e, (url)=>handleUnitChange(u.id, 'layout', url))}/></label>
                                        <div className="flex gap-2">
                                        <button onClick={() => handleDuplicateUnit(u)} className="text-slate-400 hover:text-green-600" title="複製戶別"><Copy size={14}/></button>
                                        <button onClick={()=>setUnits(prev => prev.filter(item => item.id !== u.id))} className="text-slate-300 hover:text-red-500"><Trash2 size={14}/></button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            </div>
                        </div>
                    ))}
                </div>
                </section>
            </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyPanel;