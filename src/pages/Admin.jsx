import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, getDocs, doc, updateDoc } from 'firebase/firestore';
import { X, Plus, Trash2, Link as LinkIcon, Upload, ImageIcon } from 'lucide-react';

// --- 輔助函式 ---
const safeStr = (val) => (val === undefined || val === null) ? "" : String(val);

// --- 圖片壓縮 ---
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
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [activeTab, setActiveTab] = useState('content');

  // --- 表單狀態 ---
  const [formData, setFormData] = useState({ 
    title: '', subtitle: '', price: '', address: '', 
    agentPhone: '', agentName: '', lineId: '', thumb: '', images: [] 
  });
  
  const [specs, setSpecs] = useState([{ id: 's1', label: "總建坪", value: "" }]);
  const [features, setFeatures] = useState([{ id: 'f1', title: "特色標題", desc: "" }]);
  
  // 修改：理念增加圖片
  const [concept, setConcept] = useState({ title: "建築理念", content: "", image: "" }); 
  
  // 修改：周遭環境 (改成陣列，支援 1~3 個)
  const [envList, setEnvList] = useState([
    { id: 'e1', title: "交通優勢", desc: "", image: "", link: "" }
  ]);
  
  const [progressList, setProgressList] = useState([{ id: 'p1', date: '', status: '' }]);
  const [theme, setTheme] = useState({ primaryColor: '#ea580c', bgColor: '#f1f5f9', textColor: '#1e293b' });

  // --- 初始化 ---
  useEffect(() => { 
    const fetch = async () => {
      try {
        const snap = await getDocs(collection(db, "properties"));
        const list = [];
        snap.forEach((doc) => list.push({ id: doc.id, ...doc.data() }));
        setProperties(list);
      } catch(e) { console.error("讀取失敗", e); }
    };
    fetch();
  }, []);

  // --- 載入編輯 ---
  const loadEdit = (item) => {
    setEditId(item.id);
    const info = item.basicInfo || {};
    setFormData({
      title: safeStr(info.title),
      subtitle: safeStr(info.subtitle),
      price: safeStr(info.price),
      address: safeStr(info.address),
      agentPhone: safeStr(info.agentPhone),
      agentName: safeStr(info.agentName),
      lineId: safeStr(info.lineId),
      thumb: safeStr(info.thumb),
      images: Array.isArray(info.images) ? info.images : []
    });

    setSpecs(Array.isArray(item.specs) ? item.specs : []);
    setFeatures(Array.isArray(item.features) ? item.features : []);
    
    // 載入理念 (相容舊版)
    setConcept({
      title: safeStr(item.concept?.title),
      content: safeStr(item.concept?.content),
      image: safeStr(item.concept?.image) // 新增圖片欄位
    });

    // 載入環境 (自動轉換舊版單一物件為陣列)
    if (Array.isArray(item.environmentList)) {
      setEnvList(item.environmentList);
    } else if (item.environment) {
      // 舊版資料轉移
      setEnvList([{ 
        id: 'legacy', 
        title: safeStr(item.environment.title), 
        desc: safeStr(item.environment.desc),
        image: safeStr(item.environment.image),
        link: safeStr(item.environment.link)
      }]);
    } else {
      setEnvList([{ id: 'init', title: "", desc: "", image: "", link: "" }]);
    }

    if (Array.isArray(item.progressHistory)) setProgressList(item.progressHistory);
    else setProgressList([{ id: 'init', date: '', status: '' }]);
    
    setTheme(item.theme || { primaryColor: '#ea580c', bgColor: '#f1f5f9', textColor: '#1e293b' });
  };

  // --- 圖片上傳處理 ---
  const handleUpload = async (e, callback) => {
    const file = e.target.files[0];
    if (!file) return;
    setCompressing(true);
    try {
      const compressed = await compressImage(file);
      callback(compressed);
    } catch (error) {
      alert("圖片處理失敗");
    }
    setCompressing(false);
  };

  const resetForm = () => {
    setEditId(null);
    setFormData({ title: '', subtitle: '', price: '', address: '', agentPhone: '', agentName: '', lineId: '', thumb: '', images: [] });
    setSpecs([{ id: `s-${Date.now()}`, label: "總建坪", value: "" }]);
    setFeatures([{ id: `f-${Date.now()}`, title: "特色標題", desc: "" }]);
    setConcept({ title: "建築理念", content: "", image: "" });
    setEnvList([{ id: `e-${Date.now()}`, title: "周遭環境", desc: "", image: "", link: "" }]);
    setProgressList([{ id: `p-${Date.now()}`, date: "", status: "" }]);
    setTheme({ primaryColor: '#ea580c', bgColor: '#f1f5f9', textColor: '#1e293b' });
  };

  // --- 存檔 ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const cleanBasicInfo = {
        title: safeStr(formData.title),
        subtitle: safeStr(formData.subtitle),
        price: safeStr(formData.price),
        address: safeStr(formData.address),
        agentPhone: safeStr(formData.agentPhone),
        agentName: safeStr(formData.agentName),
        lineId: safeStr(formData.lineId),
        thumb: safeStr(formData.thumb),
        images: Array.isArray(formData.images) ? formData.images : []
      };

      const cleanSpecs = specs.map(s => ({ id: safeStr(s.id), label: safeStr(s.label), value: safeStr(s.value) }));
      const cleanFeatures = features.map(f => ({ id: safeStr(f.id), title: safeStr(f.title), desc: safeStr(f.desc) }));
      const cleanProgress = progressList.map(p => ({ id: safeStr(p.id), date: safeStr(p.date), status: safeStr(p.status) }));
      
      // 淨化環境列表
      const cleanEnvList = envList.map(e => ({
        id: safeStr(e.id),
        title: safeStr(e.title),
        desc: safeStr(e.desc),
        image: safeStr(e.image),
        link: safeStr(e.link)
      }));

      const payload = {
        basicInfo: cleanBasicInfo,
        specs: cleanSpecs,
        features: cleanFeatures,
        concept: { 
            title: safeStr(concept.title), 
            content: safeStr(concept.content),
            image: safeStr(concept.image) 
        },
        environmentList: cleanEnvList, // 改存列表
        progressHistory: cleanProgress,
        images: cleanBasicInfo.images,
        theme: { 
          primaryColor: safeStr(theme.primaryColor) || '#ea580c', 
          bgColor: safeStr(theme.bgColor) || '#f1f5f9', 
          textColor: safeStr(theme.textColor) || '#1e293b' 
        },
        updatedAt: new Date()
      };

      if (editId) {
        await updateDoc(doc(db, "properties", editId), payload);
        alert("更新成功！");
      } else {
        await addDoc(collection(db, "properties"), payload);
        alert("新增成功！");
      }
      window.location.reload();

    } catch (err) {
      if (err.message.includes("exceeds")) alert("存檔失敗：圖片總量太大，請減少圖片或刪除舊圖");
      else alert(`存檔失敗：${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = "w-full bg-white border border-slate-300 text-slate-800 p-2 text-sm focus:outline-none focus:border-orange-500 rounded-sm";
  const labelStyle = "block text-[10px] font-bold text-slate-500 mb-1 tracking-wider uppercase";

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-slate-100 text-slate-800 font-sans overflow-hidden">
      
      {/* 左側列表 */}
      <div className="w-full lg:w-64 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-4 border-b font-bold text-slate-700 flex justify-between items-center">
            <span>案場列表</span>
            <button onClick={resetForm} className="bg-orange-500 text-white text-xs px-2 py-1 rounded">+ 新增</button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {properties.map(p => (
            <div key={p.id} onClick={() => loadEdit(p)} className={`p-3 border cursor-pointer hover:bg-slate-50 ${editId === p.id ? 'border-orange-500 bg-orange-50' : 'border-slate-200'}`}>
              <div className="font-bold text-sm">{p.basicInfo.title}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 中間編輯區 */}
      <div className="flex-1 flex flex-col bg-slate-50">
        <div className="p-4 border-b bg-white flex justify-between items-center">
          <h1 className="font-bold">{editId ? '編輯模式' : '新增模式'}</h1>
          <button onClick={handleSubmit} disabled={loading || compressing} className="bg-slate-800 text-white px-6 py-2 text-sm font-bold hover:bg-black disabled:bg-gray-400">
            {compressing ? '圖片處理中...' : loading ? '存檔中...' : '儲存專案'}
          </button>
        </div>

        <div className="flex border-b bg-white text-sm">
          {['content', 'style'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-3 uppercase font-bold ${activeTab === tab ? 'border-b-2 border-orange-500 text-orange-600' : 'text-slate-400'}`}>
              {tab === 'content' ? '內容編輯' : '風格設定'}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-8 max-w-4xl mx-auto w-full">
          {activeTab === 'content' && (
            <div className="space-y-12 pb-20">
              
              {/* 基本資料 */}
              <section className="space-y-4">
                <h3 className="font-bold text-lg border-l-4 border-orange-500 pl-2">基本資料</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2"><label className={labelStyle}>標題</label><input value={formData.title} onChange={e=>setFormData({...formData, title:e.target.value})} className={inputStyle}/></div>
                  <div className="col-span-2"><label className={labelStyle}>副標題</label><input value={formData.subtitle} onChange={e=>setFormData({...formData, subtitle:e.target.value})} className={inputStyle}/></div>
                  <div><label className={labelStyle}>價格</label><input value={formData.price} onChange={e=>setFormData({...formData, price:e.target.value})} className={inputStyle}/></div>
                  <div><label className={labelStyle}>地址</label><input value={formData.address} onChange={e=>setFormData({...formData, address:e.target.value})} className={inputStyle}/></div>
                  <div><label className={labelStyle}>電話</label><input value={formData.agentPhone} onChange={e=>setFormData({...formData, agentPhone:e.target.value})} className={inputStyle}/></div>
                  <div><label className={labelStyle}>經紀人</label><input value={formData.agentName} onChange={e=>setFormData({...formData, agentName:e.target.value})} className={inputStyle}/></div>
                  <div className="col-span-2"><label className={labelStyle}>封面圖</label><div className="flex gap-2"><input type="file" onChange={e=>handleUpload(e, (url)=>setFormData({...formData, thumb: url}))} className="text-xs"/>{formData.thumb && <img src={formData.thumb} className="h-10 w-10 border"/>}</div></div>
                </div>
              </section>

              {/* 案場理念 (新增圖片) */}
              <section className="space-y-4">
                <h3 className="font-bold text-lg border-l-4 border-orange-500 pl-2">案場理念</h3>
                <input value={concept.title} onChange={e=>setConcept({...concept, title:e.target.value})} className={inputStyle} placeholder="標題" />
                <textarea value={concept.content} onChange={e=>setConcept({...concept, content:e.target.value})} className={`${inputStyle} h-32`} placeholder="內容..." />
                <div>
                   <label className={labelStyle}>理念配圖 (新增)</label>
                   <div className="flex gap-2">
                     <input type="file" onChange={e=>handleUpload(e, (url)=>setConcept({...concept, image: url}))} className="text-xs"/>
                     {concept.image && <img src={concept.image} className="h-10 w-10 object-cover border"/>}
                   </div>
                </div>
              </section>

              {/* 周遭環境 (改列表) */}
              <section className="space-y-4">
                <div className="flex justify-between items-center">
                   <h3 className="font-bold text-lg border-l-4 border-orange-500 pl-2">周遭環境 (1~3項)</h3>
                   <button type="button" onClick={()=>setEnvList([...envList, {id: Date.now(), title:"", desc:"", image:"", link:""}])} className="text-orange-500 text-xs flex items-center gap-1"><Plus size={14}/> 新增環境</button>
                </div>
                {envList.map((env, i) => (
                   <div key={i} className="bg-slate-50 border p-4 rounded-md space-y-2 relative">
                      <button onClick={()=>setEnvList(envList.filter((_,idx)=>idx!==i))} className="absolute top-2 right-2 text-slate-400 hover:text-red-500"><Trash2 size={16}/></button>
                      <input value={env.title} onChange={e=>{const x=[...envList];x[i].title=e.target.value;setEnvList(x)}} className={inputStyle} placeholder="標題 (例: 交通機能)" />
                      <textarea value={env.desc} onChange={e=>{const x=[...envList];x[i].desc=e.target.value;setEnvList(x)}} className={inputStyle} placeholder="描述..." />
                      <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label className={labelStyle}>配圖</label>
                            <div className="flex gap-2"><input type="file" onChange={e=>handleUpload(e, (url)=>{const x=[...envList];x[i].image=url;setEnvList(x)})} className="text-xs"/>{env.image && <img src={env.image} className="h-8 w-8"/>}</div>
                         </div>
                         <div>
                            <label className={labelStyle}>連結</label>
                            <input value={env.link} onChange={e=>{const x=[...envList];x[i].link=e.target.value;setEnvList(x)}} className={inputStyle} placeholder="URL" />
                         </div>
                      </div>
                   </div>
                ))}
              </section>

              {/* 工程進度 */}
              <section className="space-y-4">
                <div className="flex justify-between items-center"><h3 className="font-bold text-lg border-l-4 border-orange-500 pl-2">工程進度</h3><button type="button" onClick={()=>setProgressList([...progressList, {id: Date.now(), date:'', status:''}])} className="text-orange-500 text-xs flex items-center gap-1"><Plus size={14}/> 新增</button></div>
                {progressList.map((p, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <input type="date" value={p.date} onChange={e=>{const x=[...progressList];x[i].date=e.target.value;setProgressList(x)}} className="w-1/3 border p-2 text-sm"/>
                    <input value={p.status} onChange={e=>{const x=[...progressList];x[i].status=e.target.value;setProgressList(x)}} className="w-full border p-2 text-sm" placeholder="進度內容"/>
                    <button onClick={()=>setProgressList(progressList.filter((_,idx)=>idx!==i))} className="text-slate-400 hover:text-red-500"><Trash2 size={16}/></button>
                  </div>
                ))}
              </section>

              {/* 相簿 */}
              <section className="space-y-4">
                 <h3 className="font-bold text-lg border-l-4 border-orange-500 pl-2">相簿</h3>
                 <input type="file" multiple onChange={(e) => {
                      const file = e.target.files[0];
                      if(file) handleUpload(e, (url) => setFormData(prev => ({...prev, images: [...prev.images, url]})));
                    }} className="text-xs"/>
                 <div className="grid grid-cols-4 gap-2">
                    {formData.images.map((img, idx) => (
                      <div key={idx} className="relative aspect-square bg-gray-200">
                        <img src={img} className="w-full h-full object-cover"/>
                        <button onClick={() => setFormData(prev => ({...prev, images: prev.images.filter((_, i) => i !== idx)}))} className="absolute top-0 right-0 bg-red-500 text-white p-1"><X size={12}/></button>
                      </div>
                    ))}
                 </div>
              </section>

              {/* Specs & Features */}
              <section className="space-y-4">
                  <div className="flex justify-between"><h3 className="font-bold text-lg border-l-4 border-orange-500 pl-2">規格 & 特色</h3><div className="flex gap-2"><button type="button" onClick={()=>setSpecs([...specs, {id: Date.now(), label:'', value:''}])} className="text-xs text-orange-500">+ 規格</button><button type="button" onClick={()=>setFeatures([...features, {id: Date.now(), title:'', desc:''}])} className="text-xs text-orange-500">+ 特色</button></div></div>
                  {specs.map((s, i) => (<div key={i} className="flex gap-2 mb-2"><input value={s.label} onChange={e=>{const x=[...specs];x[i].label=e.target.value;setSpecs(x)}} className="w-1/3 border p-2" placeholder="規格名"/><input value={s.value} onChange={e=>{const x=[...specs];x[i].value=e.target.value;setSpecs(x)}} className="w-full border p-2" placeholder="數值"/><button onClick={()=>setSpecs(specs.filter((_,idx)=>idx!==i))}><X size={16}/></button></div>))}
                  {features.map((f, i) => (<div key={i} className="flex gap-2 mb-2"><input value={f.title} onChange={e=>{const x=[...features];x[i].title=e.target.value;setFeatures(x)}} className="w-1/3 border p-2" placeholder="特色名"/><input value={f.desc} onChange={e=>{const x=[...features];x[i].desc=e.target.value;setFeatures(x)}} className="w-full border p-2" placeholder="描述"/><button onClick={()=>setFeatures(features.filter((_,idx)=>idx!==i))}><X size={16}/></button></div>))}
              </section>

            </div>
          )}
          {activeTab === 'style' && (
            <div className="space-y-6">
              <div><label className={labelStyle}>主色調</label><input type="color" value={theme.primaryColor} onChange={e=>setTheme({...theme, primaryColor:e.target.value})} className="h-10 w-full"/></div>
              <div><label className={labelStyle}>背景色 (建議淺灰)</label><input type="color" value={theme.bgColor} onChange={e=>setTheme({...theme, bgColor:e.target.value})} className="h-10 w-full"/></div>
              <div><label className={labelStyle}>文字色</label><input type="color" value={theme.textColor} onChange={e=>setTheme({...theme, textColor:e.target.value})} className="h-10 w-full"/></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Admin;