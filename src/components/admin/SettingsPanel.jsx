import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { safeStr, compressImage } from '../../utils/adminHelpers';
import { Bell } from 'lucide-react';

const SettingsPanel = () => {
  const [globalSettings, setGlobalSettings] = useState({ 
    siteName: "Factory Pro", heroTitleCN: "", heroTitleEN: "", 
    contactPhone: "", fbLink: "", igLink: "", lineLink: "", 
    iconFB: "", iconIG: "", iconLINE: "",
    notificationWebhook: "" // 新增欄位
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchGlobalSettings = async () => { try { const docSnap = await getDoc(doc(db, "settings", "global")); if (docSnap.exists()) setGlobalSettings(docSnap.data()); } catch (e) {} };
    fetchGlobalSettings();
  }, []);

  const handleUpload = async (e, callback) => { 
      const file = e.target.files[0]; if (!file) return; 
      try { const compressed = await compressImage(file); callback(compressed); } catch (e) {} 
  };

  const handleSaveSettings = async () => { 
      setLoading(true); await setDoc(doc(db, "settings", "global"), globalSettings); 
      alert("已更新"); setLoading(false); 
  };

  const inputStyle = "w-full bg-white border border-slate-300 text-slate-800 p-3 md:p-2.5 text-base md:text-sm focus:outline-none focus:border-orange-500 rounded-lg shadow-sm transition placeholder:text-slate-300";
  const labelStyle = "block text-xs font-bold text-slate-500 mb-1.5 tracking-wider uppercase";

  return (
    <div className="p-6 md:p-10 max-w-3xl mx-auto w-full overflow-y-auto">
        <h1 className="text-2xl md:text-3xl font-black mb-8">網站全域設定</h1>
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 space-y-6">
            <div><label className={labelStyle}>左上角網站名稱</label><input value={globalSettings.siteName} onChange={e=>setGlobalSettings({...globalSettings, siteName: e.target.value})} className={inputStyle} /></div>
            
            {/* 通知設定 */}
            <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
               <h3 className="font-bold text-orange-800 mb-2 flex items-center gap-2"><Bell size={16}/> 通知設定 (Webhook)</h3>
               <label className={labelStyle}>Make.com / Zapier Webhook URL</label>
               <input value={globalSettings.notificationWebhook || ""} onChange={e=>setGlobalSettings({...globalSettings, notificationWebhook: e.target.value})} className={inputStyle} placeholder="https://hook.us1.make.com/..." />
               <p className="text-xs text-slate-400 mt-1">填入後，當有新客戶諮詢時，系統會自動發送 POST 請求到此網址。</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div><label className={labelStyle}>首頁大標題 (中文)</label><input value={globalSettings.heroTitleCN} onChange={e=>setGlobalSettings({...globalSettings, heroTitleCN: e.target.value})} className={inputStyle} /></div><div><label className={labelStyle}>首頁大標題 (英文)</label><input value={globalSettings.heroTitleEN} onChange={e=>setGlobalSettings({...globalSettings, heroTitleEN: e.target.value})} className={inputStyle} /></div></div>
            <div><label className={labelStyle}>全站聯絡電話</label><input value={globalSettings.contactPhone} onChange={e=>setGlobalSettings({...globalSettings, contactPhone: e.target.value})} className={inputStyle} /></div>
            <h3 className="font-black border-l-4 border-orange-500 pl-2 mt-4">社群連結</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className={labelStyle}>FB 連結</label><input value={globalSettings.fbLink} onChange={e=>setGlobalSettings({...globalSettings, fbLink: e.target.value})} className={inputStyle} /></div>
                <div><label className={labelStyle}>FB 圖示</label><input type="file" onChange={e=>handleUpload(e, (url)=>setGlobalSettings({...globalSettings, iconFB: url}))} className="text-xs"/>{globalSettings.iconFB && <img src={globalSettings.iconFB} className="h-8 w-8 rounded-full border"/>}</div>
                <div><label className={labelStyle}>IG 連結</label><input value={globalSettings.igLink} onChange={e=>setGlobalSettings({...globalSettings, igLink: e.target.value})} className={inputStyle} /></div>
                <div><label className={labelStyle}>IG 圖示</label><input type="file" onChange={e=>handleUpload(e, (url)=>setGlobalSettings({...globalSettings, iconIG: url}))} className="text-xs"/>{globalSettings.iconIG && <img src={globalSettings.iconIG} className="h-8 w-8 rounded-full border"/>}</div>
                <div><label className={labelStyle}>LINE 連結</label><input value={globalSettings.lineLink} onChange={e=>setGlobalSettings({...globalSettings, lineLink: e.target.value})} className={inputStyle} /></div>
                <div><label className={labelStyle}>LINE 圖示</label><input type="file" onChange={e=>handleUpload(e, (url)=>setGlobalSettings({...globalSettings, iconLINE: url}))} className="text-xs"/>{globalSettings.iconLINE && <img src={globalSettings.iconLINE} className="h-8 w-8 rounded-full border"/>}</div>
            </div>
            <button onClick={handleSaveSettings} disabled={loading} className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-orange-600 transition shadow-lg mt-4">{loading ? "處理中..." : "儲存設定"}</button>
        </div>
    </div>
  );
};

export default SettingsPanel;