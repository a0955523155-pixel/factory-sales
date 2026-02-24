import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { 
  Send, Phone, Facebook, Instagram, MessageCircle, 
  User, Briefcase, Ruler, Building2, Loader2 
} from 'lucide-react';

const ContactSection = ({ title = "預約賞屋與諮詢", dark = true }) => {
  const [form, setForm] = useState({ name: '', industry: '', needs: '', ping: '', phone: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [settings, setSettings] = useState({
    contactPhone: "0800-666-738",
    fbLink: "", igLink: "", lineLink: "",
    iconFB: "", iconIG: "", iconLINE: "",
    notificationWebhook: "" 
  });
  
  const [schedule, setSchedule] = useState({});
  const [teamIds, setTeamIds] = useState({});

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docSnap = await getDoc(doc(db, "settings", "global"));
        if (docSnap.exists()) setSettings(prev => ({...prev, ...docSnap.data()}));
        
        const scheduleSnap = await getDoc(doc(db, "settings", "schedule"));
        if (scheduleSnap.exists()) setSchedule(scheduleSnap.data());

        const teamSnap = await getDoc(doc(db, "settings", "team"));
        if (teamSnap.exists() && teamSnap.data().ids) {
          setTeamIds(teamSnap.data().ids);
        }
      } catch(e) {
        console.error("Failed to load settings", e);
      }
    };
    fetchSettings();
  }, []);

  // ★★★ 新增：紀錄轉換行為的通用函數 ★★★
  const trackConversion = async (type) => {
    try {
      await addDoc(collection(db, "page_views"), {
        path: `/conversion/${type}`,
        source: type === 'form_submit' ? "表單提交" : "點擊轉換",
        timestamp: serverTimestamp(),
        type: "conversion"
      });
    } catch (e) {
      console.error("Conversion tracking failed", e);
    }
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone) return alert("請填寫姓名與電話");

    setIsSubmitting(true);
    try {
      const today = new Date();
      const dateString = today.toLocaleDateString('en-CA'); 
      const assignee = schedule[dateString] || "未指派";
      const targetLineId = teamIds[assignee] || "";

      // 抓取客戶來源足跡
      const currentUrl = window.location.href;
      const refererSource = document.referrer || "直接輸入網址或書籤";

      // 1. 寫入資料庫 (客戶名單)
      await addDoc(collection(db, "customers"), { 
        ...form, 
        source: 'homepage_general',
        clickUrl: currentUrl,
        fromReferer: refererSource,
        createdAt: serverTimestamp(),
        assignedTo: assignee
      });

      // 2. ★★★ 紀錄轉換行為 (表單送出) ★★★
      await trackConversion('form_submit');

      // 3. 觸發通知 Webhook
      if (settings.notificationWebhook) {
        try {
          await fetch(settings.notificationWebhook, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...form,
              source: 'homepage_general',
              clickUrl: currentUrl,
              fromReferer: refererSource,
              assignedTo: assignee,
              lineUserId: targetLineId, 
              date: dateString
            })
          });
        } catch (webhookError) {
          console.error("Webhook trigger failed", webhookError);
        }
      }

      alert(`感謝 ${form.name}！您的需求已送出，將由專員 ${assignee} 盡快與您聯繫。`);
      setForm({ name: '', industry: '', needs: '', ping: '', phone: '' });
    } catch (error) {
      console.error(error);
      alert("傳送失敗，請稍後再試或直接來電。");
    }
    setIsSubmitting(false);
  };

  const renderIcon = (imgUrl, DefaultIcon, colorClass) => {
    if (imgUrl) return <img src={imgUrl} className="w-12 h-12 rounded-full object-cover border border-slate-700 hover:scale-110 transition hover:border-orange-500" alt="icon" />;
    return <div className={`w-12 h-12 flex items-center justify-center rounded-full bg-slate-900 border border-slate-800 hover:border-orange-500 hover:scale-110 transition ${colorClass}`}><DefaultIcon size={24} /></div>;
  };

  return (
    <section className="py-24 px-6 bg-slate-950 relative overflow-hidden" id="contact-section">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-16 relative z-10">
        
        <div className="lg:w-5/12 flex flex-col justify-center">
          <span className="text-orange-500 font-bold tracking-widest uppercase text-sm mb-2 block">Contact Us</span>
          <h2 className="text-4xl md:text-6xl font-black text-white mb-8 leading-tight">{title}</h2>
          
          <p className="text-slate-400 mb-10 text-lg leading-relaxed">
            無論您是需要尋找特定規格的廠房、評估工業地投資，或是了解最新實價登錄行情，綠芽團隊隨時為您服務。
          </p>

          {/* ★★★ 撥打電話：加入點擊轉換紀錄 ★★★ */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl flex items-center gap-6 mb-8 hover:border-orange-500/50 transition-colors">
            <div className="bg-orange-600 p-4 rounded-2xl text-white shadow-lg shadow-orange-500/30">
              <Phone size={32} />
            </div>
            <div>
              <p className="text-slate-500 text-sm font-bold uppercase tracking-wider mb-1">Call Now</p>
              <a 
                href={`tel:${settings.contactPhone}`} 
                onClick={() => trackConversion('phone_call')}
                className="text-3xl font-black text-white hover:text-orange-500 transition-colors"
              >
                {settings.contactPhone}
              </a>
            </div>
          </div>

          <div>
            <p className="text-slate-500 text-sm font-bold mb-4">關注我們 / 線上諮詢</p>
            <div className="flex gap-4">
               {settings.fbLink && <a href={settings.fbLink} target="_blank" rel="noreferrer" title="Facebook">{renderIcon(settings.iconFB, Facebook, "text-blue-500")}</a>}
               {settings.igLink && <a href={settings.igLink} target="_blank" rel="noreferrer" title="Instagram">{renderIcon(settings.iconIG, Instagram, "text-pink-500")}</a>}
               {/* ★★★ LINE 點擊：加入點擊轉換紀錄 ★★★ */}
               {settings.lineLink && (
                 <a 
                  href={settings.lineLink} 
                  target="_blank" 
                  rel="noreferrer" 
                  title="LINE"
                  onClick={() => trackConversion('line_click')}
                 >
                   {renderIcon(settings.iconLINE, MessageCircle, "text-green-500")}
                 </a>
               )}
            </div>
          </div>
        </div>

        <div className="lg:w-7/12">
          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-8 md:p-12 rounded-[2.5rem] shadow-2xl">
            <h3 className="text-2xl font-black text-white mb-8 flex items-center gap-3">
              <Send className="text-orange-500" size={28} /> 線上需求單
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase ml-2 mb-2 block">您的姓名 *</label>
                  <div className="relative">
                    <User className="absolute left-4 top-3.5 text-slate-500" size={20}/>
                    <input required name="name" value={form.name} onChange={handleChange} className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-white focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 transition" placeholder="王先生/小姐"/>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase ml-2 mb-2 block">聯絡電話 *</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-3.5 text-slate-500" size={20}/>
                    <input required name="phone" value={form.phone} onChange={handleChange} className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-white focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 transition" placeholder="0912-345-678"/>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase ml-2 mb-2 block">所屬行業 (選填)</label>
                <div className="relative">
                  <Briefcase className="absolute left-4 top-3.5 text-slate-500" size={20}/>
                  <input name="industry" value={form.industry} onChange={handleChange} className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-white focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 transition" placeholder="例如：金屬加工、物流倉儲..."/>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase ml-2 mb-2 block">需求坪數</label>
                  <div className="relative">
                    <Ruler className="absolute left-4 top-3.5 text-slate-500" size={20}/>
                    <input name="ping" value={form.ping} onChange={handleChange} className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-white focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 transition" placeholder="例如：300-500坪"/>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase ml-2 mb-2 block">需求類型</label>
                  <div className="relative">
                    <Building2 className="absolute left-4 top-3.5 text-slate-500" size={20}/>
                    <select name="needs" value={form.needs} onChange={handleChange} className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-white focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 transition appearance-none">
                      <option value="">請選擇...</option>
                      <option value="購地自建">購地自建</option>
                      <option value="購買廠房">購買廠房</option>
                      <option value="租賃">租賃</option>
                      <option value="投資">投資</option>
                      <option value="其他">其他</option>
                    </select>
                  </div>
                </div>
              </div>

              <button type="submit" disabled={isSubmitting} className="w-full mt-4 bg-gradient-to-r from-orange-600 to-red-600 text-white font-black py-4 rounded-2xl hover:shadow-lg hover:shadow-orange-500/30 transition transform active:scale-95 flex items-center justify-center gap-2 text-lg">
                {isSubmitting ? <Loader2 className="animate-spin"/> : <Send size={20}/>}
                {isSubmitting ? "資料傳送中..." : "送出諮詢"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;