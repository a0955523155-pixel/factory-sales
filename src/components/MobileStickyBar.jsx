import React, { useState } from 'react';
import { Phone, MessageCircle, Share2, Check } from 'lucide-react';

const MobileStickyBar = ({ agentPhone, lineId, title }) => {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    // 1. 製造專屬的分享網址替身 (/share/案名) 並加上時間戳
    const shareUrl = `${window.location.origin}/share/${encodeURIComponent(title)}?v=${new Date().getTime()}`;
    
    // 2. 如果手機支援原生分享 (會彈出直接傳給 LINE / FB 的內建選單)
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${title} | 綠芽團隊`,
          text: '推薦您看這個超棒的廠房/土地物件！',
          url: shareUrl
        });
      } catch (err) {
        console.log('分享被取消');
      }
    } else {
      // 3. 不支援時的備用方案：複製網址
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 shadow-[0_-5px_15px_rgba(0,0,0,0.05)] z-[60] md:hidden flex items-center justify-around py-3 px-2 pb-safe">
      
      {/* 分享按鈕 */}
      <button 
        onClick={handleShare} 
        className="flex flex-col items-center justify-center gap-1 text-slate-500 w-1/4 active:scale-95 transition"
      >
        {copied ? <Check size={20} className="text-green-500" /> : <Share2 size={20} />}
        <span className="text-[10px] font-bold">{copied ? '已複製網址' : '分享案場'}</span>
      </button>
      
      {/* 加 LINE 按鈕 */}
      <a 
        href={lineId ? `https://line.me/ti/p/~${lineId}` : "#"} 
        target="_blank" 
        rel="noopener noreferrer"
        className="flex flex-col items-center justify-center gap-1 text-green-600 w-1/4 active:scale-95 transition"
      >
        <MessageCircle size={20} />
        <span className="text-[10px] font-bold">加 LINE</span>
      </a>
      
      {/* 撥打專線按鈕 */}
      <a 
        href={`tel:${agentPhone || ''}`} 
        className="flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold py-2.5 px-4 rounded-full w-1/2 ml-2 shadow-lg active:scale-95 transition"
      >
        <Phone size={18} />
        <span className="text-sm">撥打專線</span>
      </a>
    </div>
  );
};

export default MobileStickyBar;