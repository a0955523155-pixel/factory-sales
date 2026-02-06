import React, { useState, useEffect, useRef, useMemo } from 'react';
import { db } from '../firebase';
import { collection, addDoc, getDocs, doc, updateDoc, setDoc, getDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { 
  X, Plus, Trash2, Layout, Users, Settings, Map as MapIcon, Upload, Languages, FileText, Sparkles, 
  LogIn, LogOut, GripVertical, ChevronUp, ChevronDown, RefreshCcw, Copy, Zap, FolderOpen, Folder, 
  Star, Award, History, Search, Train, Factory, MapPin, Globe, Image as ImageIcon, MessageSquare, Building, Calendar as CalendarIcon, UserCheck, ChevronLeft, ChevronRight, Wand2
} from 'lucide-react';

const TEAM_MEMBERS = ["余珮婷", "侯彥旭", "李晙揚", "蘇昱誠"];

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
        const maxWidth = 1000; // 優化：限制最大寬度
        if (width > maxWidth) { height = (height * maxWidth) / width; width = maxWidth; }
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const fontSize = width * 0.03;
        ctx.font = `bold ${fontSize}px Arial`;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.textAlign = 'right';
        ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
        ctx.shadowBlur = 2;
        ctx.fillText(watermarkText, width - 15, height - 15);
        resolve(canvas.toDataURL('image/webp', 0.7)); // 優化：使用 WebP
      };
    };
  });
};

// --- AI 核心邏輯 ---
const AI_ENGINE = {
  pick: (arr) => arr[Math.floor(Math.random() * arr.length)],
  generateTitles: (baseTopic, category) => {
    if (category === 'academy') return [`【房產小學堂】${baseTopic} 是什麼？`, `買房必看！${baseTopic} 注意事項`, `新手誤區！關於 ${baseTopic}，你可能想錯了`, `【專家解惑】${baseTopic} 常見問題`, `政策解讀：${baseTopic} 對購屋族的影響`];
    if (category === 'news_project') return [`【熱銷捷報】${baseTopic} 詢問度破表`, `${baseTopic} 為什麼這麼紅？3大優勢`, `震撼登場！${baseTopic} 打造區域新地標`, `錯過不再！${baseTopic} 擁抱增值第一排`, `【賞屋直擊】${baseTopic} 實地走訪`];
    return [`【區域利多】${baseTopic} 建設啟動`, `交通大躍進！${baseTopic} 將帶動周邊發展`, `產業進駐！${baseTopic} 成為南台灣新亮點`, `未來展望：${baseTopic} 將如何改變城市風貌？`, `【市場快訊】${baseTopic} 拍板定案`];
  },
  generateContent: (title, category) => {
    if (category === 'academy') return `Q：關於「${title}」，很多客戶常問到的重點是什麼？\n\nA：這是一個非常好的問題。在目前的房地產市場中，${title} 確實是大家關注的焦點。\n\n【重點一：核心觀念】\n首先，我們要理解它的基本定義...\n\n【專家建議】\n我們建議您在決策前，務必諮詢專業人士。\n\n#房地產知識 #綠芽教學 #${title}`;
    if (category === 'news_project') return `【${title}】\n\n南台灣置產首選，眾所矚目的焦點個案！\n\n🌟 核心地段：位於交通樞紐，南來北往無往不利。\n🌟 強大機能：商圈環繞，食衣住行育樂一次滿足。\n🌟 增值潛力：受惠於產業園區效應，未來發展不可限量。\n\n📞 預約專線：0800-666-738`;
    return `【${title}】\n\n隨著政府積極推動大南方計畫，${title} 近期傳出重大進展，為區域房市注入一劑強心針。\n\n根據最新消息指出，該項建設預計將大幅改善周邊交通/產業環境，並帶動大量就業人口移入。專家分析，隨著基礎建設陸續到位，周邊房價將具備強勁的支撐力道。`;
  },
  generateImagePrompt: (title, category) => {
    let subject = "";
    let style = "高畫質，4k解析度，專業攝影，電影光影";
    if (category === 'academy') subject = "現代化的辦公室場景，桌上有文件、計算機、眼鏡，背景有模糊的房地產數據圖表，專業、知性";
    else if (category === 'news_project') subject = title.includes("廠房") ? "現代化科技廠房外觀，玻璃帷幕，藍天白雲" : "豪華現代住宅大樓外觀，黃金時段的陽光灑落";
    else subject = title.includes("捷運") ? "繁忙的現代化城市交通樞紐，捷運列車" : "大型公共建設工程現場，工程起重機，藍天";
    return `${subject}，${style}`;
  }
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
  
  // Drag refs
  const dragItem = useRef(); const dragOverItem = useRef();

  // About Data
  const [aboutData, setAboutData] = useState({
    title: "綠芽團隊", subtitle: "深耕南台灣，專注工業地產", content: "我們是一群對土地充滿熱情的專業團隊...", image: "",
    stats: [{ label: "在地深耕(年)", value: "10+" }, { label: "成交件數", value: "500+" }, { label: "服務客戶", value: "1000+" }]
  });

  // Schedule Data
  const [scheduleData, setScheduleData] = useState({});
  const [currentMonth, setCurrentMonth] = useState(new Date()); 
  const [autoBatch, setAutoBatch] = useState({ startDate: '', days: 30, startMemberIndex: 0 });

  // Property Data
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

  // Article Data
  const [articleForm, setArticleForm] = useState({ category: 'news_local', title: '', content: '', date: '', image: '' });
  const [editArticleId, setEditArticleId] = useState(null);
  const [aiTitleSuggestions, setAiTitleSuggestions] = useState([]);
  const [aiImagePrompt, setAiImagePrompt] = useState('');

  const [globalSettings, setGlobalSettings] = useState({ siteName: "Factory Pro", heroTitleCN: "未來工廠", heroTitleEN: "FUTURE FACTORY", contactPhone: "0800-666-738", fbLink: "", igLink: "", lineLink: "", iconFB: "", iconIG: "", iconLINE: "" });

  const historyData = useMemo(() => {
    const specLabels = new Set(); const featureTitles = new Set(); const progressStatuses = new Set();
    properties.forEach(p => {
      p.specs?.forEach(s => { if(s.label) specLabels.add(s.label); });
      p.features?.forEach(f => { if(f.title) featureTitles.add(f.title); });
      p.progressHistory?.forEach(pr => { if(pr.status) progressStatuses.add(pr.status); });
    });
    return { specs: Array.from(specLabels), features: Array.from(featureTitles), progress: Array.from(progressStatuses) };
  }, [properties]);

  useEffect(() => { const storedAuth = localStorage.getItem('isAuth'); if (storedAuth === 'true') { setIsAuth(true); fetchAll(); } }, []);
  const fetchAll = () => { fetchProperties(); fetchGlobalSettings(); fetchCustomers(); fetchArticles(); fetchAbout(); fetchSchedule(); };
  
  const handleLogin = (e) => { e.preventDefault(); if (loginForm.user === 'gst0800666738' && loginForm.pass === '0800666738') { setIsAuth(true); localStorage.setItem('isAuth', 'true'); fetchAll(); } else { alert("帳號或密碼錯誤"); } };
  const handleLogout = () => { if (window.confirm("登出？")) { setIsAuth(false); localStorage.removeItem('isAuth'); navigate('/'); } };

  const fetchProperties = async () => { try { const snap = await getDocs(collection(db, "properties")); const list = []; snap.forEach((doc) => list.push({ id: doc.id, ...doc.data() })); setProperties(list); } catch (e) {} };
  const fetchArticles = async () => { try { const snap = await getDocs(collection(db, "articles")); const list = []; snap.forEach((doc) => list.push({ id: doc.id, ...doc.data() })); list.sort((a, b) => { if (a.order !== undefined && b.order !== undefined) return a.order - b.order; return (b.createdAt || 0) - (a.createdAt || 0); }); setArticles(list); } catch (e) {} };
  const fetchGlobalSettings = async () => { try { const docSnap = await getDoc(doc(db, "settings", "global")); if (docSnap.exists()) setGlobalSettings(docSnap.data()); } catch (e) {} };
  const fetchCustomers = async () => { try { const snap = await getDocs(collection(db, "customers")); const list = []; snap.forEach((doc) => list.push({ id: doc.id, ...doc.data() })); list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)); setCustomers(list); } catch (e) {} };
  const fetchAbout = async () => { try { const docSnap = await getDoc(doc(db, "settings", "about")); if (docSnap.exists()) setAboutData(docSnap.data()); } catch (e) {} };
  const fetchSchedule = async () => { try { const docSnap = await getDoc(doc(db, "settings", "schedule")); if (docSnap.exists()) setScheduleData(docSnap.data()); } catch (e) {} };

  // --- Schedule ---
  const handleBatchSchedule = async () => {
    if (!autoBatch.startDate) return alert("請選擇開始日期");
    if (autoBatch.days <= 0) return alert("天數必須大於 0");
    const newSchedule = { ...scheduleData };
    let currentDate = new Date(autoBatch.startDate);
    let memberIndex = parseInt(autoBatch.startMemberIndex);
    for (let i = 0; i < autoBatch.days; i++) {
        const dateStr = currentDate.toISOString().split('T')[0];
        newSchedule[dateStr] = TEAM_MEMBERS[memberIndex % TEAM_MEMBERS.length];
        currentDate.setDate(currentDate.getDate() + 1);
        memberIndex++;
    }
    setScheduleData(newSchedule);
    await setDoc(doc(db, "settings", "schedule"), newSchedule);
    alert(`已自動排班 ${autoBatch.days} 天！`);
  };
  const handleDayChange = async (dateStr, member) => {
    const newSchedule = { ...scheduleData, [dateStr]: member };
    setScheduleData(newSchedule);
    await setDoc(doc(db, "settings", "schedule"), newSchedule);
  };
  const changeMonth = (offset) => { const newDate = new Date(currentMonth); newDate.setMonth(newDate.getMonth() + offset); setCurrentMonth(newDate); };
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear(); const month = currentMonth.getMonth();
    const firstDayOfMonth = new Date(year, month, 1); const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startDay = firstDayOfMonth.getDay();
    const days = [];
    for (let i = 0; i < startDay; i++) { days.push(null); }
    for (let i = 1; i <= daysInMonth; i++) {
        const date = new Date(year, month, i);
        // Fix timezone issue by formatting manually
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        const localDateStr = `${y}-${m}-${d}`;
        days.push({ day: i, dateStr: localDateStr, member: scheduleData[localDateStr] || '' });
    }
    return days;
  };

  // --- Customer ---
  const handleAssignCustomer = async (customerId, member) => { if(!window.confirm(`確定指派給 ${member} 嗎？`)) return; await updateDoc(doc(db, "customers", customerId), { assignedTo: member }); fetchCustomers(); };
  const handleDeleteCustomer = async (customerId) => { if(!window.confirm("確定刪除此客戶資料？")) return; await deleteDoc(doc(db, "customers", customerId)); fetchCustomers(); };

  // --- General ---
  const loadEdit = (item) => {
    setEditId(item.id); const info = item.basicInfo || {};
    setFormData({
      title: safeStr(info.title), titleEN: safeStr(info.titleEN), subtitle: safeStr(info.subtitle), description: safeStr(info.description),
      price: safeStr(info.price), address: safeStr(info.address), city: safeStr(info.city) || '高雄', propertyType: safeStr(info.propertyType) || '工業地', usageType: safeStr(info.usageType) || '廠房', transactionType: safeStr(info.transactionType) || '出售',
      agentPhone: safeStr(info.agentPhone), agentName: safeStr(info.agentName), lineId: safeStr(info.lineId), lineQr: safeStr(info.lineQr), googleMapUrl: safeStr(info.googleMapUrl),
      thumb: safeStr(info.thumb), images: Array.isArray(info.images) ? info.images : [], showOnHome: info.showOnHome || false, isFeaturedWork: info.isFeaturedWork || false
    });
    setSpecs(Array.isArray(item.specs) ? item.specs : []); setFeatures(Array.isArray(item.features) ? item.features : []);
    setEnvList(item.environmentList || []); setProgressList(item.progressHistory || []); setUnits(item.units || []);
  };

  const loadEditArticle = (item) => { setEditArticleId(item.id); setArticleForm({ ...item }); setAiTitleSuggestions([]); setAiImagePrompt(''); };
  const handleUpload = async (e, callback) => { const file = e.target.files[0]; if (!file) return; setCompressing(true); try { const compressed = await compressImage(file); callback(compressed); } catch (e) {} setCompressing(false); };

  // --- 重點修復：resetForm 函式定義 ---
  const resetForm = () => {
    setEditId(null);
    setFormData({ title: '', titleEN: '', subtitle: '', description: '', price: '', address: '', city: '高雄', propertyType: '工業地', usageType: '廠房', transactionType: '出售', agentPhone: '', agentName: '', lineId: '', lineQr: '', googleMapUrl: '', thumb: '', images: [], showOnHome: false, isFeaturedWork: false });
    setSpecs([{ id: `s-${Date.now()}`, label: "使用分區", value: "乙種工業區" }]); setFeatures([{ id: `f-${Date.now()}`, title: "特色標題", desc: "" }]);
    setEnvList([{ id: `e-${Date.now()}`, title: "", desc: "", image: "", link: "" }]);
    setProgressList([{ id: `p-${Date.now()}`, date: "", status: "" }]); setUnits([{ id: `u-${Date.now()}`, number: '', ping: '', unitPrice: '', price: '', status: 'available', layout: '' }]);
  };

  const handleSubmit = async (e) => { e.preventDefault(); setLoading(true); const payload = { basicInfo: formData, specs, features, environmentList: envList, progressHistory: progressList, units, images: formData.images, updatedAt: new Date() }; if (editId) await updateDoc(doc(db, "properties", editId), payload); else await addDoc(collection(db, "properties"), payload); alert("儲存成功！"); window.location.reload(); setLoading(false); };
  const handleArticleSubmit = async (e) => { e.preventDefault(); setLoading(true); const payload = { ...articleForm, createdAt: Date.now(), updatedAt: new Date(), order: -Date.now() }; if (editArticleId) { delete payload.order; await updateDoc(doc(db, "articles", editArticleId), payload); } else { await addDoc(collection(db, "articles"), payload); } alert("發布成功！"); setArticleForm({ category: 'news_local', title: '', content: '', date: '', image: '' }); setEditArticleId(null); fetchArticles(); setLoading(false); };
  const handleAboutSubmit = async () => { setLoading(true); await setDoc(doc(db, "settings", "about"), aboutData); alert("關於我們已更新！"); setLoading(false); };

  const handleTranslate = async () => { if (!formData.title) return alert("請先輸入中文"); setTranslating(true); try { const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(formData.title)}&langpair=zh-TW|en`); const data = await response.json(); if (data.responseData.translatedText) setFormData(prev => ({ ...prev, titleEN: data.responseData.translatedText })); } catch (error) {} setTranslating(false); };
  const handleAIWrite = () => { if (!articleForm.title) return alert("請輸入標題"); const templates = [`【${articleForm.title}】\n\n隨著產業需求增長...`]; setArticleForm(prev => ({ ...prev, content: templates[0] })); };
  const handleSaveSettings = async () => { setLoading(true); await setDoc(doc(db, "settings", "global"), globalSettings); alert("已更新"); window.location.reload(); setLoading(false); };
  const handleDeleteProperty = async (e, id) => { e.stopPropagation(); if (!window.confirm("刪除？")) return; await deleteDoc(doc(db, "properties", id)); fetchProperties(); };
  const handleDeleteArticle = async (id) => { if (!window.confirm("刪除？")) return; await deleteDoc(doc(db, "articles", id)); fetchArticles(); };
  
  const handleGenerateTitles = () => { setAiTitleSuggestions(AI_ENGINE.generateTitles(articleForm.title || "房地產", articleForm.category)); };
  const handleGenerateContent = () => { if (!articleForm.title) return alert("請先輸入標題"); setArticleForm(prev => ({ ...prev, content: AI_ENGINE.generateContent(articleForm.title, articleForm.category) })); };
  const handleGenerateImagePrompt = () => { if (!articleForm.title) return alert("請先輸入標題"); setAiImagePrompt(AI_ENGINE.generateImagePrompt(articleForm.title, articleForm.category)); };
  
  const handleArticleMaterialSearch = () => {
    const title = articleForm.title || "房地產";
    let query = articleForm.category === 'academy' ? `${title} 法規 懶人包 稅制 解釋函令` : articleForm.category === 'news_project' ? `${title} 接待中心 示意圖 房價` : `${title} 建設 完工示意圖 重劃區`;
    window.open(`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(query)}`, '_blank');
    window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, '_blank');
  };

  const handleSmartNewsSearch = (type) => { 
    const city = formData.city.replace('市', '').replace('縣', ''); 
    const keywords = type === 'traffic' ? `${city} 交通建設` : type === 'industry' ? `${city} 產業園區` : `${city} 重劃區`;
    window.open(`https://www.google.com/search?tbm=nws&q=${encodeURIComponent(keywords)}`, '_blank');
  };
  const handleSmartNewsGenerate = () => { setEnvList([...envList, { id: Date.now(), title: `${formData.city}利多`, desc: "AI 生成中...", image: "", link: "" }]); };

  const calculateTotalPrice = (ping, unitPrice) => { const p = parseFloat(ping); const u = parseFloat(unitPrice); return (!isNaN(p) && !isNaN(u)) ? `${(p * u).toFixed(0)} 萬` : ''; };
  const handleUnitChange = (id, field, value) => { setUnits(prev => prev.map(u => { if (u.id !== id) return u; const newUnit = { ...u, [field]: value }; if (field === 'ping' || field === 'unitPrice') { newUnit.price = calculateTotalPrice(newUnit.ping, newUnit.unitPrice); } return newUnit; })); };
  const handleDuplicateUnit = (unit) => { setUnits([{ ...unit, id: Date.now(), number: `${unit.number} (複製)`, layout: '' }, ...units]); };
  const handleAddUnit = () => { setUnits([{ id: Date.now(), number: '', ping: '', unitPrice: '', price: '', status: 'available', layout: '' }, ...units]); };
  const applyBatchPrice = (onlyEmpty = false) => { if (!batchUnitPrice) return alert("請先輸入統一單價"); if (!window.confirm(onlyEmpty ? "確定要將單價填入所有「未填寫單價」的欄位嗎？" : "確定要將「所有戶別」的單價都改成這個數值嗎？")) return; setUnits(units.map(u => { if (onlyEmpty && u.unitPrice) return u; const newPrice = calculateTotalPrice(u.ping, batchUnitPrice); return { ...u, unitPrice: batchUnitPrice, price: newPrice }; })); alert("已完成批次更新！"); };
  const groupedUnits = useMemo(() => { const groups = {}; units.forEach(u => { const zone = u.number ? u.number.charAt(0).toUpperCase() : '未分類'; const zoneKey = /^[A-Z]$/.test(zone) ? zone : '其他'; if (!groups[zoneKey]) groups[zoneKey] = []; groups[zoneKey].push(u); }); return Object.keys(groups).sort().reduce((obj, key) => { obj[key] = groups[key]; return obj; }, {}); }, [units]);
  const toggleZone = (zone) => { setCollapsedZones(prev => ({ ...prev, [zone]: !prev[zone] })); };
  
  const moveArticle = async (index, direction) => { const newItems = [...articles]; if (direction === 'up' && index > 0) { [newItems[index], newItems[index - 1]] = [newItems[index - 1], newItems[index]]; } else if (direction === 'down' && index < newItems.length - 1) { [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]]; } else { return; } setArticles(newItems); saveOrder(newItems); };
  const saveOrder = async (items) => { try { const batch = writeBatch(db); items.forEach((item, index) => { const ref = doc(db, "articles", item.id); batch.update(ref, { order: index }); }); await batch.commit(); } catch (e) {} };
  const resetOrderToDate = async () => { if (!window.confirm("重排？")) return; const sorted = [...articles].sort((a, b) => new Date(b.date) - new Date(a.date)); setArticles(sorted); saveOrder(sorted); };
  const handleDragStart = (e, position) => { dragItem.current = position; };
  const handleDragEnter = (e, position) => { dragOverItem.current = position; };
  const handleDragEnd = async () => { const copyListItems = [...articles]; const dragItemContent = copyListItems[dragItem.current]; copyListItems.splice(dragItem.current, 1); copyListItems.splice(dragOverItem.current, 0, dragItemContent); dragItem.current = null; dragOverItem.current = null; setArticles(copyListItems); saveOrder(copyListItems); };

  const inputStyle = "w-full bg-white border border-slate-300 text-slate-800 p-3 md:p-2.5 text-base md:text-sm focus:outline-none focus:border-orange-500 rounded-lg shadow-sm transition placeholder:text-slate-300";
  const labelStyle = "block text-xs font-bold text-slate-500 mb-1.5 tracking-wider uppercase";
  const propertyTypes = ['工業地', '農地', '建地'];
  const usageTypes = { '工業地': ['廠房', '工業地'], '農地': ['農地廠房', '農地'], '建地': ['建地廠房', '透天', '套房'] };

  if (!isAuth) return ( <div className="h-screen flex items-center justify-center bg-slate-100 px-4"><form onSubmit={handleLogin} className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm border border-slate-200"><div className="text-center mb-8"><div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 text-white"><LogIn size={32}/></div><h1 className="text-2xl font-black text-slate-900">綠芽管理員登入</h1></div><div className="space-y-4"><input type="text" placeholder="帳號" value={loginForm.user} onChange={e=>setLoginForm({...loginForm, user:e.target.value})} className="w-full p-3 border rounded-xl bg-slate-50 focus:border-orange-500 outline-none" autoComplete="username" /><input type="password" placeholder="密碼" value={loginForm.pass} onChange={e=>setLoginForm({...loginForm, pass:e.target.value})} className="w-full p-3 border rounded-xl bg-slate-50 focus:border-orange-500 outline-none" autoComplete="current-password" /><button type="submit" className="w-full bg-orange-600 text-white py-3 rounded-xl font-bold hover:bg-orange-700 transition shadow-lg">登入系統</button></div></form></div> );

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-slate-100 text-slate-800 font-sans overflow-hidden">
      <div className="w-full lg:w-64 bg-white border-b lg:border-b-0 lg:border-r border-slate-200 flex flex-col shrink-0">
        <div className="p-4 md:p-5 flex justify-between items-center lg:block"><h2 className="font-black text-xl text-slate-900 tracking-tight">綠芽管理員</h2><button onClick={handleLogout} className="lg:hidden text-slate-400 hover:text-red-500"><LogOut size={20}/></button></div>
        <div className="flex lg:flex-col gap-2 p-2 overflow-x-auto lg:overflow-visible scrollbar-hide">
            <button onClick={() => setViewMode('properties')} className={`flex-shrink-0 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition whitespace-nowrap ${viewMode === 'properties' ? 'bg-orange-50 text-orange-600' : 'text-slate-500 hover:bg-slate-50'}`}><Layout size={18}/> 案場</button>
            <button onClick={() => setViewMode('articles')} className={`flex-shrink-0 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition whitespace-nowrap ${viewMode === 'articles' ? 'bg-orange-50 text-orange-600' : 'text-slate-500 hover:bg-slate-50'}`}><FileText size={18}/> 文章</button>
            <button onClick={() => setViewMode('customers')} className={`flex-shrink-0 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition whitespace-nowrap ${viewMode === 'customers' ? 'bg-orange-50 text-orange-600' : 'text-slate-500 hover:bg-slate-50'}`}><Users size={18}/> 客戶</button>
            <button onClick={() => setViewMode('schedule')} className={`flex-shrink-0 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition whitespace-nowrap ${viewMode === 'schedule' ? 'bg-orange-50 text-orange-600' : 'text-slate-500 hover:bg-slate-50'}`}><CalendarIcon size={18}/> 排班</button>
            <button onClick={() => setViewMode('about')} className={`flex-shrink-0 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition whitespace-nowrap ${viewMode === 'about' ? 'bg-orange-50 text-orange-600' : 'text-slate-500 hover:bg-slate-50'}`}><Building size={18}/> 關於</button>
            <button onClick={() => setViewMode('settings')} className={`flex-shrink-0 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition whitespace-nowrap ${viewMode === 'settings' ? 'bg-orange-50 text-orange-600' : 'text-slate-500 hover:bg-slate-50'}`}><Settings size={18}/> 設定</button>
        </div>
        <div className="mt-auto p-4 hidden lg:block border-t border-slate-100"><button onClick={handleLogout} className="flex items-center gap-2 text-slate-400 hover:text-red-500 text-sm font-bold transition w-full px-4 py-2 hover:bg-red-50 rounded-xl"><LogOut size={18}/> 登出系統</button></div>
        
        {viewMode === 'properties' && (<div className="flex-1 overflow-y-auto p-3 space-y-2 border-t lg:border-t-0 border-slate-100 hidden lg:block"><button onClick={resetForm} className="w-full py-2 bg-orange-500 text-white rounded-lg font-bold text-sm hover:bg-orange-600 mb-4 shadow">+ 新增案場</button>{properties.map(p => (<div key={p.id} onClick={() => loadEdit(p)} className={`p-3 border cursor-pointer hover:bg-white rounded-xl flex justify-between items-center group transition ${editId === p.id ? 'border-orange-500 bg-white shadow-md' : 'border-slate-100 bg-slate-50'}`}><div className="font-bold text-sm truncate w-32 text-slate-700">{p.basicInfo.title}</div><div className="flex items-center gap-1">{p.basicInfo.showOnHome && <Star size={12} className="text-orange-500 fill-orange-500"/>}{p.basicInfo.isFeaturedWork && <Award size={12} className="text-blue-500 fill-blue-500"/>}<button onClick={(e) => handleDeleteProperty(e, p.id)} className="text-slate-300 hover:text-red-500 p-1"><Trash2 size={14} /></button></div></div>))}</div>)}
      </div>

      <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden">
        
        {/* --- 排班管理 (月曆 + 批量) --- */}
        {viewMode === 'schedule' && (
            <div className="p-6 md:p-10 max-w-5xl mx-auto w-full overflow-y-auto">
               <h1 className="text-2xl md:text-3xl font-black mb-8">排班管理系統</h1>
               
               {/* 批量工具區 */}
               <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-8">
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-slate-800"><Wand2 size={20} className="text-purple-600"/> 一鍵智慧排班</h3>
                  <div className="flex flex-wrap items-end gap-4">
                     <div><label className={labelStyle}>開始日期</label><input type="date" value={autoBatch.startDate} onChange={e=>setAutoBatch({...autoBatch, startDate: e.target.value})} className={inputStyle} /></div>
                     <div><label className={labelStyle}>排班天數</label><input type="number" value={autoBatch.days} onChange={e=>setAutoBatch({...autoBatch, days: parseInt(e.target.value)})} className={inputStyle} /></div>
                     <div><label className={labelStyle}>起始人員</label><select value={autoBatch.startMemberIndex} onChange={e=>setAutoBatch({...autoBatch, startMemberIndex: e.target.value})} className={inputStyle}>{TEAM_MEMBERS.map((m, i)=><option key={m} value={i}>{m}</option>)}</select></div>
                     <button onClick={handleBatchSchedule} className="bg-purple-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-purple-700 whitespace-nowrap shadow-md">生成班表</button>
                  </div>
                  <p className="text-xs text-slate-400 mt-2">* 系統將依序自動輪排：{TEAM_MEMBERS.join(" → ")}</p>
               </div>

               {/* 月曆檢視區 */}
               <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="flex justify-between items-center p-4 bg-slate-50 border-b border-slate-200">
                     <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-white rounded-full transition"><ChevronLeft/></button>
                     <h2 className="text-xl font-black text-slate-800">{currentMonth.getFullYear()} 年 {currentMonth.getMonth() + 1} 月</h2>
                     <button onClick={() => changeMonth(1)} className="p-2 hover:bg-white rounded-full transition"><ChevronRight/></button>
                  </div>
                  <div className="grid grid-cols-7 text-center bg-slate-100 text-xs font-bold text-slate-500 py-2">
                     <div>週日</div><div>週一</div><div>週二</div><div>週三</div><div>週四</div><div>週五</div><div>週六</div>
                  </div>
                  <div className="grid grid-cols-7 border-b border-slate-100">
                     {generateCalendarDays().map((d, i) => (
                        <div key={i} className={`min-h-[100px] border-r border-b border-slate-100 p-2 relative group ${!d ? 'bg-slate-50/50' : 'bg-white hover:bg-orange-50/30'}`}>
                           {d && (
                              <>
                                 <span className={`text-sm font-bold ${new Date().toISOString().split('T')[0] === d.dateStr ? 'bg-orange-600 text-white px-2 py-0.5 rounded-full' : 'text-slate-400'}`}>{d.day}</span>
                                 <div className="mt-2">
                                    <select 
                                       value={d.member || ""} 
                                       onChange={(e) => handleDayChange(d.dateStr, e.target.value)} 
                                       className={`w-full text-center font-bold bg-transparent cursor-pointer outline-none appearance-none p-1 rounded hover:bg-white/50 ${d.member ? 'text-slate-800' : 'text-slate-300'}`}
                                    >
                                       <option value="">(空)</option>
                                       {TEAM_MEMBERS.map(m => <option key={m} value={m}>{m}</option>)}
                                    </select>
                                    {!d.member && <div className="text-[10px] text-red-300 text-center mt-1">未排班</div>}
                                 </div>
                              </>
                           )}
                        </div>
                     ))}
                  </div>
               </div>
            </div>
        )}

        {/* --- 客戶管理 --- */}
        {viewMode === 'customers' && (
            <div className="p-6 md:p-10 w-full max-w-7xl mx-auto overflow-y-auto">
               <h1 className="text-2xl md:text-3xl font-black mb-8">客戶諮詢資料表</h1>
               <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden overflow-x-auto">
                  <table className="w-full text-sm text-left min-w-[800px]">
                     <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs border-b border-slate-200"><tr><th className="p-5">日期</th><th className="p-5">姓名</th><th className="p-5">電話</th><th className="p-5">需求</th><th className="p-5">負責人員</th><th className="p-5 text-right">操作</th></tr></thead>
                     <tbody>{customers.map(c => (
                        <tr key={c.id} className="border-b border-slate-100 hover:bg-orange-50/50 transition">
                           <td className="p-5 font-mono text-slate-400">{new Date(c.createdAt?.seconds * 1000).toLocaleDateString()}</td>
                           <td className="p-5 font-bold text-slate-800">{c.name}</td>
                           <td className="p-5 text-orange-600 font-bold">{c.phone}</td>
                           <td className="p-5"><span className="bg-slate-100 px-2 py-1 rounded text-xs font-bold text-slate-600">{c.needs}</span></td>
                           <td className="p-5">
                              <select value={c.assignedTo || '未指派'} onChange={(e)=>handleAssignCustomer(c.id, e.target.value)} className={`bg-transparent font-bold cursor-pointer outline-none ${c.assignedTo ? 'text-blue-600' : 'text-slate-400'}`}>
                                 <option value="未指派">未指派</option>
                                 {TEAM_MEMBERS.map(m=><option key={m} value={m}>{m}</option>)}
                              </select>
                           </td>
                           <td className="p-5 text-right"><button onClick={()=>handleDeleteCustomer(c.id)} className="text-slate-300 hover:text-red-500 p-2"><Trash2 size={16}/></button></td>
                        </tr>
                     ))}</tbody>
                  </table>
               </div>
            </div>
        )}

        {viewMode === 'about' && (
            <div className="p-6 md:p-10 max-w-4xl mx-auto w-full overflow-y-auto">
                <h1 className="text-2xl md:text-3xl font-black mb-8">關於我們頁面設定</h1>
                <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 space-y-6">
                    <div><label className={labelStyle}>頁面主標題</label><input value={aboutData.title} onChange={e=>setAboutData({...aboutData, title: e.target.value})} className={inputStyle} /></div>
                    <div><label className={labelStyle}>頁面副標題</label><input value={aboutData.subtitle} onChange={e=>setAboutData({...aboutData, subtitle: e.target.value})} className={inputStyle} /></div>
                    <div><label className={labelStyle}>品牌故事 (詳細介紹)</label><textarea value={aboutData.content} onChange={e=>setAboutData({...aboutData, content: e.target.value})} className={`${inputStyle} h-48`} /></div>
                    <div>
                        <label className={labelStyle}>形象圖片</label>
                        <div className="flex items-center gap-4">
                            <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 px-4 py-3 rounded-lg flex items-center gap-2 text-sm font-bold text-slate-600 transition"><Upload size={16}/> 上傳圖片 <input type="file" className="hidden" onChange={e=>handleUpload(e, (url)=>setAboutData({...aboutData, image: url}))}/></label>
                            {aboutData.image && <img src={aboutData.image} className="h-24 w-40 object-cover rounded-lg border border-slate-200 shadow-sm"/>}
                        </div>
                    </div>
                    <div className="border-t border-slate-100 pt-6">
                        <h3 className="font-bold mb-4">公司關鍵數據</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {aboutData.stats.map((stat, i) => (
                                <div key={i} className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                    <input value={stat.label} onChange={e=>{const s=[...aboutData.stats]; s[i].label=e.target.value; setAboutData({...aboutData, stats:s})}} className="w-full bg-transparent text-xs font-bold text-slate-500 mb-1 border-b border-transparent focus:border-orange-500 outline-none" placeholder="標籤"/>
                                    <input value={stat.value} onChange={e=>{const s=[...aboutData.stats]; s[i].value=e.target.value; setAboutData({...aboutData, stats:s})}} className="w-full bg-transparent text-xl font-black text-slate-800 border-b border-transparent focus:border-orange-500 outline-none" placeholder="數值"/>
                                </div>
                            ))}
                        </div>
                    </div>
                    <button onClick={handleAboutSubmit} disabled={loading} className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-orange-600 transition shadow-lg">{loading ? "儲存中..." : "儲存設定"}</button>
                </div>
            </div>
        )}

        {viewMode === 'settings' && (<div className="p-6 md:p-10 max-w-3xl mx-auto w-full overflow-y-auto"><h1 className="text-2xl md:text-3xl font-black mb-8">網站全域設定</h1><div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 space-y-6"><div><label className={labelStyle}>左上角網站名稱</label><input value={globalSettings.siteName} onChange={e=>setGlobalSettings({...globalSettings, siteName: e.target.value})} className={inputStyle} /></div><div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div><label className={labelStyle}>首頁大標題 (中文)</label><input value={globalSettings.heroTitleCN} onChange={e=>setGlobalSettings({...globalSettings, heroTitleCN: e.target.value})} className={inputStyle} /></div><div><label className={labelStyle}>首頁大標題 (英文)</label><input value={globalSettings.heroTitleEN} onChange={e=>setGlobalSettings({...globalSettings, heroTitleEN: e.target.value})} className={inputStyle} /></div></div><div><label className={labelStyle}>全站聯絡電話</label><input value={globalSettings.contactPhone} onChange={e=>setGlobalSettings({...globalSettings, contactPhone: e.target.value})} className={inputStyle} /></div><h3 className="font-black border-l-4 border-orange-500 pl-2 mt-4">社群連結</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label className={labelStyle}>FB 連結</label><input value={globalSettings.fbLink} onChange={e=>setGlobalSettings({...globalSettings, fbLink: e.target.value})} className={inputStyle} /></div><div><label className={labelStyle}>FB 圖示</label><input type="file" onChange={e=>handleUpload(e, (url)=>setGlobalSettings({...globalSettings, iconFB: url}))} className="text-xs"/>{globalSettings.iconFB && <img src={globalSettings.iconFB} className="h-8 w-8 rounded-full border"/>}</div><div><label className={labelStyle}>IG 連結</label><input value={globalSettings.igLink} onChange={e=>setGlobalSettings({...globalSettings, igLink: e.target.value})} className={inputStyle} /></div><div><label className={labelStyle}>IG 圖示</label><input type="file" onChange={e=>handleUpload(e, (url)=>setGlobalSettings({...globalSettings, iconIG: url}))} className="text-xs"/>{globalSettings.iconIG && <img src={globalSettings.iconIG} className="h-8 w-8 rounded-full border"/>}</div><div><label className={labelStyle}>LINE 連結</label><input value={globalSettings.lineLink} onChange={e=>setGlobalSettings({...globalSettings, lineLink: e.target.value})} className={inputStyle} /></div><div><label className={labelStyle}>LINE 圖示</label><input type="file" onChange={e=>handleUpload(e, (url)=>setGlobalSettings({...globalSettings, iconLINE: url}))} className="text-xs"/>{globalSettings.iconLINE && <img src={globalSettings.iconLINE} className="h-8 w-8 rounded-full border"/>}</div></div><button onClick={handleSaveSettings} disabled={loading} className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-orange-600 transition shadow-lg mt-4">{loading ? "處理中..." : "儲存設定"}</button></div></div>)}
        
        {viewMode === 'articles' && (
          <div className="flex flex-col md:flex-row h-full">
            <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-slate-200 bg-white p-4 overflow-y-auto shrink-0 max-h-[40vh] md:max-h-full">
              <button onClick={() => {setEditArticleId(null); setArticleForm({ category: 'news_local', title: '', content: '', date: '', image: '' });}} className="w-full bg-slate-900 text-white py-3 rounded-lg mb-4 text-sm font-bold shadow hover:bg-black transition">+ 撰寫新文章</button>
              <div className="space-y-2">
                <div className="flex justify-between items-center mb-2 px-1"><p className="text-xs text-slate-400">排序</p><button onClick={resetOrderToDate} className="text-[10px] flex items-center gap-1 text-blue-500 hover:underline"><RefreshCcw size={10}/> 重排</button></div>
                {articles.map((a, index) => (
                  <div key={a.id} draggable onDragStart={(e) => handleDragStart(e, index)} onDragEnter={(e) => handleDragEnter(e, index)} onDragEnd={handleDragEnd} onClick={()=>loadEditArticle(a)} className={`p-3 border mb-2 rounded-xl cursor-grab active:cursor-grabbing transition relative group flex items-center gap-3 ${editArticleId===a.id ? 'border-orange-500 bg-orange-50' : 'border-slate-100 hover:border-slate-300'}`}>
                    <div className="flex flex-col gap-1 md:hidden"><button onClick={(e) => { e.stopPropagation(); moveArticle(index, 'up'); }} className="p-1 bg-slate-100 rounded hover:bg-slate-200"><ChevronUp size={12}/></button><button onClick={(e) => { e.stopPropagation(); moveArticle(index, 'down'); }} className="p-1 bg-slate-100 rounded hover:bg-slate-200"><ChevronDown size={12}/></button></div><GripVertical size={16} className="text-slate-300 hidden md:block"/>
                    <div className="flex-1 min-w-0"><span className={`text-[10px] px-2 py-0.5 rounded-full text-white font-bold inline-block mb-1 ${a.category==='academy'?'bg-purple-500':a.category==='news_project'?'bg-green-500':'bg-blue-500'}`}>{a.category==='academy'?'小學堂':a.category==='news_project'?'建案':'新聞'}</span><div className="font-bold text-slate-800 line-clamp-1 text-sm">{a.title}</div></div>
                    <button onClick={(e) => {e.stopPropagation(); handleDeleteArticle(a.id);}} className="text-slate-300 hover:text-red-500"><Trash2 size={16}/></button>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex-1 p-6 md:p-10 overflow-y-auto bg-slate-50">
                <div className="max-w-3xl mx-auto">
                  <div className="flex justify-between items-center mb-8"><h2 className="text-2xl md:text-3xl font-black">{editArticleId ? '編輯文章' : '新增文章'}</h2><button onClick={handleArticleSubmit} disabled={loading} className="bg-orange-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-orange-500 shadow-lg transition text-sm">{loading ? "發布中..." : "確認發布"}</button></div>
                  <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className={labelStyle}>文章分類</label>
                            <select value={articleForm.category} onChange={e=>setArticleForm({...articleForm, category: e.target.value})} className={inputStyle}>
                                <option value="news_local">最新消息-地方新聞</option>
                                <option value="news_project">最新消息-建案新訊</option>
                                <option value="academy">房地產小學堂 (QA)</option>
                            </select>
                        </div>
                        <div><label className={labelStyle}>發布日期</label><input type="date" value={articleForm.date} onChange={e=>setArticleForm({...articleForm, date: e.target.value})} className={inputStyle}/></div>
                    </div>
                    
                    <div>
                      <label className={labelStyle}>文章標題</label>
                      <div className="flex gap-2">
                        <input value={articleForm.title} onChange={e=>setArticleForm({...articleForm, title: e.target.value})} className={inputStyle} placeholder="請輸入標題，或點擊右側魔法棒..."/>
                        <button onClick={handleGenerateTitles} className="bg-purple-600 text-white px-3 rounded-lg hover:bg-purple-700 transition flex items-center gap-1 shrink-0"><Sparkles size={16}/> 靈感</button>
                      </div>
                      {aiTitleSuggestions.length > 0 && (
                        <div className="mt-3 grid grid-cols-1 gap-2 bg-purple-50 p-3 rounded-xl border border-purple-100">
                          <span className="text-xs font-bold text-purple-800 flex items-center gap-1"><Sparkles size={12}/> AI 推薦標題 (點擊帶入)</span>
                          {aiTitleSuggestions.map((t, i) => (
                            <button key={i} onClick={() => { setArticleForm({...articleForm, title: t}); setAiTitleSuggestions([]); }} className="text-left text-sm text-slate-700 hover:text-purple-700 hover:bg-white p-2 rounded transition border border-transparent hover:border-purple-200">{t}</button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="relative"> 
                      <div className="flex justify-between items-center mb-1"> 
                        <label className={labelStyle}>文章內容</label> 
                        <div className="flex gap-2">
                          <button type="button" onClick={handleArticleMaterialSearch} className="text-xs bg-blue-50 text-blue-600 font-bold px-3 py-1 rounded flex items-center gap-1 hover:bg-blue-100"><Globe size={12}/> 找素材</button>
                          <button type="button" onClick={handleGenerateContent} className="text-xs bg-purple-50 text-purple-600 font-bold px-3 py-1 rounded flex items-center gap-1 hover:bg-purple-100"><MessageSquare size={12}/> 生成文案</button>
                        </div>
                      </div> 
                      <textarea value={articleForm.content} onChange={e=>setArticleForm({...articleForm, content: e.target.value})} className={`${inputStyle} h-64 leading-relaxed`} placeholder="輸入內容，或點擊 AI 自動撰寫..."/>
                    </div>

                    <div>
                      <label className={labelStyle}>封面圖片 (自動壓浮水印)</label>
                      <div className="mb-2 flex items-center gap-2">
                         <button onClick={handleGenerateImagePrompt} className="text-xs bg-green-50 text-green-700 font-bold px-3 py-1 rounded flex items-center gap-1 hover:bg-green-100 border border-green-200"><ImageIcon size={12}/> 生成中文詠唱詞 (Gemini/Midjourney)</button>
                      </div>
                      {aiImagePrompt && (
                        <div className="bg-slate-800 text-slate-300 p-3 rounded-lg text-xs font-mono mb-4 relative group">
                           {aiImagePrompt}
                           <button onClick={()=>{navigator.clipboard.writeText(aiImagePrompt); alert("已複製！");}} className="absolute top-2 right-2 bg-white/10 p-1.5 rounded hover:bg-white/20 text-white"><Copy size={12}/></button>
                        </div>
                      )}
                      <div className="flex items-center gap-4"><label className="cursor-pointer bg-slate-100 hover:bg-slate-200 px-4 py-3 rounded-lg flex items-center gap-2 text-sm font-bold text-slate-600 transition"><Upload size={16}/> 上傳圖片 <input type="file" className="hidden" onChange={e=>handleUpload(e, (url)=>setArticleForm({...articleForm, image: url}))}/></label>{articleForm.image && <img src={articleForm.image} className="h-20 w-32 object-cover rounded-lg border border-slate-200 shadow-sm"/>}</div>
                    </div>
                  </div>
                </div>
            </div>
          </div>
        )}
        
        {viewMode === 'properties' && (
          <>
            <div className="lg:hidden p-2 bg-white border-b overflow-x-auto flex gap-2"><button onClick={resetForm} className="bg-orange-500 text-white px-3 py-1.5 rounded-lg font-bold text-xs shrink-0">+ 新增</button>{properties.map(p => (<button key={p.id} onClick={() => loadEdit(p)} className={`px-3 py-1.5 rounded-lg border text-xs font-bold shrink-0 whitespace-nowrap ${editId === p.id ? 'bg-orange-50 border-orange-500 text-orange-600' : 'bg-slate-50 border-slate-200'}`}>{p.basicInfo.title.substring(0, 6)}...</button>))}</div>
            <div className="p-4 border-b bg-white flex justify-between items-center px-4 md:px-8"><h1 className="font-bold text-lg md:text-xl">{editId ? '編輯模式' : '新增模式'}</h1><button onClick={handleSubmit} disabled={loading || compressing} className="bg-orange-600 text-white px-6 py-2 text-sm font-bold hover:bg-orange-500 rounded-xl shadow-lg shadow-orange-200 transition">{compressing ? '圖片處理中...' : loading ? '存檔中...' : '儲存專案'}</button></div>
            <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-5xl mx-auto w-full">
                <div className="space-y-10 pb-20">
                  <section className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200">
                    <h3 className="font-black text-lg border-l-4 border-orange-500 pl-3 mb-6">基本資料</h3>
                    <div className="mb-6 p-4 bg-orange-50 border border-orange-100 rounded-xl grid grid-cols-1 md:grid-cols-2 gap-4">
                       <label className="flex items-center gap-3 cursor-pointer p-2 rounded hover:bg-white transition"><input type="checkbox" className="w-5 h-5 accent-orange-600" checked={formData.showOnHome} onChange={e=>setFormData({...formData, showOnHome: e.target.checked})}/><div><span className="font-bold text-slate-700 block">設為首頁熱銷 (Featured)</span><span className="text-xs text-slate-400">顯示於首頁輪播</span></div></label>
                       <label className="flex items-center gap-3 cursor-pointer p-2 rounded hover:bg-white transition"><input type="checkbox" className="w-5 h-5 accent-blue-600" checked={formData.isFeaturedWork} onChange={e=>setFormData({...formData, isFeaturedWork: e.target.checked})}/><div><span className="font-bold text-slate-700 block">設為經典作品推薦 (Top)</span><span className="text-xs text-slate-400">在作品分類頁置頂顯示</span></div></label>
                    </div>
                    <div className="mb-4"><label className={labelStyle}>物件介紹 (詳細描述)</label><textarea value={formData.description} onChange={e=>setFormData({...formData, description:e.target.value})} className={`${inputStyle} h-32`} placeholder="稀有釋出..." /></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="col-span-1 md:col-span-2"><label className={labelStyle}>標題</label><input value={formData.title} onChange={e=>setFormData({...formData, title:e.target.value})} className={inputStyle} placeholder="例如：台積電概念園區"/></div>
                      <div className="col-span-1 md:col-span-2"><div className="flex gap-2"><div className="flex-1"><label className={labelStyle}>英文標題 (AI)</label><input value={formData.titleEN} onChange={e=>setFormData({...formData, titleEN:e.target.value})} className={inputStyle} placeholder="點擊翻譯按鈕自動生成..."/></div><button onClick={handleTranslate} disabled={translating} className="mt-6 bg-slate-800 text-white px-4 rounded-lg text-sm font-bold hover:bg-black transition flex items-center gap-2">{translating?"...":<><Languages size={14}/> 翻譯</>}</button></div></div>
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
                      <div><label className={labelStyle}>LINE QR 圖片</label><input type="file" onChange={e=>handleUpload(e, (url)=>setFormData({...formData, lineQr: url}))} className="text-xs"/></div>
                      <div className="col-span-1 md:col-span-2"><label className={labelStyle}>封面圖</label><input type="file" onChange={e=>handleUpload(e, (url)=>setFormData({...formData, thumb: url}))} className="text-xs"/></div>
                    </div>
                  </section>
                  
                  {/* Specs & Features */}
                  <section className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200">
                    <div className="flex justify-between mb-6">
                      <h3 className="font-black text-lg border-l-4 border-orange-500 pl-3">規格 & 特色</h3>
                      <div className="flex gap-2">
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

                  {/* News Section */}
                  <section className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200">
                    <div className="flex justify-between mb-4">
                      <h3 className="font-black text-lg border-l-4 border-orange-500 pl-3">周遭環境 (新聞)</h3>
                      <div className="flex gap-2">
                        {/* 升級版按鈕：三個維度的搜尋 */}
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

                  {/* Progress Section */}
                  <section className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200">
                    <div className="flex justify-between mb-4">
                      <h3 className="font-black text-lg border-l-4 border-orange-500 pl-3">工程進度</h3>
                      <button onClick={()=>setProgressList([...progressList, {id: Date.now(), date:'', status:''}])} className="text-orange-500 text-xs font-bold">+ 新增</button>
                    </div>
                    {progressList.map((p, i) => (
                      <div key={i} className="flex gap-2 mb-2">
                        <input type="date" value={p.date} onChange={e=>{const x=[...progressList];x[i].date=e.target.value;setProgressList(x)}} className="border rounded p-2 text-sm"/>
                        <input value={p.status} onChange={e=>{const x=[...progressList];x[i].status=e.target.value;setProgressList(x)}} className="border rounded p-2 w-full text-sm" placeholder="進度描述"/>
                        <button onClick={()=>setProgressList(progressList.filter((_,idx)=>idx!==i))}><Trash2 size={16} className="text-slate-300 hover:text-red-500"/></button>
                      </div>
                    ))}
                  </section>
                  
                  {/* Unit List (Clean Structure) */}
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
          </>
        )}
      </div>
    </div>
  );
};

export default Admin;