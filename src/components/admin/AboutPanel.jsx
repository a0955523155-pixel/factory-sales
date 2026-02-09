import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { safeStr, compressImage } from '../../utils/adminHelpers';
import { Upload } from 'lucide-react';

const AboutPanel = () => {
  const [aboutData, setAboutData] = useState({ title: "綠芽團隊", subtitle: "", content: "", image: "", stats: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchAbout = async () => { 
        try { const docSnap = await getDoc(doc(db, "settings", "about")); if (docSnap.exists()) setAboutData(docSnap.data()); } catch (e) {} 
    };
    fetchAbout();
  }, []);

  const handleUpload = async (e, callback) => { 
      const file = e.target.files[0]; if (!file) return; 
      try { const compressed = await compressImage(file); callback(compressed); } catch (e) {} 
  };

  const handleAboutSubmit = async () => { 
      setLoading(true); 
      await setDoc(doc(db, "settings", "about"), aboutData); 
      alert("關於我們已更新！"); setLoading(false); 
  };

  const inputStyle = "w-full bg-white border border-slate-300 text-slate-800 p-3 md:p-2.5 text-base md:text-sm focus:outline-none focus:border-orange-500 rounded-lg shadow-sm transition placeholder:text-slate-300";
  const labelStyle = "block text-xs font-bold text-slate-500 mb-1.5 tracking-wider uppercase";

  return (
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
                    {aboutData.stats && aboutData.stats.map((stat, i) => (
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
  );
};

export default AboutPanel;