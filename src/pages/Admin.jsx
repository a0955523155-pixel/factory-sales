import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { collection, addDoc, getDocs, doc, updateDoc, setDoc, getDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { X, Plus, Trash2, Layout, Users, Settings, Map as MapIcon, Upload, Languages, FileText, Sparkles, LogIn, LogOut, GripVertical, ChevronUp, ChevronDown, RefreshCcw, MousePointer2, Crop, Move, Maximize2, RotateCw, Type, AlignLeft, AlignCenter, AlignRight, CheckCircle, Palette, Copy } from 'lucide-react';

const safeStr = (val) => (val === undefined || val === null) ? "" : String(val);

const compressImage = (file) => {
  const watermarkText = "綠芽團隊0800666738.com";
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
        const maxWidth = 1200; 
        if (width > maxWidth) { height = (height * maxWidth) / width; width = maxWidth; }
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const fontSize = width * 0.025;
        ctx.font = `bold ${fontSize}px Arial`;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.textAlign = 'right';
        ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
        ctx.shadowBlur = 4;
        ctx.fillText(watermarkText, width - 20, height - 20);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
    };
  });
};

const Admin = () => {
  const navigate = useNavigate();
  const [isAuth, setIsAuth] = useState(false);
  const [loginForm, setLoginForm] = useState({ user: '', pass: '' });
  const [viewMode, setViewMode] = useState('properties'); 
  const [properties, setProperties] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [editId, setEditId] = useState(null);
  const dragItem = useRef(); const dragOverItem = useRef();

  const [formData, setFormData] = useState({ 
    title: '', titleEN: '', subtitle: '', description: '',
    price: '', address: '', 
    city: '高雄', propertyType: '工業地', usageType: '廠房',
    agentPhone: '', agentName: '', lineId: '', lineQr: '', 
    googleMapUrl: '', thumb: '', images: [],
    interactiveMap: '' 
  });
  const [specs, setSpecs] = useState([{ id: 's1', label: "使用分區", value: "乙種工業區" }]);
  const [features, setFeatures] = useState([{ id: 'f1', title: "特色標題", desc: "" }]);
  const [envList, setEnvList] = useState([{ id: 'e1', title: "", desc: "", image: "", link: "" }]);
  const [progressList, setProgressList] = useState([{ id: 'p1', date: '', status: '' }]);
  
  // 移除 mapLabel，改用 status 自動判斷
  const [units, setUnits] = useState([{ 
    id: 'u1', number: '', ping: '', price: '', status: 'available', layout: '', 
    mapPoints: null, 
    mapColor: '#ea580c', mapFontSize: 12, mapFont: 'sans-serif', mapTextAlign: 'middle', mapTextColor: '#ffffff'
  }]);

  // --- 繪圖與拖曳狀態 ---
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentUnitId, setCurrentUnitId] = useState(null);
  const [tempPoints, setTempPoints] = useState([]); 
  const [mousePos, setMousePos] = useState(null);
  
  // 拖曳相關狀態
  const [draggingUnitId, setDraggingUnitId] = useState(null);
  const [dragStartPos, setDragStartPos] = useState(null); // {x, y} percentage
  
  const mapImgRef = useRef(null);

  const [articleForm, setArticleForm] = useState({ category: 'news_local', title: '', content: '', date: '', image: '' });
  const [editArticleId, setEditArticleId] = useState(null);
  const [globalSettings, setGlobalSettings] = useState({ siteName: "Factory Pro", heroTitleCN: "未來工廠", heroTitleEN: "FUTURE FACTORY", contactPhone: "0800-666-738", fbLink: "", igLink: "", lineLink: "", iconFB: "", iconIG: "", iconLINE: "" });

  const fontOptions = [
    { label: '預設黑體', value: 'sans-serif' }, { label: '微軟正黑', value: '"Microsoft JhengHei", sans-serif' },
    { label: '標楷體', value: '"KaiTi", "BiauKai", serif' }, { label: '明體', value: '"PMingLiU", serif' }, { label: '圓體', value: '"Varela Round", sans-serif' },
  ];

  const statusTextMap = { available: '可銷售', reserved: '已預訂', sold: '已售出' };

  useEffect(() => { const storedAuth = localStorage.getItem('isAuth'); if (storedAuth === 'true') { setIsAuth(true); fetchAll(); } }, []);
  const fetchAll = () => { fetchProperties(); fetchGlobalSettings(); fetchCustomers(); fetchArticles(); };
  const handleLogin = (e) => { e.preventDefault(); if (loginForm.user === 'gst0800666738' && loginForm.pass === '0800666738') { setIsAuth(true); localStorage.setItem('isAuth', 'true'); fetchAll(); } else { alert("帳號或密碼錯誤"); } };
  const handleLogout = () => { if (window.confirm("登出？")) { setIsAuth(false); localStorage.removeItem('isAuth'); navigate('/'); } };

  const fetchProperties = async () => { try { const snap = await getDocs(collection(db, "properties")); const list = []; snap.forEach((doc) => list.push({ id: doc.id, ...doc.data() })); setProperties(list); } catch (e) {} };
  const fetchArticles = async () => { try { const snap = await getDocs(collection(db, "articles")); const list = []; snap.forEach((doc) => list.push({ id: doc.id, ...doc.data() })); list.sort((a, b) => { if (a.order !== undefined && b.order !== undefined) return a.order - b.order; return (b.createdAt || 0) - (a.createdAt || 0); }); setArticles(list); } catch (e) {} };
  const fetchGlobalSettings = async () => { try { const docSnap = await getDoc(doc(db, "settings", "global")); if (docSnap.exists()) setGlobalSettings(docSnap.data()); } catch (e) {} };
  const fetchCustomers = async () => { try { const snap = await getDocs(collection(db, "customers")); const list = []; snap.forEach((doc) => list.push({ id: doc.id, ...doc.data() })); list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)); setCustomers(list); } catch (e) {} };

  // --- SVG 座標轉換 ---
  const getRelPos = (e) => {
    if (!mapImgRef.current) return { x: 0, y: 0 };
    const rect = mapImgRef.current.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * 100, 
      y: ((e.clientY - rect.top) / rect.height) * 100
    };
  };

  // --- 繪圖：點擊畫點 ---
  const handleMapClick = (e) => {
    if (!isDrawing) return;
    const pos = getRelPos(e);

    // 吸附閉合檢測 (距離小於 3%)
    if (tempPoints.length > 2) { 
        const start = tempPoints[0];
        const dist = Math.sqrt(Math.pow(pos.x - start.x, 2) + Math.pow(pos.y - start.y, 2));
        
        if (dist < 3) {
            const updatedUnits = units.map(u => {
                if (u.id === currentUnitId) return { ...u, mapPoints: tempPoints };
                return u;
            });
            setUnits(updatedUnits);
            setIsDrawing(false); // 畫完自動關閉
            setTempPoints([]);
            setCurrentUnitId(null);
            return;
        }
    }
    setTempPoints([...tempPoints, pos]);
  };

  // --- 拖曳多邊形邏輯 ---
  const handlePolygonMouseDown = (e, unitId) => {
    if (isDrawing) return; // 畫圖時不能拖曳
    e.stopPropagation();
    setDraggingUnitId(unitId);
    setDragStartPos(getRelPos(e));
  };

  const handleMouseMove = (e) => {
    const currentPos = getRelPos(e);
    
    // 1. 畫圖預覽
    if (isDrawing) { 
        setMousePos(currentPos); 
    }
    
    // 2. 拖曳多邊形
    if (draggingUnitId && dragStartPos) {
        const dx = currentPos.x - dragStartPos.x;
        const dy = currentPos.y - dragStartPos.y;

        setUnits(prevUnits => prevUnits.map(u => {
            if (u.id === draggingUnitId && u.mapPoints) {
                return {
                    ...u,
                    mapPoints: u.mapPoints.map(p => ({ x: p.x + dx, y: p.y + dy }))
                };
            }
            return u;
        }));
        setDragStartPos(currentPos); // 更新起點，實現連續拖曳
    }
  };

  const handleMouseUp = () => {
    setDraggingUnitId(null);
    setDragStartPos(null);
  };

  // --- 複製戶別 ---
  const handleDuplicateUnit = (unit) => {
    const newUnit = { 
        ...unit, 
        id: Date.now(), 
        number: `${unit.number} (複製)`,
        mapPoints: null // 不複製框選內容
    };
    setUnits([...units, newUnit]);
  };

  // 計算文字中心
  const getPolygonCenter = (points) => {
    if (!points || points.length === 0) return { x: 50, y: 50 };
    const x = points.reduce((sum, p) => sum + p.x, 0) / points.length;
    const y = points.reduce((sum, p) => sum + p.y, 0) / points.length;
    return { x, y };
  };

  const pointsToString = (points) => points.map(p => `${p.x},${p.y}`).join(" ");

  const loadEdit = (item) => {
    setEditId(item.id); const info = item.basicInfo || {};
    setFormData({
      title: safeStr(info.title), titleEN: safeStr(info.titleEN), subtitle: safeStr(info.subtitle), description: safeStr(info.description),
      price: safeStr(info.price), address: safeStr(info.address), city: safeStr(info.city) || '高雄', propertyType: safeStr(info.propertyType) || '工業地', usageType: safeStr(info.usageType) || '廠房',
      agentPhone: safeStr(info.agentPhone), agentName: safeStr(info.agentName), lineId: safeStr(info.lineId), lineQr: safeStr(info.lineQr), googleMapUrl: safeStr(info.googleMapUrl),
      thumb: safeStr(info.thumb), images: Array.isArray(info.images) ? info.images : [], interactiveMap: safeStr(info.interactiveMap)
    });
    setSpecs(Array.isArray(item.specs) ? item.specs : []); setFeatures(Array.isArray(item.features) ? item.features : []);
    setEnvList(item.environmentList || []); setProgressList(item.progressHistory || []); setUnits(item.units || []);
  };

  const loadEditArticle = (item) => { setEditArticleId(item.id); setArticleForm({ ...item }); };
  const handleUpload = async (e, callback) => { const file = e.target.files[0]; if (!file) return; setCompressing(true); try { const compressed = await compressImage(file); callback(compressed); } catch (e) {} setCompressing(false); };

  const resetForm = () => {
    setEditId(null);
    setFormData({ title: '', titleEN: '', subtitle: '', description: '', price: '', address: '', city: '高雄', propertyType: '工業地', usageType: '廠房', agentPhone: '', agentName: '', lineId: '', lineQr: '', googleMapUrl: '', thumb: '', images: [], interactiveMap: '' });
    setSpecs([{ id: `s-${Date.now()}`, label: "使用分區", value: "乙種工業區" }]); setFeatures([{ id: `f-${Date.now()}`, title: "特色標題", desc: "" }]);
    setEnvList([{ id: `e-${Date.now()}`, title: "", desc: "", image: "", link: "" }]);
    setProgressList([{ id: `p-${Date.now()}`, date: "", status: "" }]); setUnits([{ id: `u-${Date.now()}`, number: '', mapColor: '#ea580c', mapFontSize: 12, mapFont: 'sans-serif', mapTextAlign: 'middle', mapTextColor: '#ffffff', ping: '', price: '', status: 'available', layout: '', mapPoints: null }]);
  };

  const handleSubmit = async (e) => { e.preventDefault(); setLoading(true); const payload = { basicInfo: formData, specs, features, environmentList: envList, progressHistory: progressList, units, images: formData.images, updatedAt: new Date() }; if (editId) await updateDoc(doc(db, "properties", editId), payload); else await addDoc(collection(db, "properties"), payload); alert("儲存成功！"); window.location.reload(); setLoading(false); };
  const handleArticleSubmit = async (e) => { e.preventDefault(); setLoading(true); const payload = { ...articleForm, createdAt: Date.now(), updatedAt: new Date(), order: -Date.now() }; if (editArticleId) { delete payload.order; await updateDoc(doc(db, "articles", editArticleId), payload); } else { await addDoc(collection(db, "articles"), payload); } alert("發布成功！"); setArticleForm({ category: 'news_local', title: '', content: '', date: '', image: '' }); setEditArticleId(null); fetchArticles(); setLoading(false); };
  const handleTranslate = async () => { if (!formData.title) return alert("請先輸入中文"); setTranslating(true); try { const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(formData.title)}&langpair=zh-TW|en`); const data = await response.json(); if (data.responseData.translatedText) setFormData(prev => ({ ...prev, titleEN: data.responseData.translatedText })); } catch (error) {} setTranslating(false); };
  const handleAIWrite = () => { if (!articleForm.title) return alert("請輸入標題"); const templates = [`【${articleForm.title}】\n\n隨著產業需求增長...`]; setArticleForm(prev => ({ ...prev, content: templates[0] })); };
  const handleSaveSettings = async () => { setLoading(true); await setDoc(doc(db, "settings", "global"), globalSettings); alert("已更新"); window.location.reload(); setLoading(false); };
  const handleDeleteProperty = async (e, id) => { e.stopPropagation(); if (!window.confirm("刪除？")) return; await deleteDoc(doc(db, "properties", id)); fetchProperties(); };
  const handleDeleteArticle = async (id) => { if (!window.confirm("刪除？")) return; await deleteDoc(doc(db, "articles", id)); fetchArticles(); };
  const moveArticle = async (index, direction) => { const newItems = [...articles]; if (direction === 'up' && index > 0) { [newItems[index], newItems[index - 1]] = [newItems[index - 1], newItems[index]]; } else if (direction === 'down' && index < newItems.length - 1) { [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]]; } else { return; } setArticles(newItems); saveOrder(newItems); };
  const handleDragStart = (e, position) => { dragItem.current = position; };
  const handleDragEnter = (e, position) => { dragOverItem.current = position; };
  const handleDragEnd = async () => { const copyListItems = [...articles]; const dragItemContent = copyListItems[dragItem.current]; copyListItems.splice(dragItem.current, 1); copyListItems.splice(dragOverItem.current, 0, dragItemContent); dragItem.current = null; dragOverItem.current = null; setArticles(copyListItems); saveOrder(copyListItems); };
  const saveOrder = async (items) => { try { const batch = writeBatch(db); items.forEach((item, index) => { const ref = doc(db, "articles", item.id); batch.update(ref, { order: index }); }); await batch.commit(); } catch (e) {} };
  const resetOrderToDate = async () => { if (!window.confirm("重排？")) return; const sorted = [...articles].sort((a, b) => new Date(b.date) - new Date(a.date)); setArticles(sorted); saveOrder(sorted); };

  const inputStyle = "w-full bg-white border border-slate-300 text-slate-800 p-3 md:p-2.5 text-base md:text-sm focus:outline-none focus:border-orange-500 rounded-lg shadow-sm transition placeholder:text-slate-300";
  const labelStyle = "block text-xs font-bold text-slate-500 mb-1.5 tracking-wider uppercase";
  const propertyTypes = ['工業地', '農地', '建地'];
  const usageTypes = { '工業地': ['廠房', '工業地', '買賣', '租賃'], '農地': ['農地廠房', '農地', '買賣', '租賃'], '建地': ['建地廠房', '透天', '套房', '買賣', '租賃'] };

  if (!isAuth) return ( <div className="h-screen flex items-center justify-center bg-slate-100 px-4"><form onSubmit={handleLogin} className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm border border-slate-200"><div className="text-center mb-8"><div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 text-white"><LogIn size={32}/></div><h1 className="text-2xl font-black text-slate-900">綠芽管理員登入</h1></div><div className="space-y-4"><input type="text" placeholder="帳號" value={loginForm.user} onChange={e=>setLoginForm({...loginForm, user:e.target.value})} className="w-full p-3 border rounded-xl bg-slate-50 focus:border-orange-500 outline-none" autoComplete="username" /><input type="password" placeholder="密碼" value={loginForm.pass} onChange={e=>setLoginForm({...loginForm, pass:e.target.value})} className="w-full p-3 border rounded-xl bg-slate-50 focus:border-orange-500 outline-none" autoComplete="current-password" /><button type="submit" className="w-full bg-orange-600 text-white py-3 rounded-xl font-bold hover:bg-orange-700 transition shadow-lg">登入系統</button></div></form></div> );

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-slate-100 text-slate-800 font-sans overflow-hidden">
      <div className="w-full lg:w-64 bg-white border-b lg:border-b-0 lg:border-r border-slate-200 flex flex-col shrink-0">
        <div className="p-4 md:p-5 flex justify-between items-center lg:block"><h2 className="font-black text-xl text-slate-900 tracking-tight">綠芽管理員</h2><button onClick={handleLogout} className="lg:hidden text-slate-400 hover:text-red-500"><LogOut size={20}/></button></div>
        <div className="flex lg:flex-col gap-2 p-2 overflow-x-auto lg:overflow-visible scrollbar-hide"><button onClick={() => setViewMode('properties')} className={`flex-shrink-0 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition whitespace-nowrap ${viewMode === 'properties' ? 'bg-orange-50 text-orange-600' : 'text-slate-500 hover:bg-slate-50'}`}><Layout size={18}/> 案場管理</button><button onClick={() => setViewMode('articles')} className={`flex-shrink-0 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition whitespace-nowrap ${viewMode === 'articles' ? 'bg-orange-50 text-orange-600' : 'text-slate-500 hover:bg-slate-50'}`}><FileText size={18}/> 文章管理</button><button onClick={() => setViewMode('customers')} className={`flex-shrink-0 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition whitespace-nowrap ${viewMode === 'customers' ? 'bg-orange-50 text-orange-600' : 'text-slate-500 hover:bg-slate-50'}`}><Users size={18}/> 客戶資料</button><button onClick={() => setViewMode('settings')} className={`flex-shrink-0 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition whitespace-nowrap ${viewMode === 'settings' ? 'bg-orange-50 text-orange-600' : 'text-slate-500 hover:bg-slate-50'}`}><Settings size={18}/> 網站設定</button></div>
        <div className="mt-auto p-4 hidden lg:block border-t border-slate-100"><button onClick={handleLogout} className="flex items-center gap-2 text-slate-400 hover:text-red-500 text-sm font-bold transition w-full px-4 py-2 hover:bg-red-50 rounded-xl"><LogOut size={18}/> 登出系統</button></div>
        {viewMode === 'properties' && (<div className="flex-1 overflow-y-auto p-3 space-y-2 border-t lg:border-t-0 border-slate-100 hidden lg:block"><button onClick={resetForm} className="w-full py-2 bg-orange-500 text-white rounded-lg font-bold text-sm hover:bg-orange-600 mb-4 shadow">+ 新增案場</button>{properties.map(p => (<div key={p.id} onClick={() => loadEdit(p)} className={`p-3 border cursor-pointer hover:bg-white rounded-xl flex justify-between items-center group transition ${editId === p.id ? 'border-orange-500 bg-white shadow-md' : 'border-slate-100 bg-slate-50'}`}><div className="font-bold text-sm truncate w-32 text-slate-700">{p.basicInfo.title}</div><button onClick={(e) => handleDeleteProperty(e, p.id)} className="text-slate-300 hover:text-red-500 p-1"><Trash2 size={14} /></button></div>))}</div>)}
      </div>

      <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden">
        {/* Settings, Customers, Articles 省略 */}
        {viewMode === 'settings' && (<div className="p-6 md:p-10 max-w-3xl mx-auto w-full overflow-y-auto"><h1 className="text-2xl md:text-3xl font-black mb-8">網站全域設定</h1><div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 space-y-6"><div><label className={labelStyle}>左上角網站名稱</label><input value={globalSettings.siteName} onChange={e=>setGlobalSettings({...globalSettings, siteName: e.target.value})} className={inputStyle} /></div><div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div><label className={labelStyle}>首頁大標題 (中文)</label><input value={globalSettings.heroTitleCN} onChange={e=>setGlobalSettings({...globalSettings, heroTitleCN: e.target.value})} className={inputStyle} /></div><div><label className={labelStyle}>首頁大標題 (英文)</label><input value={globalSettings.heroTitleEN} onChange={e=>setGlobalSettings({...globalSettings, heroTitleEN: e.target.value})} className={inputStyle} /></div></div><div><label className={labelStyle}>全站聯絡電話</label><input value={globalSettings.contactPhone} onChange={e=>setGlobalSettings({...globalSettings, contactPhone: e.target.value})} className={inputStyle} /></div><h3 className="font-black border-l-4 border-orange-500 pl-2 mt-4">社群連結</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label className={labelStyle}>FB 連結</label><input value={globalSettings.fbLink} onChange={e=>setGlobalSettings({...globalSettings, fbLink: e.target.value})} className={inputStyle} /></div><div><label className={labelStyle}>FB 圖示</label><input type="file" onChange={e=>handleUpload(e, (url)=>setGlobalSettings({...globalSettings, iconFB: url}))} className="text-xs"/>{globalSettings.iconFB && <img src={globalSettings.iconFB} className="h-8 w-8 rounded-full border"/>}</div><div><label className={labelStyle}>IG 連結</label><input value={globalSettings.igLink} onChange={e=>setGlobalSettings({...globalSettings, igLink: e.target.value})} className={inputStyle} /></div><div><label className={labelStyle}>IG 圖示</label><input type="file" onChange={e=>handleUpload(e, (url)=>setGlobalSettings({...globalSettings, iconIG: url}))} className="text-xs"/>{globalSettings.iconIG && <img src={globalSettings.iconIG} className="h-8 w-8 rounded-full border"/>}</div><div><label className={labelStyle}>LINE 連結</label><input value={globalSettings.lineLink} onChange={e=>setGlobalSettings({...globalSettings, lineLink: e.target.value})} className={inputStyle} /></div><div><label className={labelStyle}>LINE 圖示</label><input type="file" onChange={e=>handleUpload(e, (url)=>setGlobalSettings({...globalSettings, iconLINE: url}))} className="text-xs"/>{globalSettings.iconLINE && <img src={globalSettings.iconLINE} className="h-8 w-8 rounded-full border"/>}</div></div><button onClick={handleSaveSettings} disabled={loading} className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-orange-600 transition shadow-lg mt-4">{loading ? "處理中..." : "儲存設定"}</button></div></div>)}
        {viewMode === 'customers' && (<div className="p-6 md:p-10 w-full max-w-7xl mx-auto overflow-y-auto"><h1 className="text-2xl md:text-3xl font-black mb-8">客戶諮詢資料表</h1><div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden overflow-x-auto"><table className="w-full text-sm text-left min-w-[600px]"><thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs border-b border-slate-200"><tr><th className="p-5">日期</th><th className="p-5">姓名</th><th className="p-5">電話</th><th className="p-5">行業</th><th className="p-5">需求</th><th className="p-5">坪數</th></tr></thead><tbody>{customers.map(c => (<tr key={c.id} className="border-b border-slate-100 hover:bg-orange-50/50 transition"><td className="p-5 font-mono text-slate-400">{new Date(c.createdAt?.seconds * 1000).toLocaleDateString()}</td><td className="p-5 font-bold text-slate-800">{c.name}</td><td className="p-5 text-orange-600 font-bold">{c.phone}</td><td className="p-5">{c.industry}</td><td className="p-5"><span className="bg-slate-100 px-2 py-1 rounded text-xs font-bold text-slate-600">{c.needs}</span></td><td className="p-5">{c.ping}</td></tr>))}</tbody></table></div></div>)}
        {viewMode === 'articles' && (<div className="flex flex-col md:flex-row h-full"><div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-slate-200 bg-white p-4 overflow-y-auto shrink-0 max-h-[40vh] md:max-h-full"><button onClick={() => {setEditArticleId(null); setArticleForm({ category: 'news_local', title: '', content: '', date: '', image: '' });}} className="w-full bg-slate-900 text-white py-3 rounded-lg mb-4 text-sm font-bold shadow hover:bg-black transition">+ 撰寫新文章</button><div className="space-y-2"><div className="flex justify-between items-center mb-2 px-1"><p className="text-xs text-slate-400">排序</p><button onClick={resetOrderToDate} className="text-[10px] flex items-center gap-1 text-blue-500 hover:underline"><RefreshCcw size={10}/> 重排</button></div>{articles.map((a, index) => (<div key={a.id} draggable onDragStart={(e) => handleDragStart(e, index)} onDragEnter={(e) => handleDragEnter(e, index)} onDragEnd={handleDragEnd} onClick={()=>loadEditArticle(a)} className={`p-3 border mb-2 rounded-xl cursor-grab active:cursor-grabbing transition relative group flex items-center gap-3 ${editArticleId===a.id ? 'border-orange-500 bg-orange-50' : 'border-slate-100 hover:border-slate-300'}`}><div className="flex flex-col gap-1 md:hidden"><button onClick={(e) => { e.stopPropagation(); moveArticle(index, 'up'); }} className="p-1 bg-slate-100 rounded hover:bg-slate-200"><ChevronUp size={12}/></button><button onClick={(e) => { e.stopPropagation(); moveArticle(index, 'down'); }} className="p-1 bg-slate-100 rounded hover:bg-slate-200"><ChevronDown size={12}/></button></div><GripVertical size={16} className="text-slate-300 hidden md:block"/><div className="flex-1 min-w-0"><span className={`text-[10px] px-2 py-0.5 rounded-full text-white font-bold inline-block mb-1 bg-gray-500`}>{a.category}</span><div className="font-bold text-slate-800 line-clamp-1 text-sm">{a.title}</div></div><button onClick={(e) => {e.stopPropagation(); handleDeleteArticle(a.id);}} className="text-slate-300 hover:text-red-500"><Trash2 size={16}/></button></div>))}</div></div><div className="flex-1 p-6 md:p-10 overflow-y-auto bg-slate-50"><div className="max-w-3xl mx-auto"><div className="flex justify-between items-center mb-8"><h2 className="text-2xl md:text-3xl font-black">{editArticleId ? '編輯文章' : '新增文章'}</h2><button onClick={handleArticleSubmit} disabled={loading} className="bg-orange-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-orange-500 shadow-lg transition text-sm">{loading ? "發布中..." : "確認發布"}</button></div><div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 space-y-6"><div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div><label className={labelStyle}>文章分類</label><select value={articleForm.category} onChange={e=>setArticleForm({...articleForm, category: e.target.value})} className={inputStyle}><option value="news_local">最新消息-地方新聞</option><option value="news_project">最新消息-建案新訊</option><option value="works">經典作品</option><option value="about">關於我們</option></select></div><div><label className={labelStyle}>發布日期</label><input type="date" value={articleForm.date} onChange={e=>setArticleForm({...articleForm, date: e.target.value})} className={inputStyle}/></div></div><div><label className={labelStyle}>文章標題</label><input value={articleForm.title} onChange={e=>setArticleForm({...articleForm, title: e.target.value})} className={inputStyle} placeholder="請輸入吸引人的標題..."/></div><div className="relative"> <div className="flex justify-between items-center mb-1"> <label className={labelStyle}>文章內容</label> <button type="button" onClick={handleAIWrite} className="text-xs flex items-center gap-1 text-purple-600 font-bold hover:text-purple-800 bg-purple-50 px-2 py-1 rounded transition"><Sparkles size={12}/> AI 自動撰寫</button> </div> <textarea value={articleForm.content} onChange={e=>setArticleForm({...articleForm, content: e.target.value})} className={`${inputStyle} h-64 leading-relaxed`} placeholder="輸入內容，或點擊 AI 自動撰寫..."/></div><div><label className={labelStyle}>封面圖片 (自動壓浮水印)</label><div className="flex items-center gap-4"><label className="cursor-pointer bg-slate-100 hover:bg-slate-200 px-4 py-3 rounded-lg flex items-center gap-2 text-sm font-bold text-slate-600 transition"><Upload size={16}/> 上傳圖片 <input type="file" className="hidden" onChange={e=>handleUpload(e, (url)=>setArticleForm({...articleForm, image: url}))}/></label>{articleForm.image && <img src={articleForm.image} className="h-20 w-32 object-cover rounded-lg border border-slate-200 shadow-sm"/>}</div></div></div></div></div></div>)}
        
        {viewMode === 'properties' && (
          <>
            <div className="lg:hidden p-2 bg-white border-b overflow-x-auto flex gap-2"><button onClick={resetForm} className="bg-orange-500 text-white px-3 py-1.5 rounded-lg font-bold text-xs shrink-0">+ 新增</button>{properties.map(p => (<button key={p.id} onClick={() => loadEdit(p)} className={`px-3 py-1.5 rounded-lg border text-xs font-bold shrink-0 whitespace-nowrap ${editId === p.id ? 'bg-orange-50 border-orange-500 text-orange-600' : 'bg-slate-50 border-slate-200'}`}>{p.basicInfo.title.substring(0, 6)}...</button>))}</div>
            <div className="p-4 border-b bg-white flex justify-between items-center px-4 md:px-8"><h1 className="font-bold text-lg md:text-xl">{editId ? '編輯模式' : '新增模式'}</h1><button onClick={handleSubmit} disabled={loading || compressing} className="bg-orange-600 text-white px-6 py-2 text-sm font-bold hover:bg-orange-500 rounded-xl shadow-lg shadow-orange-200 transition">{compressing ? '圖片處理中...' : loading ? '存檔中...' : '儲存專案'}</button></div>
            <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-5xl mx-auto w-full">
                <div className="space-y-10 pb-20">
                  {/* 基本資料 (省略) */}
                  <section className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200"><h3 className="font-black text-lg border-l-4 border-orange-500 pl-3 mb-6">基本資料</h3>
                    <div className="mb-4"><label className={labelStyle}>物件介紹 (詳細描述)</label><textarea value={formData.description} onChange={e=>setFormData({...formData, description:e.target.value})} className={`${inputStyle} h-32`} placeholder="稀有釋出，頂規資產配置..." /></div><div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div className="col-span-1 md:col-span-2"><label className={labelStyle}>標題</label><input value={formData.title} onChange={e=>setFormData({...formData, title:e.target.value})} className={inputStyle} placeholder="例如：台積電概念園區"/></div><div className="col-span-1 md:col-span-2"><div className="flex gap-2"><div className="flex-1"><label className={labelStyle}>英文標題 (AI)</label><input value={formData.titleEN} onChange={e=>setFormData({...formData, titleEN:e.target.value})} className={inputStyle} placeholder="點擊翻譯按鈕自動生成..."/></div><button onClick={handleTranslate} disabled={translating} className="mt-6 bg-slate-800 text-white px-4 rounded-lg text-sm font-bold hover:bg-black transition flex items-center gap-2">{translating?"...":<><Languages size={14}/> 翻譯</>}</button></div></div><div className="col-span-1 md:col-span-2"><label className={labelStyle}>副標題</label><input value={formData.subtitle} onChange={e=>setFormData({...formData, subtitle:e.target.value})} className={inputStyle} placeholder="例如：稀有釋出，機會難得"/></div>
                  <div><label className={labelStyle}>縣市區域</label><select value={formData.city} onChange={e=>setFormData({...formData, city:e.target.value})} className={inputStyle}><option value="高雄">高雄</option><option value="屏東">屏東</option></select></div><div><label className={labelStyle}>物件屬性</label><select value={formData.propertyType} onChange={e=>setFormData({...formData, propertyType:e.target.value})} className={inputStyle}>{propertyTypes.map(t=><option key={t} value={t}>{t}</option>)}</select></div><div><label className={labelStyle}>交易類別/用途</label><select value={formData.usageType} onChange={e=>setFormData({...formData, usageType:e.target.value})} className={inputStyle}>{(usageTypes[formData.propertyType] || []).map(u=><option key={u} value={u}>{u}</option>)}</select></div><div><label className={labelStyle}>價格</label><input value={formData.price} onChange={e=>setFormData({...formData, price:e.target.value})} className={inputStyle} placeholder="例如：1,880 萬"/></div><div className="col-span-1 md:col-span-2"><label className={labelStyle}>地址</label><input value={formData.address} onChange={e=>setFormData({...formData, address:e.target.value})} className={inputStyle} placeholder="例如：高雄市仁武區..."/></div><div className="col-span-1 md:col-span-2"><label className={labelStyle}><MapIcon size={12} className="inline mr-1"/> Google 地圖嵌入網址</label><input value={formData.googleMapUrl} onChange={e=>setFormData({...formData, googleMapUrl:e.target.value})} className={inputStyle} placeholder="貼上 iframe src 網址" /></div><div><label className={labelStyle}>經紀人電話</label><input value={formData.agentPhone} onChange={e=>setFormData({...formData, agentPhone:e.target.value})} className={inputStyle} placeholder="例如：0912-345-678"/></div><div><label className={labelStyle}>經紀人姓名</label><input value={formData.agentName} onChange={e=>setFormData({...formData, agentName:e.target.value})} className={inputStyle} placeholder="例如：王小明"/></div><div><label className={labelStyle}>LINE ID</label><input value={formData.lineId} onChange={e=>setFormData({...formData, lineId:e.target.value})} className={inputStyle} placeholder="例如：wang123"/></div><div><label className={labelStyle}>LINE QR 圖片</label><input type="file" onChange={e=>handleUpload(e, (url)=>setFormData({...formData, lineQr: url}))} className="text-xs"/></div><div className="col-span-1 md:col-span-2"><label className={labelStyle}>封面圖</label><input type="file" onChange={e=>handleUpload(e, (url)=>setFormData({...formData, thumb: url}))} className="text-xs"/></div></div></section>
                  
                  {/* 互動地圖 */}
                  <section className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200">
                     <h3 className="font-black text-lg border-l-4 border-orange-500 pl-3 mb-6">互動平面圖 (多邊形繪製)</h3>
                     <div className="mb-4">
                        <label className={labelStyle}>上傳平面圖</label>
                        <div className="flex gap-4 items-center"><input type="file" onChange={e=>handleUpload(e, (url)=>setFormData({...formData, interactiveMap: url}))} className="text-xs"/>{formData.interactiveMap && <img src={formData.interactiveMap} className="h-20 object-contain border"/>}</div>
                     </div>
                     <div className="bg-slate-100 p-4 rounded text-xs text-slate-500 mb-4"><p>💡 操作說明：1. 點擊「戶別列表」中的 <span className="bg-slate-200 px-1 rounded">開始繪製</span>。 2. 在圖上點擊位置增加頂點 (至少3點)。 3. 點擊起點附近的綠色圓圈即可閉合區域。</p></div>
                     
                     {formData.interactiveMap && (
                       <div 
                         className="relative border-2 border-dashed border-slate-300 rounded overflow-hidden select-none bg-slate-50 w-full"
                         onMouseMove={handleMouseMove}
                         onMouseUp={handleMouseUp}
                       >
                          <img ref={mapImgRef} src={formData.interactiveMap} className="w-full h-auto opacity-0 absolute pointer-events-none" />
                          <div className="relative w-full h-auto">
                             <img src={formData.interactiveMap} className="w-full h-auto block" />
                             <svg 
                                className="absolute inset-0 w-full h-full cursor-crosshair"
                                viewBox="0 0 100 100" 
                                preserveAspectRatio="none"
                                onClick={handleMapClick}
                             >
                                {units.map((u, i) => u.mapPoints && (
                                   <g 
                                      key={i} 
                                      onClick={(e) => { e.stopPropagation(); }}
                                      onMouseDown={(e) => handlePolygonMouseDown(e, u.id)}
                                      className="cursor-move"
                                   >
                                      <polygon 
                                         points={pointsToString(u.mapPoints)}
                                         fill={u.mapColor || '#ea580c'}
                                         fillOpacity="0.5"
                                         stroke={draggingUnitId === u.id ? "white" : "none"} // 拖曳時顯示框
                                         strokeWidth="0.5"
                                      />
                                      <text 
                                         x={getPolygonCenter(u.mapPoints).x} 
                                         y={getPolygonCenter(u.mapPoints).y}
                                         fontSize={u.mapFontSize/5 || 2.5} 
                                         fill={u.mapTextColor || 'white'}
                                         textAnchor={u.mapTextAlign || "middle"}
                                         alignmentBaseline="middle"
                                         fontFamily={u.mapFont}
                                         style={{ textShadow: '0 0.5px 1px rgba(0,0,0,0.8)', pointerEvents: 'none' }}
                                      >
                                         {statusTextMap[u.status]}
                                      </text>
                                   </g>
                                ))}
                                {isDrawing && tempPoints.length > 0 && (
                                   <>
                                      <polyline points={pointsToString([...tempPoints, mousePos || tempPoints[tempPoints.length-1]])} fill="none" stroke="blue" strokeWidth="0.5" strokeDasharray="1,1" />
                                      {tempPoints.map((p, idx) => <circle key={idx} cx={p.x} cy={p.y} r="0.8" fill="blue" />)}
                                      <circle cx={tempPoints[0].x} cy={tempPoints[0].y} r="3" fill="transparent" stroke={mousePos && Math.sqrt(Math.pow(mousePos.x-tempPoints[0].x,2)+Math.pow(mousePos.y-tempPoints[0].y,2)) < 3 ? "green" : "transparent"} strokeWidth="0.5" />
                                   </>
                                )}
                             </svg>
                          </div>
                          {isDrawing && <div className="absolute top-2 right-2 bg-black/70 text-white px-3 py-1.5 text-xs rounded-full animate-pulse shadow-lg z-20">正在繪製：{units.find(u=>u.id===currentUnitId)?.number} (點擊起點閉合)</div>}
                       </div>
                     )}
                  </section>

                  {/* 戶別銷控表 (大改版：卡片式) */}
                  <section className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200">
                    <div className="flex justify-between items-center mb-6"><h3 className="font-black text-lg border-l-4 border-orange-500 pl-3">戶別銷控表 (Unit List)</h3><button onClick={()=>setUnits([...units, {id: Date.now(), number:'', mapLabel:'', mapColor:'#ea580c', mapFontSize:12, mapFont:'sans-serif', mapTextAlign:'middle', mapTextColor:'#ffffff', ping:'', price:'', status:'available', layout:'', mapPoints: null}])} className="bg-orange-50 text-orange-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-orange-100 transition flex items-center gap-1"><Plus size={14}/> 新增戶別</button></div>
                    <div className="grid grid-cols-1 gap-4">
                       {units.map((u, i) => (
                          <div key={i} className={`p-6 border rounded-xl transition shadow-sm bg-white hover:border-orange-300 group`}>
                             {/* 第一行：基本資訊 */}
                             <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 pb-4 border-b border-slate-100">
                                <div><label className="text-[10px] text-slate-400 font-bold block uppercase mb-1">戶號</label><input value={u.number} onChange={e=>{const x=[...units];x[i].number=e.target.value;setUnits(x)}} className="w-full bg-slate-50 border rounded p-2 text-sm font-bold text-center" placeholder="A1"/></div>
                                <div><label className="text-[10px] text-slate-400 font-bold block uppercase mb-1">坪數</label><input value={u.ping} onChange={e=>{const x=[...units];x[i].ping=e.target.value;setUnits(x)}} className="w-full border-b border-slate-200 p-2 text-sm focus:outline-none focus:border-orange-500" placeholder="0"/></div>
                                <div><label className="text-[10px] text-slate-400 font-bold block uppercase mb-1">價格</label><input value={u.price} onChange={e=>{const x=[...units];x[i].price=e.target.value;setUnits(x)}} className="w-full border-b border-slate-200 p-2 text-sm focus:outline-none focus:border-orange-500" placeholder="價格"/></div>
                                <div><label className="text-[10px] text-slate-400 font-bold block uppercase mb-1">狀態</label><select value={u.status} onChange={e=>{const x=[...units];x[i].status=e.target.value;setUnits(x)}} className="w-full bg-white border border-slate-200 rounded p-2 text-sm"><option value="available">🟢 可銷售</option><option value="reserved">🟡 已預訂</option><option value="sold">🔴 已售出</option></select></div>
                             </div>
                             
                             {/* 第二行：地圖樣式設定 (更寬敞的空間) */}
                             <div className="bg-slate-50 p-4 rounded-lg flex flex-wrap items-center gap-4">
                                <div>
                                   <label className="text-[10px] text-slate-400 font-bold block uppercase mb-1">底色</label>
                                   <input type="color" value={u.mapColor || '#ea580c'} onChange={e=>{const x=[...units];x[i].mapColor=e.target.value;setUnits(x)}} className="w-8 h-8 rounded cursor-pointer border-none"/>
                                </div>
                                <div>
                                   <label className="text-[10px] text-slate-400 font-bold block uppercase mb-1">字色</label>
                                   <input type="color" value={u.mapTextColor || '#ffffff'} onChange={e=>{const x=[...units];x[i].mapTextColor=e.target.value;setUnits(x)}} className="w-8 h-8 rounded cursor-pointer border-none"/>
                                </div>
                                <div>
                                   <label className="text-[10px] text-slate-400 font-bold block uppercase mb-1">字體</label>
                                   <select value={u.mapFont || 'sans-serif'} onChange={e=>{const x=[...units];x[i].mapFont=e.target.value;setUnits(x)}} className="text-xs bg-white border border-slate-200 rounded p-1.5 w-24 truncate">{fontOptions.map(f=><option key={f.value} value={f.value}>{f.label}</option>)}</select>
                                </div>
                                <div>
                                   <label className="text-[10px] text-slate-400 font-bold block uppercase mb-1">大小</label>
                                   <input type="number" value={u.mapFontSize || 12} onChange={e=>{const x=[...units];x[i].mapFontSize=Number(e.target.value);setUnits(x)}} className="w-12 border border-slate-200 rounded p-1 text-xs text-center"/>
                                </div>
                                <div>
                                   <label className="text-[10px] text-slate-400 font-bold block uppercase mb-1">對齊</label>
                                   <div className="flex bg-white rounded border border-slate-200">
                                      <button onClick={()=>setUnits(prev=>{const x=[...prev];x[i].mapTextAlign='start';return x})} className={`p-1.5 rounded-l ${u.mapTextAlign==='start'?'bg-slate-200':''}`}><AlignLeft size={14}/></button>
                                      <button onClick={()=>setUnits(prev=>{const x=[...prev];x[i].mapTextAlign='middle';return x})} className={`p-1.5 ${u.mapTextAlign==='middle'?'bg-slate-200':''}`}><AlignCenter size={14}/></button>
                                      <button onClick={()=>setUnits(prev=>{const x=[...prev];x[i].mapTextAlign='end';return x})} className={`p-1.5 rounded-r ${u.mapTextAlign==='end'?'bg-slate-200':''}`}><AlignRight size={14}/></button>
                                   </div>
                                </div>
                             </div>

                             {/* 第三行：操作按鈕 */}
                             <div className="flex justify-end items-center gap-3 mt-4 pt-2 border-t border-slate-100">
                                <button onClick={() => handleDuplicateUnit(u)} className="text-xs px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1 font-bold text-slate-600"><Copy size={14}/> 複製</button>
                                <button onClick={() => { setIsDrawing(true); setCurrentUnitId(u.id); setTempPoints([]); }} className={`text-xs px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition ${u.mapPoints ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-slate-800 text-white hover:bg-black'}`}>
                                   <Crop size={14}/> {u.mapPoints ? '重繪區域' : '開始繪製'}
                                </button>
                                <label className="cursor-pointer text-xs text-slate-500 hover:text-blue-500 font-bold px-2 flex items-center gap-1"><Upload size={14}/> {u.layout ? "更換圖檔" : "上傳平面圖"}<input type="file" className="hidden" onChange={e=>handleUpload(e, (url)=>{const x=[...units];x[i].layout=url;setUnits(x)})}/></label>
                                <button onClick={()=>setUnits(units.filter((_,idx)=>idx!==i))} className="text-slate-300 hover:text-red-500 p-2"><Trash2 size={16}/></button>
                             </div>
                          </div>
                       ))}
                    </div>
                  </section>
                  
                  {/* ...其他區塊 (保持不變)... */}
                  <section className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200"><div className="flex justify-between mb-6"><h3 className="font-black text-lg border-l-4 border-orange-500 pl-3">規格 & 特色</h3><div className="flex gap-2"><button onClick={()=>setSpecs([...specs, {id: Date.now(), label:'', value:''}])} className="text-xs bg-slate-100 px-3 py-1 rounded hover:bg-slate-200 font-bold">+ 增加規格</button><button onClick={()=>setFeatures([...features, {id: Date.now(), title:'', desc:''}])} className="text-xs bg-slate-100 px-3 py-1 rounded hover:bg-slate-200 font-bold">+ 增加特色</button></div></div><div className="grid grid-cols-1 md:grid-cols-2 gap-8"><div className="space-y-3"><h4 className="text-xs font-bold text-slate-400 uppercase mb-2">物件規格 (Specs)</h4>{specs.map((s,i)=>(<div key={i} className="flex gap-2"><input value={s.label} onChange={e=>{const x=[...specs];x[i].label=e.target.value;setSpecs(x)}} className="border rounded p-2 w-1/3 text-sm" placeholder="項目 (如: 面寬)"/><input value={s.value} onChange={e=>{const x=[...specs];x[i].value=e.target.value;setSpecs(x)}} className="border rounded p-2 w-full text-sm" placeholder="內容"/><button onClick={()=>setSpecs(specs.filter((_,idx)=>idx!==i))} className="text-slate-300 hover:text-red-500"><X size={16}/></button></div>))}</div><div className="space-y-3"><h4 className="text-xs font-bold text-slate-400 uppercase mb-2">核心特色 (Features)</h4>{features.map((f,i)=>(<div key={i} className="flex gap-2"><input value={f.title} onChange={e=>{const x=[...features];x[i].title=e.target.value;setFeatures(x)}} className="border rounded p-2 w-1/3 text-sm" placeholder="標題"/><input value={f.desc} onChange={e=>{const x=[...features];x[i].desc=e.target.value;setFeatures(x)}} className="border rounded p-2 w-full text-sm" placeholder="描述"/><button onClick={()=>setFeatures(features.filter((_,idx)=>idx!==i))} className="text-slate-300 hover:text-red-500"><X size={16}/></button></div>))}</div></div></section>
                  <section className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200"><div className="flex justify-between mb-4"><h3 className="font-black text-lg border-l-4 border-orange-500 pl-3">周遭環境 (新聞)</h3><button onClick={()=>setEnvList([...envList, {id: Date.now(), title:"", desc:"", image:"", link:""}])} className="text-orange-500 text-xs font-bold">+ 新增</button></div>{envList.map((env, i) => (<div key={i} className="bg-slate-50 p-4 border border-slate-100 rounded-xl mb-3 space-y-2"><input value={env.title} onChange={e=>{const x=[...envList];x[i].title=e.target.value;setEnvList(x)}} className={inputStyle} placeholder="新聞標題"/><textarea value={env.desc} onChange={e=>{const x=[...envList];x[i].desc=e.target.value;setEnvList(x)}} className={inputStyle} placeholder="簡述"/><input value={env.link} onChange={e=>{const x=[...envList];x[i].link=e.target.value;setEnvList(x)}} className={inputStyle} placeholder="連結網址"/></div>))}</section>
                  <section className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200"><div className="flex justify-between mb-4"><h3 className="font-black text-lg border-l-4 border-orange-500 pl-3">工程進度</h3><button onClick={()=>setProgressList([...progressList, {id: Date.now(), date:'', status:''}])} className="text-orange-500 text-xs font-bold">+ 新增</button></div>{progressList.map((p, i) => (<div key={i} className="flex gap-2 mb-2"><input type="date" value={p.date} onChange={e=>{const x=[...progressList];x[i].date=e.target.value;setProgressList(x)}} className="border rounded p-2 text-sm"/><input value={p.status} onChange={e=>{const x=[...progressList];x[i].status=e.target.value;setProgressList(x)}} className="border rounded p-2 w-full text-sm" placeholder="進度描述"/><button onClick={()=>setProgressList(progressList.filter((_,idx)=>idx!==i))}><Trash2 size={16} className="text-slate-300 hover:text-red-500"/></button></div>))}</section>
                </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Admin;