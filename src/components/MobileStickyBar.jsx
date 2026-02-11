import React from 'react';
import { Phone, MessageCircle, Share2 } from 'lucide-react';

const MobileStickyBar = ({ agentPhone, lineId, title }) => {
  
  // 處理撥打電話
  const handleCall = () => {
    if (!agentPhone) return alert('未設定電話');
    window.location.href = `tel:${agentPhone}`;
  };

  // 處理加 LINE
  const handleLine = () => {
    if (!lineId) return alert('未設定 LINE ID');
    // 嘗試開啟 LINE App 加好友 (這是一個通用格式)
    window.open(`https://line.me/ti/p/~${lineId}`, '_blank');
  };

  // 處理分享 (原生分享功能)
  const handleShare = async () => {
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
      // 如果瀏覽器不支援原生分享 (例如電腦版)，就複製連結
      navigator.clipboard.writeText(window.location.href);
      alert('連結已複製！');
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-3 pb-safe z-50 md:hidden shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
      <div className="grid grid-cols-4 gap-3">
        {/* 分享按鈕 (佔 1 格) */}
        <button 
          onClick={handleShare}
          className="col-span-1 flex flex-col items-center justify-center text-slate-500 hover:text-slate-700 active:scale-95 transition"
        >
          <div className="bg-slate-100 p-2 rounded-full mb-1">
            <Share2 size={20} />
          </div>
          <span className="text-[10px] font-bold">分享</span>
        </button>

        {/* 撥打電話 (佔 1.5 格) */}
        <button 
          onClick={handleCall}
          className="col-span-1.5 bg-slate-800 text-white rounded-xl flex items-center justify-center gap-2 py-3 active:scale-95 transition shadow-lg shadow-slate-200"
        >
          <Phone size={18} />
          <span className="font-bold text-sm">致電</span>
        </button>

        {/* 加 LINE (佔 1.5 格) - 最顯眼 */}
        <button 
          onClick={handleLine}
          className="col-span-1.5 bg-[#06C755] text-white rounded-xl flex items-center justify-center gap-2 py-3 active:scale-95 transition shadow-lg shadow-green-100"
        >
          <MessageCircle size={18} />
          <span className="font-bold text-sm">加 LINE</span>
        </button>
      </div>
      
      {/* iPhone 底部安全區域 (避免被橫條擋住) */}
      <div className="h-[env(safe-area-inset-bottom)]"></div>
    </div>
  );
};

export default MobileStickyBar;