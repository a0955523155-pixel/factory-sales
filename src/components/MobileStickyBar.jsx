import React from 'react';
import { Phone, MessageCircle, Share2 } from 'lucide-react';

const MobileStickyBar = ({ agentPhone, lineId, title }) => {
  
  const handleCall = () => {
    if (!agentPhone) return alert('未設定經紀人電話');
    window.location.href = `tel:${agentPhone}`;
  };

  const handleLine = () => {
    if (!lineId) return alert('未設定 LINE ID');
    // 嘗試開啟 LINE (通用連結)
    window.open(`https://line.me/ti/p/~${lineId}`, '_blank');
  };

  const handleShare = async () => {
    // 優先使用手機原生的分享選單
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: `推薦你看這個廠房：${title}`,
          url: window.location.href,
        });
      } catch (error) {
        console.log('分享取消');
      }
    } else {
      // 電腦版或不支援時，複製連結
      navigator.clipboard.writeText(window.location.href);
      alert('連結已複製！');
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-3 pb-[env(safe-area-inset-bottom)] z-50 md:hidden shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
      <div className="grid grid-cols-4 gap-3 h-12">
        {/* 分享按鈕 (佔 1 等分) */}
        <button 
          onClick={handleShare}
          className="col-span-1 flex flex-col items-center justify-center text-slate-500 hover:text-slate-800 active:scale-95 transition bg-slate-50 rounded-xl"
        >
          <Share2 size={18} />
          <span className="text-[10px] font-bold mt-1">分享</span>
        </button>

        {/* 撥打電話 (佔 1.5 等分) */}
        <button 
          onClick={handleCall}
          className="col-span-1 bg-slate-800 text-white rounded-xl flex flex-col items-center justify-center active:scale-95 transition shadow-lg shadow-slate-200"
        >
          <Phone size={18} />
          <span className="text-[10px] font-bold mt-1">致電</span>
        </button>

        {/* 加 LINE (佔 2 等分 - 最顯眼) */}
        <button 
          onClick={handleLine}
          className="col-span-2 bg-[#06C755] text-white rounded-xl flex flex-col md:flex-row items-center justify-center gap-1 active:scale-95 transition shadow-lg shadow-green-100"
        >
          <MessageCircle size={20} className="fill-white" />
          <span className="text-sm font-bold">加 LINE 詢問</span>
        </button>
      </div>
    </div>
  );
};

export default MobileStickyBar;