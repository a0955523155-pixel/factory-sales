import React, { useState } from 'react';
import { X, ShieldCheck } from 'lucide-react';

const Footer = () => {
  const [modalContent, setModalContent] = useState(null);

  const privacyPolicy = (
    <div className="space-y-4 text-slate-600 leading-relaxed">
      <h3 className="text-xl font-black text-slate-900">隱私權保護政策</h3>
      <p>歡迎訪問「綠芽團隊」（以下簡稱本網站）。為了讓您能夠安心使用本網站的各項服務與資訊，特此向您說明本網站的隱私權保護政策：</p>
      <ul className="list-disc pl-5 space-y-2">
        <li><strong>資料收集：</strong>我們收集您的姓名、聯絡電話、LINE ID 等資訊，僅用於「鼎龍資產管理服務有限公司」之工業地產諮詢與案場預約。</li>
        <li><strong>第三方利用：</strong>除非經您的同意或法律要求，我們絕不會將您的個資提供給任何第三方機構。</li>
        <li><strong>安全保障：</strong>本網站採用 Firebase 加密技術，保護您的個資免於外洩。</li>
      </ul>
    </div>
  );

  const termsOfService = (
    <div className="space-y-4 text-slate-600 leading-relaxed">
      <h3 className="text-xl font-black text-slate-900">網站服務條款</h3>
      <p>使用本網站即代表您同意以下條款，請務必詳閱：</p>
      <ul className="list-disc pl-5 space-y-2">
        <li><strong>身份宣告：</strong>本網站所有物件均由「鼎龍資產管理服務有限公司」合法受託辦理。</li>
        <li><strong>資訊正確性：</strong>本網站標示之廠房坪數、電力與價格僅供參考，實際以現場看屋及建物謄本為準。</li>
        <li><strong>智慧財產權：</strong>本網站所有照片、影片及綠芽團隊品牌標誌均受法律保護，嚴禁未經授權轉載。</li>
        <li><strong>交易聲明：</strong>網站預約不代表交易成立，所有不動產交易均須簽署正式契約。</li>
      </ul>
    </div>
  );

  return (
    <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800 font-sans">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
        
        {/* 左側：公司法律資訊 */}
        <div className="flex flex-col gap-2">
          <div className="text-base font-black tracking-wider text-slate-200 flex items-center gap-2">
            © 2026 綠芽團隊 <span className="text-slate-600 font-light">|</span> 高雄屏東廠房地產專家
          </div>
          
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500 tracking-widest font-medium">
            <span className="flex items-center gap-1">
              經紀業：鼎龍資產管理服務有限公司
            </span>
            <span className="hidden md:inline text-slate-800">|</span>
            <span className="flex items-center gap-1">
              <ShieldCheck size={12} className="text-orange-500/70" />
              經紀人證號：103年高市字第01023號
            </span>
          </div>
          
          <p className="text-[10px] text-slate-600 mt-1 leading-relaxed">
            本網站所有房地產資訊均受「不動產經紀業管理條例」規範。資訊僅供參考，實際依不動產權狀及買賣契約為準。
          </p>
        </div>

        {/* 右側：連結區 */}
        <div className="flex gap-8 text-xs font-bold tracking-[0.2em] uppercase">
          <button 
            onClick={() => setModalContent(privacyPolicy)}
            className="hover:text-orange-500 transition-colors cursor-pointer border-b border-transparent hover:border-orange-500/50 pb-1"
          >
            Privacy Policy
          </button>
          <button 
            onClick={() => setModalContent(termsOfService)}
            className="hover:text-orange-500 transition-colors cursor-pointer border-b border-transparent hover:border-orange-500/50 pb-1"
          >
            Terms of Service
          </button>
        </div>
      </div>

      {/* --- 條款彈窗 (Modal) --- */}
      {modalContent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm animate-fadeIn"
            onClick={() => setModalContent(null)}
          ></div>
          <div className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl p-10 max-h-[85vh] overflow-y-auto animate-slideUp">
            <button 
              onClick={() => setModalContent(null)}
              className="absolute top-8 right-8 p-2 text-slate-300 hover:text-slate-900 transition-colors"
            >
              <X size={24} />
            </button>
            <div className="mt-2">
              {modalContent}
            </div>
            <button 
              onClick={() => setModalContent(null)}
              className="w-full mt-10 bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-orange-600 transition-all shadow-xl active:scale-95"
            >
              我已閱讀並同意條款
            </button>
          </div>
        </div>
      )}
    </footer>
  );
};

export default Footer;