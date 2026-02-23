import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { BarChart3, PieChart, Trash2, Loader2, MousePointerClick } from 'lucide-react';

const StatsDashboard = () => {
  const [sourceStats, setSourceStats] = useState([]);
  const [pageStats, setPageStats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isClearing, setIsClearing] = useState(false);
  const [totalViews, setTotalViews] = useState(0);

  // 1. 抓取並計算數據
  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "page_views"));
      
      const sources = {};
      const pages = {};
      let total = 0;

      querySnapshot.forEach((document) => {
        const data = document.data();
        total++;
        
        // 統計來源
        const src = data.source || "未知來源";
        sources[src] = (sources[src] || 0) + 1;

        // 統計頁面
        let path = data.path || "/";
        if (path === "/") path = "首頁 (/)";
        else if (path.includes("/property/")) path = `物件詳情 (${path.replace('/property/', '')})`;
        else if (path === "/works") path = "經典作品 (/works)";
        else if (path === "/contact") path = "聯絡我們 (/contact)";
        
        pages[path] = (pages[path] || 0) + 1;
      });

      setTotalViews(total);

      // 轉換成陣列並排序 (由高到低)
      const sourceArray = Object.keys(sources).map(key => ({
        name: key,
        count: sources[key],
        percentage: total > 0 ? Math.round((sources[key] / total) * 100) : 0
      })).sort((a, b) => b.count - a.count);

      const pageArray = Object.keys(pages).map(key => ({
        name: key,
        count: pages[key],
        percentage: total > 0 ? Math.round((pages[key] / total) * 100) : 0
      })).sort((a, b) => b.count - a.count).slice(0, 10); // 只取前 10 名

      setSourceStats(sourceArray);
      setPageStats(pageArray);
    } catch (error) {
      console.error("抓取數據失敗:", error);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // 2. 清空數據功能
  const handleClearStats = async () => {
    const confirmText = window.prompt("⚠️ 警告：這將會清空「數據中心」的所有瀏覽紀錄！\n請輸入「0000」來確認執行：");
    if (confirmText !== "0000") return;

    setIsClearing(true);
    try {
      const querySnapshot = await getDocs(collection(db, "page_views"));
      const deletePromises = [];
      querySnapshot.forEach((document) => {
        deletePromises.push(deleteDoc(doc(db, "page_views", document.id)));
      });

      await Promise.all(deletePromises);
      alert("✅ 數據已成功歸零！");
      fetchStats(); // 重新抓取(就會變成0)
    } catch (error) {
      console.error("清空數據失敗:", error);
      alert("清空失敗，請檢查網路連線。");
    }
    setIsClearing(false);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20 text-slate-500">
        <Loader2 className="animate-spin mr-2" size={24} /> 數據載入中...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 總覽與操作列 */}
      <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100 gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-orange-100 text-orange-600 rounded-xl">
            <MousePointerClick size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-bold">總瀏覽人次</p>
            <p className="text-3xl font-black text-slate-800">{totalViews} <span className="text-sm font-normal text-slate-400">次</span></p>
          </div>
        </div>
        
        <button 
          onClick={handleClearStats}
          disabled={isClearing}
          className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-xl hover:bg-red-600 hover:text-white transition-colors text-sm font-bold"
        >
          {isClearing ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
          {isClearing ? "清理中..." : "手動歸零數據"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 左側：流量來源分析 */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
            <PieChart className="text-orange-500" size={20} /> 流量來源分析
          </h3>
          {sourceStats.length === 0 ? (
            <p className="text-slate-400 text-center py-10">目前尚無數據</p>
          ) : (
            <div className="space-y-5">
              {sourceStats.map((item, index) => (
                <div key={index}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-bold text-slate-700">{item.name}</span>
                    <span className="text-slate-500">{item.count} 次 ({item.percentage}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5">
                    <div className="bg-orange-500 h-2.5 rounded-full" style={{ width: `${item.percentage}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 右側：熱門頁面排行 */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
            <BarChart3 className="text-orange-500" size={20} /> 熱門頁面排行 (Top 10)
          </h3>
          {pageStats.length === 0 ? (
            <p className="text-slate-400 text-center py-10">目前尚無數據</p>
          ) : (
            <div className="space-y-5">
              {pageStats.map((item, index) => (
                <div key={index}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-bold text-slate-700 truncate pr-4">{item.name}</span>
                    <span className="text-slate-500 whitespace-nowrap">{item.count} 次</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5">
                    {/* 依照名次給予不同顏色，第一名特別亮 */}
                    <div className={`h-2.5 rounded-full ${index === 0 ? 'bg-red-500' : 'bg-slate-800'}`} style={{ width: `${item.percentage}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatsDashboard;