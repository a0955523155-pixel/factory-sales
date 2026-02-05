import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ContactSection from '../components/ContactSection';
import { Users, Briefcase, Award, TrendingUp } from 'lucide-react';

const About = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchAbout = async () => {
      const docSnap = await getDoc(doc(db, "settings", "about"));
      if (docSnap.exists()) {
        setData(docSnap.data());
      } else {
        // 預設資料 (若尚未設定)
        setData({
          title: "綠芽團隊",
          subtitle: "深耕南台灣，專注工業地產",
          content: "我們是一群對土地充滿熱情的專業團隊...",
          stats: [
            { label: "在地深耕(年)", value: "10+" },
            { label: "成交件數", value: "500+" },
            { label: "服務客戶", value: "1000+" }
          ]
        });
      }
    };
    fetchAbout();
  }, []);

  if (!data) return <div className="h-screen bg-slate-50"></div>;

  return (
    <div className="font-sans min-h-screen bg-white">
      <Navbar />
      
      {/* Hero Section */}
      <div className="bg-slate-900 pt-32 pb-20 px-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="max-w-7xl mx-auto text-center relative z-10">
           <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">{data.title}</h1>
           <p className="text-xl text-orange-400 font-bold tracking-wide">{data.subtitle}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
           {/* 形象圖片 */}
           <div className="relative">
              <div className="absolute inset-0 bg-orange-500 rounded-3xl transform rotate-3 opacity-20"></div>
              {data.image ? (
                <img src={data.image} alt="About Us" className="relative rounded-3xl shadow-2xl w-full object-cover h-[500px]" />
              ) : (
                <div className="relative rounded-3xl shadow-2xl w-full h-[500px] bg-slate-200 flex items-center justify-center text-slate-400 font-bold text-xl">請至後台設定形象圖片</div>
              )}
           </div>

           {/* 文字內容 */}
           <div>
              <h2 className="text-3xl font-black text-slate-900 mb-8 border-l-4 border-orange-500 pl-4">品牌故事</h2>
              <div className="text-slate-600 leading-loose text-lg whitespace-pre-line mb-10">
                 {data.content}
              </div>
              
              {/* 數據統計 */}
              <div className="grid grid-cols-3 gap-4">
                 {data.stats && data.stats.map((stat, i) => (
                    <div key={i} className="text-center p-4 bg-slate-50 rounded-xl border border-slate-100">
                       <span className="block text-3xl font-black text-orange-600 mb-1">{stat.value}</span>
                       <span className="text-xs font-bold text-slate-400 uppercase">{stat.label}</span>
                    </div>
                 ))}
              </div>
           </div>
        </div>
      </div>

      {/* 核心價值 (靜態展示) */}
      <section className="bg-slate-50 py-20 px-6">
         <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
               <h2 className="text-3xl font-black text-slate-900">我們的核心價值</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               <div className="bg-white p-8 rounded-2xl shadow-sm text-center group hover:-translate-y-2 transition duration-300">
                  <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-blue-600 group-hover:text-white transition"><Award size={32}/></div>
                  <h3 className="text-xl font-bold mb-3">專業誠信</h3>
                  <p className="text-slate-500">堅持公開透明的交易流程，保障買賣雙方權益，是我們不變的承諾。</p>
               </div>
               <div className="bg-white p-8 rounded-2xl shadow-sm text-center group hover:-translate-y-2 transition duration-300">
                  <div className="w-16 h-16 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-orange-600 group-hover:text-white transition"><TrendingUp size={32}/></div>
                  <h3 className="text-xl font-bold mb-3">精準眼光</h3>
                  <p className="text-slate-500">憑藉多年在地經驗，精準掌握產業脈動與區域發展，為您創造最大價值。</p>
               </div>
               <div className="bg-white p-8 rounded-2xl shadow-sm text-center group hover:-translate-y-2 transition duration-300">
                  <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-green-600 group-hover:text-white transition"><Users size={32}/></div>
                  <h3 className="text-xl font-bold mb-3">永續服務</h3>
                  <p className="text-slate-500">成交只是開始，我們提供完整的售後諮詢與服務，成為您一輩子的房產顧問。</p>
               </div>
            </div>
         </div>
      </section>

      <ContactSection dark={true} />
      <Footer />
    </div>
  );
};

export default About;