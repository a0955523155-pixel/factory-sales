import React, { useState, useEffect } from 'react';
import { db, storage } from '../firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Plus, Trash2, Save, Upload, X, MapPin, GripVertical, Smartphone, RefreshCw } from 'lucide-react';

// 引入拖曳套件
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// --- 子元件：可拖曳的輸入列 ---
const SortableItem = ({ id, children }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  
  return (
    <div ref={setNodeRef} style={style} {...attributes} className="flex gap-2 items-end mb-3 bg-slate-800/50 p-2 rounded border border-slate-700">
      <div {...listeners} className="cursor-grab text-slate-500 hover:text-orange-500 pt-3">
        <GripVertical size={20} />
      </div>
      {children}
    </div>
  );
};

const Admin = () => {
  // --- 狀態管理 ---
  const [properties, setProperties] = useState([]); // 左側列表
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editId, setEditId] = useState(null); // 目前正在編輯的 ID (null 代表新增模式)

  // 表單資料
  const [formData, setFormData] = useState({
    title: '', subtitle: '', price: '', address: '', agentPhone: '', 
    thumb: '', images: []
  });
  const [specs, setSpecs] = useState([{ id: 's1', label: "總建坪", value: "" }]);
  const [features, setFeatures] = useState([{ id: 'f1', title: "特色標題", desc: "" }]);

  // --- 初始化：讀取現有案場列表 ---
  const fetchProperties = async () => {
    const querySnapshot = await getDocs(collection(db, "properties"));
    const list = [];
    querySnapshot.forEach((doc) => list.push({ id: doc.id, ...doc.data() }));
    setProperties(list);
  };

  useEffect(() => { fetchProperties(); }, []);

  // --- 功能：圖片上傳 ---
  const handleImageUpload = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const storageRef = ref(storage, `images/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      
      if (field === 'thumb') {
        setFormData(prev => ({ ...prev, thumb: url }));
      } else {
        // 多圖上傳 (相簿)
        setFormData(prev => ({ ...prev, images: [...prev.images, url] }));
      }
    } catch (error) {
      console.error("Upload failed", error);
      alert("圖片上傳失敗");
    }
    setUploading(false);
  };

  // --- 功能：刪除案場 ---
  const handleDelete = async (id) => {
    if (!window.confirm("確定要刪除這個案場嗎？刪除後無法復原！")) return;
    await deleteDoc(doc(db, "properties", id));
    fetchProperties(); // 重新整理列表
    if (editId === id) resetForm();
  };

  // --- 功能：載入編輯 ---
  const loadEdit = (item) => {
    setEditId(item.id);
    setFormData(item.basicInfo);
    // 確保 spec/feature 有 id 供拖曳使用，若舊資料沒有 id 則補上
    setSpecs(item.specs.map((s, i) => ({ ...s, id: s.id || `s-${i}` })));
    setFeatures(item.features.map((f, i) => ({ ...f, id: f.id || `f-${i}` })));
  };

  // --- 功能：重置表單 ---
  const resetForm = () => {
    setEditId(null);
    setFormData({ title: '', subtitle: '', price: '', address: '', agentPhone: '', thumb: '', images: [] });
    setSpecs([{ id: 'new-s1', label: "", value: "" }]);
    setFeatures([{ id: 'new-f1', title: "", desc: "" }]);
  };

  // --- 功能：拖曳排序邏輯 ---
  const handleDragEnd = (event, list, setList) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      setList((items) => {
        const oldIndex = items.findIndex(i => i.id === active.id);
        const newIndex = items.findIndex(i => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  // --- 功能：送出存檔 ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const payload = {
      basicInfo: formData,
      specs: specs.map(({ id, ...rest }) => rest), // 存檔時移除拖曳用的 id
      features: features.map(({ id, ...rest }) => rest),
      images: formData.images,
      updatedAt: new Date()
    };

    try {
      if (editId) {
        // 更新模式
        await updateDoc(doc(db, "properties", editId), payload);
        alert("更新成功！");
      } else {
        // 新增模式
        await addDoc(collection(db, "properties"), payload);
        alert("新增成功！");
      }
      fetchProperties();
      resetForm();
    } catch (error) {
      console.error(error);
      alert("存檔失敗");
    }
    setLoading(false);
  };

  // --- 樣式變數 ---
  const inputStyle = "w-full bg-slate-900 border border-slate-600 text-gray-200 p-2 text-sm focus:outline-none focus:border-orange-500 rounded-none transition-colors";
  const labelStyle = "block text-[10px] font-bold text-slate-400 mb-1 tracking-wider uppercase";

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-slate-950 text-gray-300 font-mono overflow-hidden">
      
      {/* 1. 左側列表 (Sidebar) */}
      <div className="w-full lg:w-64 bg-slate-900 border-r border-slate-800 flex flex-col">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center">
          <h2 className="font-bold text-white">案場列表</h2>
          <button onClick={resetForm} className="text-xs bg-orange-600 text-white px-2 py-1 rounded hover:bg-orange-500">
            + 新增
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {properties.map(p => (
            <div key={p.id} onClick={() => loadEdit(p)} 
              className={`p-3 border cursor-pointer hover:bg-slate-800 transition relative group ${editId === p.id ? 'border-orange-500 bg-slate-800' : 'border-slate-800 bg-slate-900'}`}>
              <h3 className="font-bold text-sm text-white truncate">{p.basicInfo.title}</h3>
              <p className="text-xs text-slate-500">{p.basicInfo.price}</p>
              <button onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }} 
                className="absolute right-2 top-3 text-slate-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 2. 中間編輯區 (Main Form) */}
      <div className="flex-1 overflow-y-auto p-6 bg-slate-950">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white uppercase tracking-widest">
            {editId ? `EDITING: ${formData.title}` : 'CREATE NEW ASSET'}
          </h1>
          <button onClick={handleSubmit} disabled={loading} className="bg-orange-600 hover:bg-orange-500 text-white px-6 py-2 font-bold flex items-center gap-2">
            <Save size={18} /> {loading ? "SAVING..." : "SAVE PROJECT"}
          </button>
        </div>

        <form className="space-y-8 max-w-3xl">
          {/* 圖片上傳區 */}
          <section className="bg-slate-900 p-4 border border-slate-800">
             <label className={labelStyle}>封面縮圖 (Cover Image)</label>
             <div className="flex gap-4 items-center mb-4">
               <div className="w-32 h-24 bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden relative">
                 {formData.thumb ? <img src={formData.thumb} className="w-full h-full object-cover" /> : <span className="text-xs text-slate-600">No Image</span>}
                 {uploading && <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-xs">Uploading...</div>}
               </div>
               <label className="cursor-pointer bg-slate-800 border border-slate-600 hover:border-orange-500 text-slate-300 px-4 py-2 flex items-center gap-2 text-sm transition">
                 <Upload size={16} /> 上傳封面
                 <input type="file" hidden onChange={(e) => handleImageUpload(e, 'thumb')} />
               </label>
             </div>
          </section>

          {/* 基本資料 */}
          <section className="grid grid-cols-2 gap-4">
             <div className="col-span-2">
               <label className={labelStyle}>標題 (Title)</label>
               <input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className={inputStyle} />
             </div>
             <div><label className={labelStyle}>價格 (Price)</label><input value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className={inputStyle} /></div>
             <div><label className={labelStyle}>地址 (Address)</label><input value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className={inputStyle} /></div>
             <div><label className={labelStyle}>經紀人 (Agent)</label><input value={formData.agentPhone} onChange={e => setFormData({...formData, agentPhone: e.target.value})} className={inputStyle} /></div>
          </section>

          {/* 可拖曳規格 (Specs) */}
          <section>
            <div className="flex justify-between mb-2">
              <label className={labelStyle}>規格清單 (Drag to Reorder)</label>
              <button type="button" onClick={() => setSpecs([...specs, { id: `new-${Date.now()}`, label: "", value: "" }])} className="text-xs text-orange-500 hover:text-white">+ Add Spec</button>
            </div>
            <DndContext collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, specs, setSpecs)}>
              <SortableContext items={specs} strategy={verticalListSortingStrategy}>
                {specs.map((item, idx) => (
                  <SortableItem key={item.id} id={item.id}>
                    <input value={item.label} onChange={e => {const n=[...specs]; n[idx].label=e.target.value; setSpecs(n)}} className={`${inputStyle} w-1/3`} placeholder="Label" />
                    <input value={item.value} onChange={e => {const n=[...specs]; n[idx].value=e.target.value; setSpecs(n)}} className={inputStyle} placeholder="Value" />
                    <button type="button" onClick={() => setSpecs(specs.filter(s => s.id !== item.id))} className="p-2 hover:text-red-500"><X size={18} /></button>
                  </SortableItem>
                ))}
              </SortableContext>
            </DndContext>
          </section>

          {/* 可拖曳特色 (Features) */}
          <section>
            <div className="flex justify-between mb-2">
              <label className={labelStyle}>特色清單</label>
              <button type="button" onClick={() => setFeatures([...features, { id: `new-f-${Date.now()}`, title: "", desc: "" }])} className="text-xs text-orange-500 hover:text-white">+ Add Feature</button>
            </div>
            <DndContext collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, features, setFeatures)}>
              <SortableContext items={features} strategy={verticalListSortingStrategy}>
                {features.map((item, idx) => (
                  <SortableItem key={item.id} id={item.id}>
                    <input value={item.title} onChange={e => {const n=[...features]; n[idx].title=e.target.value; setFeatures(n)}} className={`${inputStyle} w-1/3`} placeholder="Title" />
                    <input value={item.desc} onChange={e => {const n=[...features]; n[idx].desc=e.target.value; setFeatures(n)}} className={inputStyle} placeholder="Description" />
                    <button type="button" onClick={() => setFeatures(features.filter(f => f.id !== item.id))} className="p-2 hover:text-red-500"><X size={18} /></button>
                  </SortableItem>
                ))}
              </SortableContext>
            </DndContext>
          </section>
        </form>
      </div>

      {/* 3. 右側即時預覽 (Live Preview) */}
      <div className="hidden xl:block w-[400px] bg-black border-l border-slate-800 p-6 overflow-y-auto">
        <div className="flex items-center gap-2 text-slate-500 mb-4 justify-center">
          <Smartphone size={20} />
          <span className="text-xs tracking-widest uppercase">Live Mobile Preview</span>
        </div>
        
        {/* 模擬手機外框 */}
        <div className="border-[8px] border-slate-800 rounded-[3rem] overflow-hidden bg-slate-950 h-[700px] relative shadow-2xl">
          {/* 模擬手機內容 */}
          <div className="h-full overflow-y-auto scrollbar-hide">
            {/* Cover */}
            <div className="h-48 bg-slate-800 relative">
              {formData.thumb ? <img src={formData.thumb} className="w-full h-full object-cover" /> : <div className="flex items-center justify-center h-full text-slate-600 text-xs">No Cover</div>}
              <div className="absolute bottom-0 right-0 bg-orange-600 text-white text-xs font-bold px-3 py-1">{formData.price || 'Price'}</div>
            </div>
            {/* Body */}
            <div className="p-4">
              <h2 className="text-white font-bold text-lg leading-tight mb-1">{formData.title || 'Property Title'}</h2>
              <div className="flex items-center gap-1 text-slate-500 text-xs mb-4">
                <MapPin size={10} /> {formData.address || 'Location'}
              </div>
              
              {/* Specs Grid */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                {specs.map((s, i) => (
                  <div key={i} className="bg-slate-900 border border-slate-800 p-2">
                    <p className="text-[10px] text-slate-500 uppercase">{s.label}</p>
                    <p className="text-sm font-bold text-white">{s.value}</p>
                  </div>
                ))}
              </div>

              {/* Features List */}
              <div className="space-y-2">
                {features.map((f, i) => (
                   <div key={i} className="flex gap-3 items-start border-b border-slate-900 pb-2">
                     <div className="w-2 h-2 rounded-full bg-orange-500 mt-1.5 flex-shrink-0" />
                     <div>
                       <h4 className="text-xs font-bold text-white">{f.title}</h4>
                       <p className="text-[10px] text-slate-500">{f.desc}</p>
                     </div>
                   </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Admin;