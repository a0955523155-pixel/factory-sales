import React, { useEffect, useState } from 'react';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Globe, TrendingUp, Trash2, Loader2, Target, MousePointerClick, PhoneCall } from 'lucide-react';

const DashboardPanel = () => {
  const [stats, setStats] = useState({ 
    today: 0, week: 0, month: 0, total: 0, 
    sources: {}, topPages: [], 
    convRate: 0, 
    convDetails: { form: 0, phone: 0, line: 0 } 
  });
  const [isClearing, setIsClearing] = useState(false);

  const fetchAnalytics = async () => {
    try {
      const snap = await getDocs(collection(db, "page_views"));
      const data = [];
      snap.forEach(doc => data.push({ id: doc.id, ...doc.data() }));
      calculateStats(data);
    } catch (e) { console.error("讀取數據失敗:", e); }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const calculateStats = (data) => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const oneWeekAgo = new Date(); oneWeekAgo.setDate(now.getDate() - 7);
    const oneMonthAgo = new Date(); oneMonthAgo.setMonth(now.getMonth() - 1);

    let today = 0, week = 0, month = 0, total = 0;
    let sourceMap = {};
    let pageMap = {};
    let conversions = { form: 0, phone: 0, line: 0 };

    data.forEach(d => {
      const viewDate = d.timestamp ? d.timestamp.toDate() : new Date();
      const viewDateStr = viewDate.toISOString().split('T')[0];

      const isConversion = d.path?.includes("/conversion/");

      if (!isConversion) {
        total += 1;
        if (viewDateStr === todayStr) today += 1;
        if (viewDate >= oneWeekAgo) week += 1;
        if (viewDate >= oneMonthAgo) month += 1;

        // --- 流量來源翻譯 ---
        let src = d.source || "直接輸入網址/未知";
        // 如果來源網址包含亂碼也進行解碼
        try { src = decodeURIComponent(src); } catch(e) {}
        sourceMap[src] = (sourceMap[src] || 0) + 1;

        // --- 網址路徑翻譯機 ---
        let rawPath = d.path || "/";
        let decodedPath = "/";
        try { 
          // 這裡就是關鍵：把 %E... 轉回中文，並去掉 ?fbclid 等追蹤參數
          decodedPath = decodeURIComponent(rawPath).split('?')[0]; 
        } catch (e) {
          decodedPath = rawPath;
        }

        let pageTitle = decodedPath;
        let pageType = "一般頁面";

        if (decodedPath === "/") { 
          pageTitle = "綠芽團隊首頁"; 
          pageType = "首頁"; 
        } else if (decodedPath === "/works") { 
          pageTitle = "經典作品列表"; 
          pageType = "列表頁"; 
        } else if (decodedPath === "/contact") { 
          pageTitle = "聯絡我們"; 
          pageType = "表單頁"; 
        } else if (decodedPath.includes("/property/")) { 
          // 🏠 翻譯案場：將 /property/大成工業城 轉為 廠房物件 (大成工業城)
          const propertyName = decodedPath.replace('/property/', '');
          pageTitle = `🏠 案場：${propertyName}`; 
          pageType = "物件詳情"; 
        } else if (decodedPath.includes("/article/")) {
          pageTitle = `📝 文章內容 (${decodedPath.replace('/article/', '')})`;
          pageType = "新聞文章";
        }

        // 使用解碼後的路徑作為 key，避免亂碼跟中文重複計算
        if (!pageMap[decodedPath]) pageMap[decodedPath] = { title: pageTitle, type: pageType, count: 0 };
        pageMap[decodedPath].count += 1;

      } else {
        if (d.path === "/conversion/form_submit") conversions.form += 1;
        if (d.path === "/conversion/phone_call") conversions.phone += 1;
        if (d.path === "/conversion/line_click") conversions.line += 1;
      }
    });

    const totalConversions = conversions.form + conversions.phone + conversions.line;
    const convRate = total > 0 ? ((totalConversions / total) * 100).toFixed(2) : 0;
    const topPages = Object.values(pageMap).sort((a, b) => b.count - a.count).slice(0, 10);

    setStats({ today, week, month, total, sources: sourceMap, topPages, convRate, convDetails: conversions });
  };

  const handleClearStats = async () => {
    const confirmText = window.prompt("⚠️ 警告：這將會清空「數據中心」的所有瀏覽紀錄！\n請輸入「0000」來確認執行：");
    if (confirmText !== "0000") return alert("密碼錯誤，已取消。");

    setIsClearing(true);
    try {
      const snap = await getDocs(collection(db, "page_views"));
      const deletePromises = snap.docs.map(document => deleteDoc(doc(db, "page_views", document.id)));
      await Promise.all(deletePromises);
      alert("✅ 數據已成功歸零！");
      setStats({ today: 0, week: 0, month: 0, total: 0, sources: {}, topPages: [], convRate: 0, convDetails: {form:0, phone:0, line:0} });
    } catch (error) { console.error(error); }
    setIsClearing(false);
  };

  const StatCard = ({ label, value, color = "text-slate-800", icon: Icon }) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-center">
      <div className="text-slate-400 text-xs font-bold uppercase mb-2 flex items-center gap-1">
        {Icon && <Icon size={14} />} {label}
      </div>
      <div className={`text-3xl md:text-4xl font-black ${color}`}>{value}</div>
    </div>
  );

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto w-full overflow-y-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <h1 className="text-2xl md:text-3xl font-black text-slate-900">數據中心</h1>
        <button 
          onClick={handleClearStats}
          disabled={isClearing}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-xl hover:bg-red-600 hover:text-white transition-colors text-sm font-bold disabled:opacity-50"
        >
          {isClearing ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
          {isClearing ? "數據清理中..." : "手動歸零數據"}
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        <StatCard label="總瀏覽次數" value={stats.total} icon={MousePointerClick} />
        <StatCard label="轉換動作數" value={stats.convDetails.form + stats.convDetails.phone + stats.convDetails.line} icon={Target} color="text-blue-600" />
        <StatCard label="整體轉換率" value={`${stats.convRate}%`} icon={TrendingUp} color="text-green-600" />
        <StatCard label="今日瀏覽" value={stats.today} color="text-orange-600" />
      </div>

      <div className="bg-slate-900 text-white p-8 rounded-3xl mb-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
        <h3 className="font-bold text-lg mb-6 flex items-center gap-2 text-orange-400">
          <Target size={20}/> 轉換行為詳細分析
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white/5 p-5 rounded-2xl border border-white/10 text-center">
            <p className="text-slate-400 text-sm mb-1 uppercase tracking-wider">表單預約</p>
            <p className="text-3xl font-black">{stats.convDetails.form} <span className="text-sm font-normal">組</span></p>
          </div>
          <div className="bg-white/5 p-5 rounded-2xl border border-white/10 text-center">
            <p className="text-slate-400 text-sm mb-1 uppercase tracking-wider">電話撥打</p>
            <p className="text-3xl font-black">{stats.convDetails.phone} <span className="text-sm font-normal">次</span></p>
          </div>
          <div className="bg-white/5 p-5 rounded-2xl border border-white/10 text-center">
            <p className="text-slate-400 text-sm mb-1 uppercase tracking-wider">LINE 諮詢</p>
            <p className="text-3xl font-black">{stats.convDetails.line} <span className="text-sm font-normal">次</span></p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-lg mb-6 flex items-center gap-2 text-slate-800">
            <Globe size={20} className="text-blue-500"/> 流量來源分布
          </h3>
          <div className="space-y-5">
            {Object.entries(stats.sources).sort((a,b)=>b[1]-a[1]).map(([source, count], i) => {
              const percentage = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
              return (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1 text-sm font-bold">
                    <span className="text-slate-700 truncate pr-4">{source}</span>
                    <span className="text-slate-500 whitespace-nowrap">{count} 次 ({percentage}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${percentage}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-lg mb-6 flex items-center gap-2 text-slate-800">
            <TrendingUp size={20} className="text-red-500"/> 熱門頁面排行
          </h3>
          <div className="space-y-5">
            {stats.topPages.map((page, i) => {
               const percentage = stats.total > 0 ? Math.round((page.count / stats.total) * 100) : 0;
               return (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1 text-sm font-bold">
                    <div className="flex flex-col truncate pr-4">
                      <span className="text-slate-800 truncate font-black">{page.title}</span>
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">{page.type}</span>
                    </div>
                    <span className="text-slate-600 whitespace-nowrap">{page.count} 次</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5">
                    <div className={`h-1.5 rounded-full ${i === 0 ? 'bg-red-500' : 'bg-slate-800'}`} style={{ width: `${percentage}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPanel;