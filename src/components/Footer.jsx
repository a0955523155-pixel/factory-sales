import React, { useState } from 'react';
import { X } from 'lucide-react';

const Footer = () => {
  const [modalContent, setModalContent] = useState(null);

  // 隱私權政策內容
  const privacyPolicy = (
    <div className="space-y-4 text-slate-600 leading-relaxed">
      <h3 className="text-xl font-black text-slate-900">隱私權保護政策</h3>
      <p>歡迎訪問「綠芽團隊」（以下簡稱本網站）。為了讓您能夠安心使用本網站的各項服務與資訊，特此向您說明本網站的隱私權保護政策：</p>
      <ul className="list-disc pl-5 space-y-2">
        <li><strong>資料收集：</strong>我們收集您的姓名、聯絡電話、LINE ID 等資訊，僅用於工業地產諮詢與案場預約。</li>
        <li><strong>第三方利用：</strong>除非經您的同意或法律要求，我們絕不會將您的個資提供給任何第三方機構。</li>
        <li><strong>安全保障：</strong>本網站採用 Firebase 加密技術，保護您的個資免於外洩。</li>
        <li><strong>您的權利：</strong>您隨時可以聯絡我們的官方 LINE 要求查詢或刪除您的個人資料。</li>
      </ul>
    </div>
  );

  // 服務條款內容
  const termsOfService = (
    <div className="space-y-4 text-slate-600 leading-relaxed">
      <h3 className="text-xl font-black text-slate-900">網站服務條款</h3>
      <p>使用本網站即代表您同意以下條款，請務必詳閱：</p>
      <ul className="list-disc pl-5 space-y-2">
        <li><strong>資訊正確性：</strong>本網站標示之廠房坪數、電力與價格僅供參考，實際以現場看屋及建物謄本為準。</li>
        <li><strong>智慧財產權：</strong>本網站所有照片、影片及綠芽團隊品牌標誌均受法律保護，嚴禁未經授權轉載。</li>
        <li><strong>交易聲明：</strong>網站預約不代表交易成立，所有不動產交易均須簽署正式契約。</li>
        <li><strong>免責聲明：</strong>如因不可抗力因素導致資訊更新延遲，本團隊不負擔損害賠償責任。</li>
      </ul>
    </div>
  );

  return (
    <footer className="bg-slate-900 text-slate-400 py-10 border-t border-slate-800 font-sans">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
        
        {/* 版權宣告：已幫您改為綠芽團隊 */}
        <div className="text-sm font-bold tracking-wider text-slate-500">
          © 2026 綠芽團隊 | 高雄屏東廠房地產專家. All rights reserved.
        </div>

        {/* 連結區：點擊後觸發 Modal */}
        <div className="flex gap-6 text-xs font-bold tracking-widest uppercase">
          <button 
            onClick={() => setModalContent(privacyPolicy)}
            className="hover:text-orange-500 transition cursor-pointer"
          >
            Privacy Policy
          </button>
          <button 
            onClick={() => setModalContent(termsOfService)}
            className="hover:text-orange-500 transition cursor-pointer"
          >
            Terms of Service
          </button>
        </div>
      </div>

      {/* --- 條款彈窗 (Modal) --- */}
      {modalContent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fadeIn">
          {/* 背景遮罩 */}
          <div 
            className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
            onClick={() => setModalContent(null)}
          ></div>
          
          {/* 內容視窗 */}
          <div className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl p-8 max-h-[80vh] overflow-y-auto">
            <button 
              onClick={() => setModalContent(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-900 transition"
            >
              <X size={24} />
            </button>
            {modalContent}
            <button 
              onClick={() => setModalContent(null)}
              className="w-full mt-8 bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition"
            >
              我已閱讀並同意
            </button>
          </div>
        </div>
      )}
    </footer>
  );
};

export default Footer;