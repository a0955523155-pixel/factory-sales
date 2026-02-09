import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../../firebase';
import { Globe, TrendingUp } from 'lucide-react';

const DashboardPanel = () => {
  const [stats, setStats] = useState({ today: 0, week: 0, month: 0, total: 0, sources: {}, topPages: [] });

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const q = query(collection(db, "analytics"), orderBy("date", "desc"), limit(365));
        const snap = await getDocs(q);
        const data = [];
        snap.forEach(doc => data.push(doc.data()));
        calculateStats(data);
      } catch (e) { console.error(e); }
    };
    fetchAnalytics();
  }, []);

  const calculateStats = (data) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const oneWeekAgo = new Date(); oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const oneMonthAgo = new Date(); oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    let today = 0, week = 0, month = 0, total = 0;
    let sourceMap = {};
    let pageMap = {};

    data.forEach(d => {
      const viewDate = new Date(d.date);
      const views = d.totalViews || 0;
      total += views;

      if (d.date === todayStr) today = views;
      if (viewDate >= oneWeekAgo) week += views;
      if (viewDate >= oneMonthAgo) month += views;

      if (d.sources) Object.entries(d.sources).forEach(([src, count]) => sourceMap[src] = (sourceMap[src] || 0) + count);
      if (d.pages) Object.entries(d.pages).forEach(([id, info]) => pageMap[id] = { title: info.title, type: info.type, count: (pageMap[id]?.count || 0) + info.count });
    });

    const topPages = Object.values(pageMap).sort((a, b) => b.count - a.count).slice(0, 10);
    setStats({ today, week, month, total, sources: sourceMap, topPages });
  };

  const StatCard = ({ label, value, color = "text-slate-800" }) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
      <div className="text-slate-400 text-xs font-bold uppercase mb-2">{label}</div>
      <div className={`text-4xl font-black ${color}`}>{value}</div>
    </div>
  );

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto w-full overflow-y-auto">
      <h1 className="text-2xl md:text-3xl font-black mb-8">數據中心</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
        <StatCard label="今日瀏覽" value={stats.today} color="text-orange-600" />
        <StatCard label="本週瀏覽" value={stats.week} />
        <StatCard label="本月瀏覽" value={stats.month} />
        <StatCard label="歷史總計" value={stats.total} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-lg mb-6 flex items-center gap-2"><Globe size={20} className="text-blue-500"/> 流量來源分析</h3>
          <div className="space-y-4">
            {Object.entries(stats.sources).sort((a,b)=>b[1]-a[1]).map(([source, count], i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-700">{source}</span>
                <span className="text-sm font-mono text-slate-500">{count}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-lg mb-6 flex items-center gap-2"><TrendingUp size={20} className="text-red-500"/> 熱門頁面排行</h3>
          <div className="space-y-4">
            {stats.topPages.map((page, i) => (
              <div key={i} className="flex items-center justify-between border-b border-slate-50 pb-2 last:border-0">
                <div className="flex flex-col truncate"><span className="text-sm font-bold text-slate-800 truncate">{page.title}</span><span className="text-[10px] text-slate-400 uppercase">{page.type}</span></div>
                <span className="text-sm font-black text-slate-600">{page.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPanel;