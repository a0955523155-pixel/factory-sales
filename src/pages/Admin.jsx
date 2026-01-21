import React, { useState, useEffect, useRef, useMemo } from 'react';
import { db } from '../firebase';
import { collection, addDoc, getDocs, doc, updateDoc, setDoc, getDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { 
  X, Plus, Trash2, Layout, Users, Settings, Map as MapIcon, Upload, Languages, FileText, Sparkles, 
  LogIn, LogOut, GripVertical, ChevronUp, ChevronDown, RefreshCcw, Copy, Zap, FolderOpen, Folder, 
  Star, Award, History, Search, Train, Factory, MapPin, Globe, GraduationCap, Loader2 
} from 'lucide-react';

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

// --- [新增] AI 文案隨機模板庫 ---
const AI_TEMPLATES = {
  academy: [
    (t) => `【房地產小學堂】${t}\n\nQ：最近常聽到大家在討論 ${t}，這到底是什麼？\n\nA：其實這個概念並不複雜，但對您的權益影響很大！\n\n簡單來說，它主要涉及三個層面：\n1. 法規面：根據最新規定...\n2. 稅務面：這會直接影響到您的持有成本...\n3. 實務面：在交易過程中，我們建議...\n\n總結：了解細節才能避免踩雷，有任何疑問歡迎私訊小編！`,
    (t) => `【專家解惑】${t} 懶人包\n\nQ：遇到 ${t} 的狀況，該怎麼處理最划算？\n\nA：這是許多屋主/買家的共同疑問。我們整理了以下重點：\n\n✔ 核心觀念：千萬不要誤信網路謠言，原則上...\n✔ 常見誤區：很多人以為...其實是錯的！\n✔ 最佳解法：建議您可以先...\n\n魔鬼藏在細節裡，找對專業團隊，讓您省時又省力！`,
    (t) => `【知識分享】${t} 到底重不重要？\n\nQ：買賣房子時，一定要懂 ${t} 嗎？\n\nA：絕對要懂！因為這關係到您的荷包。\n\n舉例來說，如果您忽略了這一點，可能會面臨...\n但只要掌握好關鍵時機，反而能...\n\n想了解更多 ${t} 的實務操作？歡迎預約免費諮詢！`
  ],
  news_local: [
    (t) => `【區域利多】${t} 正式啟動！\n\n在地人期待已久的 ${t} 終於有新進度了！\n\n這項建設不僅能改善當地的交通瓶頸，預計還將帶動周邊商業活動。根據過往經驗，重大建設周邊的房價往往具備強勁的支撐力。\n\n現在進場佈局，正是掌握起漲點的絕佳時機。`,
    (t) => `【建設快訊】${t} 最新進度曝光\n\n隨著 ${t} 的議題持續發酵，本區的關注度也水漲船高。\n\n專家分析，這將串聯起周邊的產業聚落，吸引大量就業人口移入。人口紅利加上建設利多，未來的增值潛力不容小覷。\n\n綠芽團隊為您持續追蹤第一手消息！`,
    (t) => `【重磅消息】${t} 定案！\n\n區域發展再添薪火！${t} 的推動，宣告了本區即將進入發展的黃金十年。\n\n不論是自住還是投資，跟著重大建設走永遠是不敗法則。想知道哪些路段受惠最大？歡迎來電詢問！`
  ],
  news_project: [
    (t) => `【新案登場】${t} - 定義奢華新高度\n\n眾所矚目，${t} 終於公開！\n\n本案位處黃金地段，擁有難得的開闊棟距。我們特聘知名建築團隊操刀，從外觀到公設，每一個細節都極致講究。\n\n早鳥預約現正開放中，席次有限，錯過不再！`,
    (t) => `【熱銷快報】${t} 詢問度破表\n\n為什麼 ${t} 一公開就造成轟動？\n\n1. 地段無可複製：位於交通樞紐...\n2. 規劃貼心：戶戶邊間，採光通風極佳...\n3. 價格具競爭力：在同級產品中...\n\n好房子不等人，立即私訊預約賞屋！`,
    (t) => `【焦點建案】${t} - 您的理想家園\n\n尋尋覓覓，終於等到 ${t}。\n\n這不只是一間房子，更是您與家人共享天倫的城堡。寬敞的客廳、溫馨的臥室，還有完善的社區管理，讓您住得安心又舒適。\n\n歡迎蒞臨接待中心，親身體驗這份美好。`
  ]
};

const getRandomTemplate = (category, title) => {
  const list = AI_TEMPLATES[category] || AI_TEMPLATES['news_project']; // 預設用建案模板
  const randomIndex = Math.floor(Math.random() * list.length);
  return list[randomIndex](title);
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
  const [aiGenerating, setAiGenerating] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [editId, setEditId] = useState(null);
  const dragItem = useRef(); const dragOverItem = useRef();

  const [formData, setFormData] = useState({ 
    title: '', titleEN: '', subtitle: '', description: '',
    price: '', address: '', 
    city: '高雄', propertyType: '工業地', usageType: '廠房', transactionType: '出售',
    agentPhone: '', agentName: '', lineId: '', lineQr: '', 
    googleMapUrl: '', thumb: '', images: [],
    showOnHome: false,
    isFeaturedWork: false
  });
  
  const [specs, setSpecs] = useState([{ id: 's1', label: "使用分區", value: "乙種工業區" }]);
  const [features, setFeatures] = useState([{ id: 'f1', title: "特色標題", desc: "" }]);
  const [envList, setEnvList] = useState([{ id: 'e1', title: "", desc: "", image: "", link: "" }]);
  const [progressList, setProgressList] = useState([{ id: 'p1', date: '', status: '' }]);
  const [units, setUnits] = useState([{ id: 'u1', number: '', ping: '', unitPrice: '', price: '', status: 'available', layout: '' }]);
  
  const [batchUnitPrice, setBatchUnitPrice] = useState('');
  const [collapsedZones, setCollapsedZones] = useState({});

  const [articleForm, setArticleForm] = useState({ category: 'news_local', title: '', content: '', date: '', image: '' });
  const [editArticleId, setEditArticleId] = useState(null);
  
  const [envSearchInput, setEnvSearchInput] = useState("");
  const [artSearchInput, setArtSearchInput] = useState("");

  const [globalSettings, setGlobalSettings] = useState({ siteName: "Factory Pro", heroTitleCN: "未來工廠", heroTitleEN: "FUTURE FACTORY", contactPhone: "0800-666-738", fbLink: "", igLink: "", lineLink: "", iconFB: "", iconIG: "", iconLINE: "" });

  const historyData = useMemo(() => {
    const specLabels = new Set();
    const featureTitles = new Set();
    const progressStatuses = new Set();
    
    properties.forEach(p => {
      p.specs?.forEach(s => { if(s.label) specLabels.add(s.label); });
      p.features?.forEach(f => { if(f.title) featureTitles.add(f.title); });
      p.progressHistory?.forEach(pr => { if(pr.status) progressStatuses.add(pr.status); });
    });

    return {
      specs: Array.from(specLabels),
      features: Array.from(featureTitles),
      progress: Array.from(progressStatuses)
    };
  }, [properties]);

  // --- 搜尋功能 ---
  const handleSmartNewsSearch = (type) => {
    if (envSearchInput) {
       window.open(`https://www.google.com/search?tbm=nws&q=${encodeURIComponent(envSearchInput)}`, '_blank');
       return;
    }
    const districtMatch = formData.address.match(/(?:縣|市)(\S+?(?:區|鄉|鎮|市))/);
    const district = districtMatch ? districtMatch[1] : '';
    const city = formData.city.replace('市', '').replace('縣', ''); 
    let keywords = '';
    switch (type) {
      case 'traffic': keywords = `${city} ${district} 交通建設 捷運 國道 高鐵 延伸`; break;
      case 'industry': keywords = `${city} ${district} 產業園區 科學園區 招商 設廠`; break;
      case 'area': default: keywords = `${city} ${district} 重劃區 建設 利多 房市`; break;
    }
    setEnvSearchInput(keywords); 
  };

  const handleArticleMaterialSearch = () => {
    const query = artSearchInput || articleForm.title || "房地產";
    let finalQuery = query;
    if (!artSearchInput) {
        if (articleForm.category === 'news_local') finalQuery += " 建設 動土 完工 示意圖";
        else if (articleForm.category === 'news_project') finalQuery += " 房市 趨勢 銷售";
        else if (articleForm.category === 'academy') finalQuery += " 知識 法規 懶人包";
        setArtSearchInput(finalQuery); 
    } else {
        window.open(`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(query)}`, '_blank');
        window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, '_blank');
    }
  };

  const executeEnvSearch = () => {
    if (!envSearchInput) return alert("請先選擇 AI 推薦或手動輸入關鍵字");
    window.open(`https://www.google.com/search?tbm=nws&q=${encodeURIComponent(envSearchInput)}`, '_blank');
  };

  const executeArtSearch = () => {
    if(!artSearchInput) return alert("請先輸入關鍵字");
    window.open(`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(artSearchInput)}`, '_blank');
    window.open(`https://www.google.com/search?q=${encodeURIComponent(artSearchInput)}`, '_blank');
  };

  // --- 案場環境：隨機文案 ---
  const handleSmartNewsGenerate = () => {
    const districtMatch = formData.address.match(/(?:縣|市)(\S+?(?:區|鄉|鎮|市))/);
    const district = districtMatch ? districtMatch[1] : formData.city;
    const type = formData.propertyType;
    
    // 簡單隨機選擇
    const intents = [
        `【${district}重磅建設】\n隨著${district}基礎建設到位，${type}市場需求強勁。本案佔盡地利，未來增值可期。`,
        `【${district}產業首選】\n${district}產業鏈聚落成形，${type}一位難求。掌握關鍵地段，就是掌握商機。`,
        `【${district}交通核心】\n緊鄰主要幹道，物流運輸最便捷。${type}稀有釋出，企業主一致推薦。`
    ];
    const desc = intents[Math.floor(Math.random() * intents.length)];
    const title = `${district}最新發展動態`;

    const newEnv = [...envList];
    if (newEnv.length > 0 && !newEnv[newEnv.length-1].title) newEnv[newEnv.length-1] = { ...newEnv[newEnv.length-1], title, desc };
    else newEnv.push({ id: Date.now(), title, desc, image: "", link: "" });
    setEnvList(newEnv);
  };

  // --- 文章：AI 自動撰寫 (使用隨機模板) ---
  const handleAIWrite = async () => {
    if (!articleForm.title) return alert("請先輸入標題");
    setAiGenerating(true);
    await new Promise(r => setTimeout(r, 1000)); // 模擬 1 秒思考
    
    const content = getRandomTemplate(articleForm.category, articleForm.title);
    setArticleForm(prev => ({ ...prev, content }));
    setAiGenerating(false);
  };

  const calculateTotalPrice = (ping, unitPrice) => {
    const p = parseFloat(ping);
    const u = parseFloat(unitPrice);
    if (!isNaN(p) && !isNaN(u)) {
      const total = (p * u).toFixed(0);
      return `${total} 萬`;
    }
    return '';
  };

  const handleUnitChange = (id, field, value) => {
    setUnits(prev => prev.map(u => {
      if (u.id !== id) return u;
      const newUnit = { ...u, [field]: value };
      if (field === 'ping' || field === 'unitPrice') {
        newUnit.price = calculateTotalPrice(newUnit.ping, newUnit.unitPrice);
      }
      return newUnit;
    }));
  };

  const handleDuplicateUnit = (unit) => {
    const newUnit = { ...unit, id: Date.now(), number: `${unit.number} (複製)`, layout: '' };
    setUnits([newUnit, ...units]);
  };

  const handleAddUnit = () => {
    const newUnit = { id: Date.now(), number: '', ping: '', unitPrice: '', price: '', status: 'available', layout: '' };
    setUnits([newUnit, ...units]);
  };

  const applyBatchPrice = (onlyEmpty = false) => {
    if (!batchUnitPrice) return alert("請先輸入統一單價");
    const msg = onlyEmpty 
      ? "確定要將單價填入所有「未填寫單價」的欄位嗎？" 
      : "確定要將「所有戶別」的單價都改成這個數值嗎？(原資料將被覆蓋)";
    if (!window.confirm(msg)) return;

    const newUnits = units.map(u => {
      if (onlyEmpty && u.unitPrice) return u;
      const newPrice = calculateTotalPrice(u.ping, batchUnitPrice);
      return { ...u, unitPrice: batchUnitPrice, price: newPrice };
    });
    setUnits(newUnits);
    alert("已完成批次更新！");
  };

  const groupedUnits = useMemo(() => {
    const groups = {};
    units.forEach(u => {
      const zone = u.number ? u.number.charAt(0).toUpperCase() : '未分類';
      const zoneKey = /^[A-Z]$/.test(zone) ? zone : '其他';
      if (!groups[zoneKey]) groups[zoneKey] = [];
      groups[zoneKey].push(u);
    });
    return Object.keys(groups).sort().reduce((obj, key) => {
      obj[key] = groups[key];
      return obj;
    }, {});
  }, [units]);

  const toggleZone = (zone) => {
    setCollapsedZones(prev => ({ ...prev, [zone]: !prev[zone] }));
  };

  useEffect(() => { const storedAuth = localStorage.getItem('isAuth'); if (storedAuth === 'true') { setIsAuth(true); fetchAll(); } }, []);
  const fetchAll = () => { fetchProperties(); fetchGlobalSettings(); fetchCustomers(); fetchArticles(); };
  const handleLogin = (e) => { e.preventDefault(); if (loginForm.user === 'gst0800666738' && loginForm.pass === '0800666738') { setIsAuth(true); localStorage.setItem('isAuth', 'true'); fetchAll(); } else { alert("帳號或密碼錯誤"); } };
  const handleLogout = () => { if (window.confirm("登出？")) { setIsAuth(false); localStorage.removeItem('isAuth'); navigate('/'); } };

  const fetchProperties = async () => { try { const snap = await getDocs(collection(db, "properties")); const list = []; snap.forEach((doc) => list.push({ id: doc.id, ...doc.data() })); setProperties(list); } catch (e) {} };
  const fetchArticles = async () => { try { const snap = await getDocs(collection(db, "articles")); const list = []; snap.forEach((doc) => list.push({ id: doc.id, ...doc.data() })); list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)); setArticles(list); } catch (e) {} };
  const fetchGlobalSettings = async () => { try { const docSnap = await getDoc(doc(db, "settings", "global")); if (docSnap.exists()) setGlobalSettings(docSnap.data()); } catch (e) {} };
  const fetchCustomers = async () => { try { const snap = await getDocs(collection(db, "customers")); const list = []; snap.forEach((doc) => list.push({ id: doc.id, ...doc.data() })); list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)); setCustomers(list); } catch (e) {} };

  const loadEdit = (item) => {
    setEditId(item.id); const info = item.basicInfo || {};
    setFormData({
      title: safeStr(info.title), titleEN: safeStr(info.titleEN), subtitle: safeStr(info.subtitle), description: safeStr(info.description),
      price: safeStr(info.price), address: safeStr(info.address), city: safeStr(info.city) || '高雄', propertyType: safeStr(info.propertyType) || '工業地', usageType: safeStr(info.usageType) || '廠房', transactionType: safeStr(info.transactionType) || '出售',
      agentPhone: safeStr(info.agentPhone), agentName: safeStr(info.agentName), lineId: safeStr(info.lineId), lineQr: safeStr(info.lineQr), googleMapUrl: safeStr(info.googleMapUrl),
      thumb: safeStr(info.thumb), images: Array.isArray(info.images) ? info.images : [],
      showOnHome: info.showOnHome || false,
      isFeaturedWork: info.isFeaturedWork || false
    });
    setSpecs(Array.isArray(item.specs) ? item.specs : []); setFeatures(Array.isArray(item.features) ? item.features : []);
    setEnvList(item.environmentList || []); setProgressList(item.progressHistory || []); setUnits(item.units || []);
  };

  const loadEditArticle = (item) => { 
    setEditArticleId(item.id); 
    setArticleForm({ ...item }); 
    setArtSearchInput(item.title || "");
  };
  
  const handleUpload = async (e, callback) => { const file = e.target.files[0]; if (!file) return; setCompressing(true); try { const compressed = await compressImage(file); callback(compressed); } catch (e) {} setCompressing(false); };

  const resetForm = () => {
    setEditId(null);
    setFormData({ title: '', titleEN: '', subtitle: '', description: '', price: '', address: '', city: '高雄', propertyType: '工業地', usageType: '廠房', transactionType: '出售', agentPhone: '', agentName: '', lineId: '', lineQr: '', googleMapUrl: '', thumb: '', images: [], showOnHome: false, isFeaturedWork: false });
    setSpecs([{ id: `s-${Date.now()}`, label: "使用分區", value: "乙種工業區" }]); setFeatures([{ id: `f-${Date.now()}`, title: "特色標題", desc: "" }]);
    setEnvList([{ id: `e-${Date.now()}`, title: "", desc: "", image: "", link: "" }]);
    setProgressList([{ id: `p-${Date.now()}`, date: "", status: "" }]); setUnits([{ id: `u-${Date.now()}`, number: '', ping: '', unitPrice: '', price: '', status: 'available', layout: '' }]);
  };

  const handleSubmit = async (e) => { 
    if(e) e.preventDefault(); 
    setLoading(true); 
    try {
      const payload = { basicInfo: formData, specs, features, environmentList: envList, progressHistory: progressList, units, images: formData.images, updatedAt: new Date() }; 
      if (editId) await updateDoc(doc(db, "properties", editId), payload); 
      else await addDoc(collection(db, "properties"), payload); 
      alert("儲存成功！"); 
      window.location.reload(); 
    } catch(err) {
      console.error(err);
      alert("儲存失敗: " + err.message);
    } finally {
      setLoading(false); 
    }
  };

  const handleArticleSubmit = async (e) => { 
    if(e) e.preventDefault(); 
    if (!articleForm.title) return alert("請輸入標題");
    setLoading(true); 
    try {
      const payload = { ...articleForm, createdAt: Date.now(), updatedAt: new Date(), order: -Date.now() }; 
      if (editArticleId) {
        delete payload.order; 
        await updateDoc(doc(db, "articles", editArticleId), payload); 
      } else { 
        await addDoc(collection(db, "articles"), payload); 
      } 
      alert("發布成功！"); 
      setArticleForm({ category: 'news_local', title: '', content: '', date: '', image: '' }); 
      setEditArticleId(null); 
      setArtSearchInput("");
      fetchArticles(); 
    } catch(err) {
      console.error(err);
      alert("發布失敗: " + err.message);
    } finally {
      setLoading(false); 
    }
  };

  const handleDeleteProperty = async (e, id) => { e.stopPropagation(); if (!window.confirm("刪除？")) return; await deleteDoc(doc(db, "properties", id)); fetchProperties(); };
  
  const handleDeleteArticle = async (id) => { 
    if (!window.confirm("刪除？")) return; 
    try {
      await deleteDoc(doc(db, "articles", id)); 
      fetchArticles(); 
    } catch(err) {
      alert("刪除失敗");
    }
  };

  const handleTranslate = async () => { if (!formData.title) return alert("請先輸入中文"); setTranslating(true); try { const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(formData.title)}&langpair=zh-TW|en`); const data = await response.json(); if (data.responseData.translatedText) setFormData(prev => ({ ...prev, titleEN: data.responseData.translatedText })); } catch (error) {} setTranslating(false); };
  
  const handleSaveSettings = async () => { setLoading(true); await setDoc(doc(db, "settings", "global"), globalSettings); alert("已更新"); window.location.reload(); setLoading(false); };
  const moveArticle = async (index, direction) => { const newItems = [...articles]; if (direction === 'up' && index > 0) { [newItems[index], newItems[index - 1]] = [newItems[index - 1], newItems[index]]; } else if (direction === 'down' && index < newItems.length - 1) { [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]]; } else { return; } setArticles(newItems); saveOrder(newItems); };
  const handleDragStart = (e, position) => { dragItem.current = position; };
  const handleDragEnter = (e, position) => { dragOverItem.current = position; };
  const handleDragEnd = async () => { const copyListItems = [...articles]; const dragItemContent = copyListItems[dragItem.current]; copyListItems.splice(dragItem.current, 1); copyListItems.splice(dragOverItem.current, 0, dragItemContent); dragItem.current = null; dragOverItem.current = null; setArticles(copyListItems); saveOrder(copyListItems); };
  const saveOrder = async (items) => { try { const batch = writeBatch(db); items.forEach((item, index) => { const ref = doc(db, "articles", item.id); batch.update(ref, { order: index }); }); await batch.commit(); } catch (e) {} };
  const resetOrderToDate = async () => { if (!window.confirm("重排？")) return; const sorted = [...articles].sort((a, b) => new Date(b.date) - new Date(a.date)); setArticles(sorted); saveOrder(sorted); };

  const inputStyle = "w-full bg-white border border-slate-300 text-slate-800 p-3 md:p-2.5 text-base md:text-sm focus:outline-none focus:border-orange-500 rounded-lg shadow-sm transition placeholder:text-slate-300";
  const labelStyle = "block text-xs font-bold text-slate-500 mb-1.5 tracking-wider uppercase";
  const propertyTypes = ['工業地', '農地', '建地'];
  const usageTypes = { '工業地': ['廠房', '工業地'], '農地': ['農地廠房', '農地'], '建地': ['建地廠房', '透天', '套房'] };

  if (!isAuth) return ( <div className="h-screen flex items-center justify-center bg-slate-100 px-4"><form onSubmit={handleLogin} className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm border border-slate-200"><div className="text-center mb-8"><div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 text-white"><LogIn size={32}/></div><h1 className="text-2xl font-black text-slate-900">綠芽管理員登入</h1></div><div className="space-y-4"><input type="text" placeholder="帳號" value={loginForm.user} onChange={e=>setLoginForm({...loginForm, user:e.target.value})} className="w-full p-3 border rounded-xl bg-slate-50 focus:border-orange-500 outline-none" autoComplete="username" /><input type="password" placeholder="密碼" value={loginForm.pass} onChange={e=>setLoginForm({...loginForm, pass:e.target.value})} className="w-full p-3 border rounded-xl bg-slate-50 focus:border-orange-500 outline-none" autoComplete="current-password" /><button type="submit" className="w-full bg-orange-600 text-white py-3 rounded-xl font-bold hover:bg-orange-700 transition shadow-lg">登入系統</button></div></form></div> );

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-slate-100 text-slate-800 font-sans overflow-hidden">
      <div className="w-full lg:w-64 bg-white border-b lg:border-b-0 lg:border-r border-slate-200 flex flex-col shrink-0">
        <div className="p-4 md:p-5 flex justify-between items-center lg:block"><h2 className="font-black text-xl text-slate-900 tracking-tight">綠芽管理員</h2><button onClick={handleLogout} className="lg:hidden text-slate-400 hover:text-red-500"><LogOut size={20}/></button></div>
        <div className="flex lg:flex-col gap-2 p-2 overflow-x-auto lg:overflow-visible scrollbar-hide"><button onClick={() => setViewMode('properties')} className={`flex-shrink-0 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition whitespace-nowrap ${viewMode === 'properties' ? 'bg-orange-50 text-orange-600' : 'text-slate-500 hover:bg-slate-50'}`}><Layout size={18}/> 案場管理</button><button onClick={() => setViewMode('articles')} className={`flex-shrink-0 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition whitespace-nowrap ${viewMode === 'articles' ? 'bg-orange-50 text-orange-600' : 'text-slate-500 hover:bg-slate-50'}`}><FileText size={18}/> 文章管理</button><button onClick={() => setViewMode('customers')} className={`flex-shrink-0 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition whitespace-nowrap ${viewMode === 'customers' ? 'bg-orange-50 text-orange-600' : 'text-slate-500 hover:bg-slate-50'}`}><Users size={18}/> 客戶資料</button><button onClick={() => setViewMode('settings')} className={`flex-shrink-0 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition whitespace-nowrap ${viewMode === 'settings' ? 'bg-orange-50 text-orange-600' : 'text-slate-500 hover:bg-slate-50'}`}><Settings size={18}/> 網站設定</button></div>
        <div className="mt-auto p-4 hidden lg:block border-t border-slate-100"><button onClick={handleLogout} className="flex items-center gap-2 text-slate-400 hover:text-red-500 text-sm font-bold transition w-full px-4 py-2 hover:bg-red-50 rounded-xl"><LogOut size={18}/> 登出系統</button></div>
        {viewMode === 'properties' && (<div className="flex-1 overflow-y-auto p-3 space-y-2 border-t lg:border-t-0 border-slate-100 hidden lg:block"><button onClick={resetForm} className="w-full py-2 bg-orange-500 text-white rounded-lg font-bold text-sm hover:bg-orange-600 mb-4 shadow">+ 新增案場</button>{properties.map(p => (<div key={p.id} onClick={() => loadEdit(p)} className={`p-3 border cursor-pointer hover:bg-white rounded-xl flex justify-between items-center group transition ${editId === p.id ? 'border-orange-500 bg-white shadow-md' : 'border-slate-100 bg-slate-50'}`}><div className="font-bold text-sm truncate w-32 text-slate-700">{p.basicInfo.title}</div><div className="flex items-center gap-1">{p.basicInfo.showOnHome && <Star size={12} className="text-orange-500 fill-orange-500"/>}{p.basicInfo.isFeaturedWork && <Award size={12} className="text-blue-500 fill-blue-500"/>}<button onClick={(e) => handleDeleteProperty(e, p.id)} className="text-slate-300 hover:text-red-500 p-1"><Trash2 size={14} /></button></div></div>))}</div>)}
      </div>

      <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden">
        {viewMode === 'settings' && (<div className="p-6 md:p-10 max-w-3xl mx-auto w-full overflow-y-auto"><h1 className="text-2xl md:text-3xl font-black mb-8">網站全域設定</h1><div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 space-y-6"><div><label className={labelStyle}>左上角網站名稱</label><input value={globalSettings.siteName} onChange={e=>setGlobalSettings({...globalSettings, siteName: e.target.value})} className={inputStyle} /></div><div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div><label className={labelStyle}>首頁大標題 (中文)</label><input value={globalSettings.heroTitleCN} onChange={e=>setGlobalSettings({...globalSettings, heroTitleCN: e.target.value})} className={inputStyle} /></div><div><label className={labelStyle}>首頁大標題 (英文)</label><input value={globalSettings.heroTitleEN} onChange={e=>setGlobalSettings({...globalSettings, heroTitleEN: e.target.value})} className={inputStyle} /></div></div><div><label className={labelStyle}>全站聯絡電話</label><input value={globalSettings.contactPhone} onChange={e=>setGlobalSettings({...globalSettings, contactPhone: e.target.value})} className={inputStyle} /></div><h3 className="font-black border-l-4 border-orange-500 pl-2 mt-4">社群連結</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label className={labelStyle}>FB 連結</label><input value={globalSettings.fbLink} onChange={e=>setGlobalSettings({...globalSettings, fbLink: e.target.value})} className={inputStyle} /></div><div><label className={labelStyle}>FB 圖示</label><input type="file" onChange={e=>handleUpload(e, (url)=>setGlobalSettings({...globalSettings, iconFB: url}))} className="text-xs"/>{globalSettings.iconFB ? <img src={globalSettings.iconFB} className="h-8 w-8 rounded-full border"/> : null}</div><div><label className={labelStyle}>IG 連結</label><input value={globalSettings.igLink} onChange={e=>setGlobalSettings({...globalSettings, igLink: e.target.value})} className={inputStyle} /></div><div><label className={labelStyle}>IG 圖示</label><input type="file" onChange={e=>handleUpload(e, (url)=>setGlobalSettings({...globalSettings, iconIG: url}))} className="text-xs"/>{globalSettings.iconIG ? <img src={globalSettings.iconIG} className="h-8 w-8 rounded-full border"/> : null}</div><div><label className={labelStyle}>LINE 連結</label><input value={globalSettings.lineLink} onChange={e=>setGlobalSettings({...globalSettings, lineLink: e.target.value})} className={inputStyle} /></div><div><label className={labelStyle}>LINE 圖示</label><input type="file" onChange={e=>handleUpload(e, (url)=>setGlobalSettings({...globalSettings, iconLINE: url}))} className="text-xs"/>{globalSettings.iconLINE ? <img src={globalSettings.iconLINE} className="h-8 w-8 rounded-full border"/> : null}</div></div><button onClick={handleSaveSettings} disabled={loading} className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-orange-600 transition shadow-lg mt-4">{loading ? "處理中..." : "儲存設定"}</button></div></div>)}
        {viewMode === 'customers' && (<div className="p-6 md:p-10 w-full max-w-7xl mx-auto overflow-y-auto"><h1 className="text-2xl md:text-3xl font-black mb-8">客戶諮詢資料表</h1><div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden overflow-x-auto"><table className="w-full text-sm text-left min-w-[600px]"><thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs border-b border-slate-200"><tr><th className="p-5">日期</th><th className="p-5">姓名</th><th className="p-5">電話</th><th className="p-5">行業</th><th className="p-5">需求</th><th className="p-5">坪數</th></tr></thead><tbody>{customers.map(c => (<tr key={c.id} className="border-b border-slate-100 hover:bg-orange-50/50 transition"><td className="p-5 font-mono text-slate-400">{new Date(c.createdAt?.seconds * 1000).toLocaleDateString()}</td><td className="p-5 font-bold text-slate-800">{c.name}</td><td className="p-5 text-orange-600 font-bold">{c.phone}</td><td className="p-5">{c.industry}</td><td className="p-5"><span className="bg-slate-100 px-2 py-1 rounded text-xs font-bold text-slate-600">{c.needs}</span></td><td className="p-5">{c.ping}</td></tr>))}</tbody></table></div></div>)}
        
        {viewMode === 'articles' && (<div className="flex flex-col md:flex-row h-full"><div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-slate-200 bg-white p-4 overflow-y-auto shrink-0 max-h-[40vh] md:max-h-full"><button onClick={() => {setEditArticleId(null); setArticleForm({ category: 'news_local', title: '', content: '', date: '', image: '' }); setArtSearchInput("");}} className="w-full bg-slate-900 text-white py-3 rounded-lg mb-4 text-sm font-bold shadow hover:bg-black transition">+ 撰寫新文章</button><div className="space-y-2"><div className="flex justify-between items-center mb-2 px-1"><p className="text-xs text-slate-400">排序</p><button onClick={resetOrderToDate} className="text-[10px] flex items-center gap-1 text-blue-500 hover:underline"><RefreshCcw size={10}/> 重排</button></div>{articles.map((a, index) => (<div key={a.id} draggable onDragStart={(e) => handleDragStart(e, index)} onDragEnter={(e) => handleDragEnter(e, index)} onDragEnd={handleDragEnd} onClick={()=>loadEditArticle(a)} className={`p-3 border mb-2 rounded-xl cursor-grab active:cursor-grabbing transition relative group flex items-center gap-3 ${editArticleId===a.id ? 'border-orange-500 bg-orange-50' : 'border-slate-100 hover:border-slate-300'}`}><div className="flex flex-col gap-1 md:hidden"><button onClick={(e) => { e.stopPropagation(); moveArticle(index, 'up'); }} className="p-1 bg-slate-100 rounded hover:bg-slate-200"><ChevronUp size={12}/></button><button onClick={(e) => { e.stopPropagation(); moveArticle(index, 'down'); }} className="p-1 bg-slate-100 rounded hover:bg-slate-200"><ChevronDown size={12}/></button></div><GripVertical size={16} className="text-slate-300 hidden md:block"/><div className="flex-1 min-w-0"><span className={`text-[10px] px-2 py-0.5 rounded-full text-white font-bold inline-block mb-1 bg-gray-500`}>{a.category}</span><div className="font-bold text-slate-800 line-clamp-1 text-sm">{a.title}</div></div><button onClick={(e) => {e.stopPropagation(); handleDeleteArticle(a.id);}} className="text-slate-300 hover:text-red-500"><Trash2 size={16}/></button></div>))}</div></div><div className="flex-1 p-6 md:p-10 overflow-y-auto bg-slate-50"><div className="max-w-3xl mx-auto"><div className="flex justify-between items-center mb-8"><h2 className="text-2xl md:text-3xl font-black">{editArticleId ? '編輯文章' : '新增文章'}</h2><button type="button" onClick={handleArticleSubmit} disabled={loading} className="bg-orange-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-orange-500 shadow-lg transition text-sm">{loading ? "發布中..." : "確認發布"}</button></div><div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 space-y-6"><div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div><label className={labelStyle}>文章分類</label><select value={articleForm.category} onChange={e=>setArticleForm({...articleForm, category: e.target.value})} className={inputStyle}><option value="news_local">最新消息-地方新聞</option><option value="news_project">最新消息-建案新訊</option><option value="academy">房地產小學堂 (QA)</option><option value="works">經典作品</option><option value="about">關於我們</option></select></div><div><label className={labelStyle}>發布日期</label><input type="date" value={articleForm.date} onChange={e=>setArticleForm({...articleForm, date: e.target.value})} className={inputStyle}/></div></div><div><label className={labelStyle}>文章標題</label><input value={articleForm.title} onChange={e=>setArticleForm({...articleForm, title: e.target.value})} className={inputStyle} placeholder="請輸入吸引人的標題..."/></div><div className="relative"> <div className="flex justify-between items-center mb-1"> <label className={labelStyle}>文章內容</label> <div className="flex gap-2 bg-blue-50 p-1.5 rounded-lg border border-blue-100"><input type="text" value={artSearchInput} onChange={(e)=>setArtSearchInput(e.target.value)} placeholder="輸入關鍵字..." className="text-xs bg-white border border-slate-200 rounded px-2 py-1 w-32 outline-none focus:border-blue-500"/><button type="button" onClick={handleArticleMaterialSearch} className="text-xs bg-white text-blue-600 border border-blue-200 font-bold px-3 py-1 rounded flex items-center gap-1 hover:bg-blue-50"><Globe size={12}/> AI 推薦</button><button type="button" onClick={executeArtSearch} className="text-xs bg-blue-600 text-white font-bold px-3 py-1 rounded flex items-center gap-1 hover:bg-blue-700 shadow"><Search size={12}/> 搜尋</button></div> <button type="button" onClick={handleAIWrite} className="text-xs flex items-center gap-1 text-purple-600 font-bold hover:text-purple-800 bg-purple-50 px-3 py-1.5 rounded-lg transition ml-2 flex items-center gap-1">{aiGenerating ? <Loader2 className="animate-spin" size={12}/> : <Sparkles size={12}/>} {aiGenerating ? "生成中..." : "AI 自動撰寫"}</button> </div> <textarea value={articleForm.content} onChange={e=>setArticleForm({...articleForm, content: e.target.value})} className={`${inputStyle} h-64 leading-relaxed`} placeholder="輸入內容，或點擊 AI 自動撰寫..."/></div><div><label className={labelStyle}>封面圖片 (自動壓浮水印)</label><div className="flex items-center gap-4"><label className="cursor-pointer bg-slate-100 hover:bg-slate-200 px-4 py-3 rounded-lg flex items-center gap-2 text-sm font-bold text-slate-600 transition"><Upload size={16}/> 上傳圖片 <input type="file" className="hidden" onChange={e=>handleUpload(e, (url)=>setArticleForm({...articleForm, image: url}))}/></label>{articleForm.image ? <img src={articleForm.image} className="h-20 w-32 object-cover rounded-lg border border-slate-200 shadow-sm"/> : null}</div></div></div></div></div></div>)}
        
        {viewMode === 'properties' && (
          <>
            <div className="lg:hidden p-2 bg-white border-b overflow-x-auto flex gap-2"><button onClick={resetForm} className="bg-orange-500 text-white px-3 py-1.5 rounded-lg font-bold text-xs shrink-0">+ 新增</button>{properties.map(p => (<button key={p.id} onClick={() => loadEdit(p)} className={`px-3 py-1.5 rounded-lg border text-xs font-bold shrink-0 whitespace-nowrap ${editId === p.id ? 'bg-orange-50 border-orange-500 text-orange-600' : 'bg-slate-50 border-slate-200'}`}>{p.basicInfo.title.substring(0, 6)}...</button>))}</div>
            <div className="p-4 border-b bg-white flex justify-between items-center px-4 md:px-8"><h1 className="font-bold text-lg md:text-xl">{editId ? '編輯模式' : '新增模式'}</h1><button type="button" onClick={handleSubmit} disabled={loading || compressing} className="bg-orange-600 text-white px-6 py-2 text-sm font-bold hover:bg-orange-500 rounded-xl shadow-lg shadow-orange-200 transition">{compressing ? '圖片處理中...' : loading ? '存檔中...' : '儲存專案'}</button></div>
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
                      <div className="col-span-1 md:col-span-2"><label className={labelStyle}>封面圖</label><input type="file" onChange={e=>handleUpload(e, (url)=>setFormData({...formData, thumb: url}))} className="text-xs"/>{formData.thumb ? <img src={formData.thumb} className="h-20 w-32 object-cover rounded-lg border border-slate-200 shadow-sm mt-2"/> : null}</div>
                    </div>
                  </section>
                  
                  {/* Specs & Features */}
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

                  {/* News Section */}
                  <section className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200">
                    <div className="flex justify-between mb-4">
                      <h3 className="font-black text-lg border-l-4 border-orange-500 pl-3">周遭環境 (新聞)</h3>
                      <div className="flex gap-2 items-center">
                        <div className="flex gap-2 bg-blue-50 p-1.5 rounded-lg border border-blue-100">
                           <input type="text" value={envSearchInput} onChange={(e)=>setEnvSearchInput(e.target.value)} placeholder="新聞關鍵字" className="text-xs bg-white border border-slate-200 rounded px-2 py-1 w-32 outline-none focus:border-blue-500"/>
                           <button onClick={()=>handleSmartNewsSearch('traffic')} className="text-xs text-blue-600 font-bold px-2 hover:bg-blue-100 rounded">AI 推薦</button>
                           <button onClick={executeEnvSearch} className="text-xs bg-blue-600 text-white font-bold px-3 py-1 rounded flex items-center gap-1 hover:bg-blue-700 shadow"><Search size={12}/> 搜尋</button>
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