import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, doc, getDoc } from 'firebase/firestore';
import { Send, Phone, Facebook, Instagram, MessageCircle } from 'lucide-react';

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
  const [teamIds, setTeamIds] = useState({}); // 儲存 { "余珮婷": "U123..." }

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docSnap = await getDoc(doc(db, "settings", "global"));
        if (docSnap.exists()) setSettings(prev => ({...prev, ...docSnap.data()}));
        
        const scheduleSnap = await getDoc(doc(db, "settings", "schedule"));
        if (scheduleSnap.exists()) setSchedule(scheduleSnap.data());

        // ★★★ 抓取團隊 ID 對照表 ★★★
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

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone) return alert("請填寫姓名與電話");

    setIsSubmitting(true);
    try {
      // 1. 自動指派
      const today = new Date();
      const dateString = today.toLocaleDateString('en-CA'); 
      const assignee = schedule[dateString] || "未指派";
      
      // ★★★ 找出該人員的 LINE ID ★★★
      // 如果找不到該員的 ID，就傳送給預設管理者 (或是空值)
      const targetLineId = teamIds[assignee] || "";

      // 2. 寫入資料庫
      await addDoc(collection(db, "customers"), { 
        ...form, 
        createdAt: new Date(),
        assignedTo: assignee
      });

      // 3. 觸發通知 Webhook
      if (settings.notificationWebhook) {
        try {
          await fetch(settings.notificationWebhook, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...form,
              assignedTo: assignee,
              lineUserId: targetLineId, // 傳送 ID 給 Make
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
    if (imgUrl) return <img src={imgUrl} className="w-10 h-10 rounded-full object-cover border-2 border-white/20 hover:scale-110 transition" alt="icon" />;
    return <div className={`p-3 rounded-full bg-white/10 hover:bg-white/20 transition ${colorClass}`}><DefaultIcon size={20} /></div>;
  };

  const bgClass = dark ? "bg-slate-900 text-white" : "bg-slate-50 text-slate-900";
  
  return (
    <section className={`py-24 ${bgClass} relative overflow-hidden`} id="contact-section">
      {dark && <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>}
      
      <div className="max-w-7xl mx-auto px-6 relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
        
        <div>
          <span className="text-orange-500 font-mono font-bold uppercase tracking-widest mb-2 block">Contact Us</span>
          <h2 className="text-4xl md:text-5xl font-black mb-8 leading-tight">{title}</h2>
          
          <div className="space-y-8">
            <a href={`tel:${settings.contactPhone}`} className="flex items-center gap-6 p-6 rounded-2xl border border-white/10 hover:border-orange-500 transition duration-300 group bg-white/5">
              <div className="w-14 h-14 rounded-full bg-orange-600 flex items-center justify-center text-white group-hover:scale-110 transition">
                <Phone size={28} />
              </div>
              <div>
                <p className={`text-xs uppercase tracking-widest mb-1 ${dark ? 'text-slate-400' : 'text-slate-500'}`}>Call Now</p>
                <p className="text-2xl font-black">{settings.contactPhone}</p>
              </div>
            </a>

            <div>
               <p className={`text-sm font-bold mb-4 ${dark ? 'text-slate-400' : 'text-slate-500'}`}>關注我們 / 線上諮詢</p>
               <div className="flex gap-4">
                  {settings.fbLink && <a href={settings.fbLink} target="_blank" rel="noreferrer" title="Facebook">{renderIcon(settings.iconFB, Facebook, "text-blue-500")}</a>}
                  {settings.igLink && <a href={settings.igLink} target="_blank" rel="noreferrer" title="Instagram">{renderIcon(settings.iconIG, Instagram, "text-pink-500")}</a>}
                  {settings.lineLink && <a href={settings.lineLink} target="_blank" rel="noreferrer" title="LINE">{renderIcon(settings.iconLINE, MessageCircle, "text-green-500")}</a>}
               </div>
            </div>
          </div>
        </div>

        <div className={`p-8 md:p-10 rounded-3xl shadow-2xl ${dark ? 'bg-white text-slate-900' : 'bg-white text-slate-900 border border-slate-100'}`}>
           <h3 className="text-2xl font-black mb-6 flex items-center gap-2">
             <Send className="text-orange-600"/> 線上需求單
           </h3>
           <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input required name="name" value={form.name} onChange={handleChange} placeholder="您的姓名 *" className={`w-full p-4 rounded-xl border focus:outline-none focus:border-orange-500 bg-slate-50 border-slate-200`} />
                <input required name="phone" value={form.phone} onChange={handleChange} placeholder="聯絡電話 *" className={`w-full p-4 rounded-xl border focus:outline-none focus:border-orange-500 bg-slate-50 border-slate-200`} />
              </div>
              <input name="industry" value={form.industry} onChange={handleChange} placeholder="所屬行業" className={`w-full p-4 rounded-xl border focus:outline-none focus:border-orange-500 bg-slate-50 border-slate-200`} />
              <div className="grid grid-cols-2 gap-4">
                <input name="ping" value={form.ping} onChange={handleChange} placeholder="需求坪數" className={`w-full p-4 rounded-xl border focus:outline-none focus:border-orange-500 bg-slate-50 border-slate-200`} />
                <select name="needs" value={form.needs} onChange={handleChange} className={`w-full p-4 rounded-xl border focus:outline-none focus:border-orange-500 bg-slate-50 border-slate-200 text-slate-500`}>
                  <option value="">需求類型</option>
                  <option value="購地自建">購地自建</option>
                  <option value="購買廠房">購買廠房</option>
                  <option value="租賃">租賃</option>
                  <option value="投資">投資</option>
                </select>
              </div>
              <button type="submit" disabled={isSubmitting} className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl hover:bg-orange-600 transition shadow-lg mt-2 flex items-center justify-center gap-2">
                {isSubmitting ? "傳送中..." : <><Send size={18}/> 送出諮詢</>}
              </button>
           </form>
        </div>

      </div>
    </section>
  );
};

export default ContactSection;