import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Calendar, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const ArticlePage = ({ category, title }) => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // 分頁設定
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchArticles = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, "articles"), where("category", "==", category));
        const querySnapshot = await getDocs(q);
        const list = [];
        querySnapshot.forEach((doc) => list.push({ id: doc.id, ...doc.data() }));
        
        // --- 排序邏輯修正：由新到舊 (Latest Created First) ---
        list.sort((a, b) => {
            // 優先使用 createdAt (毫秒時間戳)
            const timeA = a.createdAt || new Date(a.date).getTime();
            const timeB = b.createdAt || new Date(b.date).getTime();
            return timeB - timeA; // 大的 (新的) 排前面
        });

        setArticles(list);
      } catch (e) {
        console.error("Error:", e);
      }
      setLoading(false);
    };
    fetchArticles();
    setCurrentPage(1);
  }, [category]);

  // 計算分頁
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentArticles = articles.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(articles.length / itemsPerPage);

  const paginate = (pageNumber) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setCurrentPage(pageNumber);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <Navbar />
      
      {/* Header */}
      <div className="bg-slate-900 py-32 px-6 text-center text-white relative overflow-hidden">
         <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
         <div className="relative z-10">
            <h1 className="text-5xl font-black mb-4 tracking-wide">{title}</h1>
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
            <>
               <div className="space-y-8">
                  {currentArticles.map((item, index) => {
                     // 混合排版：前 3 篇顯示大圖，後面顯示列表
                     const globalIndex = indexOfFirstItem + index;
                     const isTopThree = globalIndex < 3;

                     if (isTopThree) {
                        // --- 卡片式排版 ---
                        return (
                           <Link to="#" key={item.id} className="block group">
                             <div className="bg-white rounded-3xl overflow-hidden shadow-lg border border-slate-100 flex flex-col md:flex-row hover:-translate-y-1 transition duration-300">
                                <div className="md:w-1/3 h-64 md:h-auto overflow-hidden relative">
                                   {item.image ? (
                                      <img src={item.image} className="w-full h-full object-cover transition duration-700 group-hover:scale-110" />
                                   ) : (
                                      <div className="w-full h-full bg-slate-200 flex items-center justify-center text-slate-400 font-bold">NO IMAGE</div>
                                   )}
                                   <div className="absolute top-4 left-4 bg-orange-600 text-white text-xs font-bold px-3 py-1 rounded shadow flex items-center gap-1">
                                      <Calendar size={12}/> {item.date}
                                   </div>
                                </div>
                                <div className="p-8 md:w-2/3 flex flex-col justify-center">
                                   <h2 className="text-2xl font-bold text-slate-900 mb-4 group-hover:text-orange-600 transition line-clamp-2">{item.title}</h2>
                                   <p className="text-slate-500 leading-relaxed line-clamp-3 whitespace-pre-line">{item.content}</p>
                                   <span className="text-orange-600 font-bold text-sm mt-4 flex items-center gap-1 group-hover:translate-x-2 transition">閱讀全文 <ArrowRight size={14}/></span>
                                </div>
                             </div>
                           </Link>
                        );
                     } else {
                        // --- 列表式排版 ---
                        return (
                           <div key={item.id} className="bg-white p-6 rounded-xl border border-slate-200 hover:border-orange-300 transition flex flex-col md:flex-row md:items-center justify-between group cursor-pointer">
                              <div className="flex-1 pr-4">
                                 <div className="text-slate-400 text-xs font-mono mb-1 flex items-center gap-2">
                                    <span>{item.date}</span>
                                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                    <span className="text-orange-500 font-bold uppercase">{category}</span>
                                 </div>
                                 <h3 className="text-lg font-bold text-slate-800 group-hover:text-orange-600 transition line-clamp-1">{item.title}</h3>
                              </div>
                              <div className="mt-2 md:mt-0">
                                 <span className="text-slate-300 group-hover:text-orange-500 transition"><ArrowRight size={20}/></span>
                              </div>
                           </div>
                        );
                     }
                  })}
               </div>

               {/* 分頁按鈕 */}
               {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-4 mt-16">
                     <button 
                        onClick={() => paginate(currentPage - 1)} 
                        disabled={currentPage === 1}
                        className="p-3 rounded-full bg-white border border-slate-200 text-slate-600 hover:bg-orange-50 hover:text-orange-600 disabled:opacity-30 disabled:cursor-not-allowed transition"
                     >
                        <ChevronLeft size={20}/>
                     </button>
                     
                     <span className="font-mono font-bold text-slate-500">
                        Page <span className="text-orange-600">{currentPage}</span> of {totalPages}
                     </span>

                     <button 
                        onClick={() => paginate(currentPage + 1)} 
                        disabled={currentPage === totalPages}
                        className="p-3 rounded-full bg-white border border-slate-200 text-slate-600 hover:bg-orange-50 hover:text-orange-600 disabled:opacity-30 disabled:cursor-not-allowed transition"
                     >
                        <ChevronRight size={20}/>
                     </button>
                  </div>
               )}
            </>
         )}
      </div>

      <Footer />
    </div>
  );
};

export default ArticlePage;