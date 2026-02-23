import React, { useEffect, useState } from 'react';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase'; // 確保路徑正確
import { Globe, TrendingUp, Trash2, Loader2 } from 'lucide-react';

const DashboardPanel = () => {
  const [stats, setStats] = useState({ today: 0, week: 0, month: 0, total: 0, sources: {}, topPages: [] });
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
    
    const oneWeekAgo = new Date(); 
    oneWeekAgo.setDate(now.getDate() - 7);
    
    const oneMonthAgo = new Date(); 
    oneMonthAgo.setMonth(now.getMonth() - 1);

    let today = 0, week = 0, month = 0, total = 0;
    let sourceMap = {};
    let pageMap = {};

    data.forEach(d => {
      // 1. 處理時間
      const viewDate = d.timestamp ? d.timestamp.toDate() : new Date();
      const viewDateStr = viewDate.toISOString().split('T')[0];

      total += 1;
      if (viewDateStr === todayStr) today += 1;
      if (viewDate >= oneWeekAgo) week += 1;
      if (viewDate >= oneMonthAgo) month += 1;

      // 2. 統計來源
      const src = d.source || "直接輸入網址/未知";
      sourceMap[src] = (sourceMap[src] || 0) + 1;

      // 3. 統計熱門頁面
      let rawPath = d.path || "/";
      let path = rawPath;
      
      // ★★★ 核心修正：將網址 URL 解碼，把 %E8... 轉回漂亮的中文 ★★★
      try {
        path = decodeURIComponent(rawPath);
      } catch (e) {
        console.error("網址解碼失敗", e);
      }

      let pageTitle = path;
      let pageType = "一般頁面";

      // 網址翻譯蒟蒻
      if (path === "/") { pageTitle = "綠芽團隊首頁"; pageType = "首頁"; }
      else if (path === "/works") { pageTitle = "經典作品列表"; pageType = "列表頁"; }
      else if (path === "/contact") { pageTitle = "聯絡我們"; pageType = "表單頁"; }
      else if (path === "/about") { pageTitle = "關於團隊"; pageType = "介紹頁"; }
      else if (path.includes("/property/")) { 
        pageTitle = `廠房物件 (${path.replace('/property/', '')})`; 
        pageType = "物件詳情"; 
      }
      else if (path.includes("/article/")) {
        pageTitle = `文章/新聞 (${path.replace('/article/', '')})`; 
        pageType = "最新消息"; 
      }

      // 寫入 pageMap 統計次數
      if (!pageMap[path]) {
        pageMap[path] = { title: pageTitle, type: pageType, count: 0 };
      }
      pageMap[path].count += 1;
    });

    // 排序並只取前 10 名
    const topPages = Object.values(pageMap).sort((a, b) => b.count - a.count).slice(0, 10);
    setStats({ today, week, month, total, sources: sourceMap, topPages });
  };

  const handleClearStats = async () => {
    const confirmText = window.prompt("⚠️ 警告：這將會清空「數據中心」的所有瀏覽紀錄！\n請輸入「0000」來確認執行：");
    if (confirmText !== "0000") return alert("密碼錯誤，已取消。");

    setIsClearing(true);
    try {
      const snap = await getDocs(collection(db, "page_views"));
      const deletePromises = [];
      snap.forEach((document) => {
        deletePromises.push(deleteDoc(doc(db, "page_views", document.id)));
      });

      const oldSnap = await getDocs(collection(db, "analytics"));
      oldSnap.forEach((document) => {
        deletePromises.push(deleteDoc(doc(db, "analytics", document.id)));
      });

      await Promise.all(deletePromises);
      alert("✅ 數據已成功歸零！");
      setStats({ today: 0, week: 0, month: 0, total: 0, sources: {}, topPages: [] });
    } catch (error) {
      console.error("清空失敗:", error);
      alert("清空失敗，請檢查網路連線。");
    }
    setIsClearing(false);
  };

  const StatCard = ({ label, value, color = "text-slate-800" }) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-center">
      <div className="text-slate-400 text-xs font-bold uppercase mb-2">{label}</div>
      <div className={`text-4xl font-black ${color}`}>{value}</div>
    </div>
  );

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto w-full overflow-y-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <h1 className="text-2xl md:text-3xl font-black">數據中心</h1>
        <button 
          onClick={handleClearStats}
          disabled={isClearing}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-xl hover:bg-red-600 hover:text-white transition-colors text-sm font-bold disabled:opacity-50"
        >
          {isClearing ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
          {isClearing ? "數據清理中..." : "手動歸零數據"}
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
        <StatCard label="今日瀏覽" value={stats.today} color="text-orange-600" />
        <StatCard label="本週瀏覽" value={stats.week} />
        <StatCard label="本月瀏覽" value={stats.month} />
        <StatCard label="歷史總計" value={stats.total} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
            <Globe size={20} className="text-blue-500"/> 流量來源分析
          </h3>
          <div className="space-y-5">
            {Object.keys(stats.sources).length === 0 && <p className="text-slate-400 text-sm">目前尚無數據</p>}
            {Object.entries(stats.sources).sort((a,b)=>b[1]-a[1]).map(([source, count], i) => {
              const percentage = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
              return (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold text-slate-700">{source}</span>
                    <span className="text-sm font-mono text-slate-500">{count} 次 ({percentage}%)</span>
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
          <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
            <TrendingUp size={20} className="text-red-500"/> 熱門頁面排行
          </h3>
          <div className="space-y-5">
            {stats.topPages.length === 0 && <p className="text-slate-400 text-sm">目前尚無數據</p>}
            {stats.topPages.map((page, i) => {
               const percentage = stats.total > 0 ? Math.round((page.count / stats.total) * 100) : 0;
               return (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex flex-col truncate pr-4">
                      <span className="text-sm font-bold text-slate-800 truncate">{page.title}</span>
                      <span className="text-[10px] text-slate-400 uppercase">{page.type}</span>
                    </div>
                    <span className="text-sm font-black text-slate-600 whitespace-nowrap">{page.count} 次</span>
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