import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Calendar } from 'lucide-react';

const ArticlePage = ({ category, title }) => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArticles = async () => {
      setLoading(true);
      try {
        // 篩選對應類別的文章
        const q = query(collection(db, "articles"), where("category", "==", category));
        const querySnapshot = await getDocs(q);
        const list = [];
        querySnapshot.forEach((doc) => list.push({ id: doc.id, ...doc.data() }));
        // 按日期排序 (新到舊)
        list.sort((a, b) => new Date(b.date) - new Date(a.date));
        setArticles(list);
      } catch (e) {
        console.error("Error fetching articles:", e);
      }
      setLoading(false);
    };
    fetchArticles();
  }, [category]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <Navbar />
      
      {/* Header */}
      <div className="bg-slate-900 py-32 px-6 text-center text-white relative overflow-hidden">
         <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
         <div className="relative z-10">
            <h1 className="text-5xl font-black mb-4">{title}</h1>
            <div className="w-20 h-1 bg-orange-600 mx-auto"></div>
         </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-20">
         {loading ? (
            <div className="text-center text-slate-400 text-xl font-mono">LOADING...</div>
         ) : articles.length === 0 ? (
            <div className="text-center text-slate-400 py-20 bg-white rounded-3xl border border-slate-200">
               <p>目前尚無相關文章</p>
            </div>
         ) : (
            <div className="grid gap-12">
               {articles.map((item) => (
                  <div key={item.id} className="bg-white rounded-3xl overflow-hidden shadow-lg border border-slate-100 flex flex-col md:flex-row group hover:-translate-y-2 transition duration-300">
                     <div className="md:w-1/3 h-64 md:h-auto overflow-hidden relative">
                        {item.image ? (
                           <img src={item.image} className="w-full h-full object-cover transition duration-700 group-hover:scale-110" />
                        ) : (
                           <div className="w-full h-full bg-slate-200 flex items-center justify-center text-slate-400 font-bold">NO IMAGE</div>
                        )}
                        <div className="absolute top-4 left-4 bg-orange-600 text-white text-xs font-bold px-3 py-1 rounded shadow">{item.date}</div>
                     </div>
                     <div className="p-8 md:w-2/3 flex flex-col">
                        <h2 className="text-2xl font-bold text-slate-900 mb-4 group-hover:text-orange-600 transition">{item.title}</h2>
                        <p className="text-slate-500 leading-relaxed flex-1 whitespace-pre-line">{item.content}</p>
                     </div>
                  </div>
               ))}
            </div>
         )}
      </div>

      <Footer />
    </div>
  );
};

export default ArticlePage;