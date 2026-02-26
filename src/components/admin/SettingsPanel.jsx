import React, { useState, useEffect } from 'react';
import { db, storage } from '../../firebase'; 
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Save, Image as ImageIcon, Loader2 } from 'lucide-react';

const SettingsPanel = () => {
  const [settings, setSettings] = useState({
    heroTitleCN: '未來工廠',
    heroTitleEN: 'FUTURE FACTORY',
    heroBgUrl: '' // 新增這行：用來儲存首頁背景圖的網址
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // 1. 畫面載入時，去資料庫抓目前的設定
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, 'settings', 'global');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setSettings(prev => ({ ...prev, ...docSnap.data() }));
        }
      } catch (error) {
        console.error("讀取設定失敗:", error);
      }
    };
    fetchSettings();
  }, []);

  // 2. 處理圖片上傳到 Firebase Storage
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // 建議檢查檔案大小 (限制在 2MB 以內最佳)
    if (file.size > 2 * 1024 * 1024) {
      alert("圖片檔案過大，請壓縮至 2MB 以內以確保前台載入速度！");
      return;
    }

    setUploading(true);
    try {
      // 在 Storage 中建立專屬資料夾與檔名
      const fileRef = ref(storage, `settings/hero-bg-${Date.now()}.jpg`);
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);
      
      // 更新本機狀態 (還沒存進資料庫喔)
      setSettings({ ...settings, heroBgUrl: url });
      alert('圖片上傳成功！請記得點擊最下方的「儲存全域設定」來生效。');
    } catch (error) {
      console.error('上傳圖片失敗:', error);
      alert('上傳失敗，請檢查網路狀態。');
    } finally {
      setUploading(false);
    }
  };

  // 3. 把所有設定存進 Firestore 資料庫
  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'global'), settings, { merge: true });
      alert('設定已成功儲存！前台首頁已經更新。');
    } catch (error) {
      console.error('儲存設定失敗:', error);
      alert('儲存失敗，請確認您的管理員權限。');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-black text-slate-800">全域系統設定</h2>
        <button 
          onClick={handleSave} 
          disabled={saving || uploading}
          className="flex items-center gap-2 bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-slate-800 transition disabled:opacity-50"
        >
          {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          {saving ? '儲存中...' : '儲存全域設定'}
        </button>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 space-y-8">
        
        {/* === 首頁背景圖設定區塊 === */}
        <div>
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <ImageIcon className="text-orange-500" size={20} />
            首頁大看板背景圖
          </h3>
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="w-full md:w-1/2 aspect-video bg-slate-100 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden relative">
              {settings.heroBgUrl ? (
                <img src={settings.heroBgUrl} alt="預覽" className="w-full h-full object-cover" />
              ) : (
                <span className="text-slate-400 font-bold">尚未設定圖片</span>
              )}
              {uploading && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                  <Loader2 className="animate-spin text-orange-500" size={32} />
                </div>
              )}
            </div>
            <div className="flex-1 space-y-2">
              <p className="text-sm text-slate-500 mb-4 leading-relaxed">
                建議上傳高畫質且檔案大小在 <strong className="text-orange-600">1MB 以內</strong> 的圖片。<br/>
                最佳比例為 16:9 橫圖 (例如：1920x1080)。
              </p>
              <label className="cursor-pointer bg-white border-2 border-orange-500 text-orange-600 px-6 py-2.5 rounded-xl font-bold hover:bg-orange-50 transition inline-block">
                選擇並上傳新照片
                <input 
                  type="file" 
                  accept="image/jpeg, image/png, image/webp" 
                  className="hidden" 
                  onChange={handleImageUpload} 
                />
              </label>
            </div>
          </div>
        </div>

        <hr className="border-slate-100" />

        {/* === 首頁標題設定區塊 === */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">首頁主標題 (中文)</label>
            <input 
              type="text" 
              value={settings.heroTitleCN} 
              onChange={e => setSettings({...settings, heroTitleCN: e.target.value})}
              className="w-full p-3 border rounded-xl bg-slate-50 focus:border-orange-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">首頁副標題 (英文)</label>
            <input 
              type="text" 
              value={settings.heroTitleEN} 
              onChange={e => setSettings({...settings, heroTitleEN: e.target.value})}
              className="w-full p-3 border rounded-xl bg-slate-50 focus:border-orange-500 outline-none font-mono"
            />
          </div>
        </div>

      </div>
    </div>
  );
};

export default SettingsPanel;