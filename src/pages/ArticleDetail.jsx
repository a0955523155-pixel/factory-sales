import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ContactSection from '../components/ContactSection';
import { ArrowLeft, Calendar, Tag, Clock, Share2 } from 'lucide-react';

const ArticleDetail = () => {
  const { id } = useParams(); // 抓取網址上的 ID
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 進入頁面時強制捲動到最上方
    window.scrollTo(0, 0);

    const fetchArticle = async () => {
      try {
        const docRef = doc(db, "articles", id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setArticle({ id: docSnap.id, ...docSnap.data() });
        } else {
          console.log("No such document!");
        }
      } catch (error) {
        console.error("Error fetching article:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchArticle();
  }, [id]);

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-orange-500"></div>
    </div>
  );

  if (!article) return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <h2 className="text-2xl font-bold text-slate-800 mb-4">找不到此文章</h2>
      <p className="text-slate-500 mb-8">該文章可能已被刪除或連結錯誤。</p>
      <Link to="/" className="bg-orange-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-orange-700 transition">回首頁</Link>
    </div>
  );

  // 分類標籤樣式
  const categoryMap = {
    news_local: { label: '本地新聞', color: 'bg-blue-600' },
    news_project: { label: '建案新訊', color: 'bg-green-600' },
    academy: { label: '房地產小學堂', color: 'bg-purple-600' },
    works: { label: '經典作品', color: 'bg-orange-600' },
    about: { label: '關於我們', color: 'bg-slate-600' }
  };

  const catInfo = categoryMap[article.category] || { label: '最新消息', color: 'bg-slate-600' };

  return (
    <div className="font-sans min-h-screen bg-white">
      <Navbar />

      <article className="pt-32 pb-20">
        {/* 文章頭部資訊 */}
        <div className="max-w-4xl mx-auto px-6 mb-10">
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <Link to="/" className="flex items-center gap-1 text-slate-500 hover:text-orange-600 transition font-bold text-sm">
              <ArrowLeft size={16}/> 返回首頁
            </Link>
            <span className={`${catInfo.color} text-white text-xs px-3 py-1 rounded-full font-bold shadow-sm`}>
              {catInfo.label}
            </span>
            <span className="flex items-center gap-1 text-slate-400 text-xs font-mono">
              <Calendar size={12}/> {article.date}
            </span>
          </div>

          <h1 className="text-3xl md:text-5xl font-black text-slate-900 mb-8 leading-tight tracking-tight">
            {article.title}
          </h1>

          {/* 分隔線 */}
          <div className="w-full h-[1px] bg-slate-200 my-8"></div>
        </div>

        {/* 封面大圖 (如果有) */}
        {article.image && (
          <div className="max-w-5xl mx-auto px-6 mb-12">
            <div className="aspect-video w-full relative overflow-hidden rounded-2xl shadow-xl">
              <img 
                src={article.image} 
                alt={article.title} 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}

        {/* 文章內容 */}
        <div className="max-w-3xl mx-auto px-6">
          <div className="prose prose-lg prose-slate max-w-none text-slate-700 leading-loose whitespace-pre-line text-justify">
            {article.content}
          </div>
          
          <div className="mt-16 pt-8 border-t border-slate-100 text-center">
             <p className="text-slate-400 font-bold text-sm mb-4">覺得這篇文章有幫助嗎？</p>
             <button onClick={()=>navigator.share({title: article.title, url: window.location.href}).catch(()=>{})} className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-600 px-6 py-2 rounded-full font-bold transition">
                <Share2 size={16}/> 分享文章
             </button>
          </div>
        </div>
      </article>

      <ContactSection dark={false} />
      <Footer />
    </div>
  );
};

export default ArticleDetail;