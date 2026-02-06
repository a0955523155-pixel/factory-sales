import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ContactSection from '../components/ContactSection';
import { ArrowLeft, Calendar, Share2, Check, Copy } from 'lucide-react';

const ArticleDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
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

  // 分享功能：優先使用原生分享，若不支援則複製連結
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: article.title,
          text: '快來看看這篇文章！',
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing', error);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-orange-500"></div>
    </div>
  );

  if (!article) return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <h2 className="text-2xl font-bold text-slate-800 mb-4">找不到此文章</h2>
      <p className="text-slate-500 mb-8">該文章可能已被刪除或連結錯誤。</p>
      <Link to="/" className="bg-orange-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-orange-700 transition">回首頁</Link>
    </div>
  );

  // 分類標籤樣式與返回路徑邏輯
  const categoryMap = {
    news_local: { label: '本地新聞', color: 'bg-blue-600', backPath: '/news/local' },
    news_project: { label: '建案新訊', color: 'bg-green-600', backPath: '/news/project' },
    academy: { label: '房地產小學堂', color: 'bg-purple-600', backPath: '/academy' },
    works: { label: '經典作品', color: 'bg-orange-600', backPath: '/works' },
    about: { label: '關於我們', color: 'bg-slate-600', backPath: '/about' }
  };

  const catInfo = categoryMap[article.category] || { label: '最新消息', color: 'bg-slate-600', backPath: '/' };

  return (
    <div className="font-sans min-h-screen bg-white">
      <Navbar />

      <article className="pt-32 pb-20">
        {/* 文章頭部資訊 */}
        <div className="max-w-4xl mx-auto px-6 mb-10">
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <Link to={catInfo.backPath} className="flex items-center gap-1 text-slate-500 hover:text-orange-600 transition font-bold text-sm group">
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition"/> 返回列表
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

          <div className="w-full h-[1px] bg-slate-200 my-8"></div>
        </div>

        {/* 封面大圖 */}
        {article.image && (
          <div className="max-w-5xl mx-auto px-6 mb-12">
            <div className="aspect-video w-full relative overflow-hidden rounded-2xl shadow-xl bg-slate-100">
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
          <div className="prose prose-lg prose-slate max-w-none text-slate-700 leading-loose whitespace-pre-line text-justify break-words">
            {article.content}
          </div>
          
          <div className="mt-16 pt-8 border-t border-slate-100 text-center">
              <p className="text-slate-400 font-bold text-sm mb-4">覺得這篇文章有幫助嗎？</p>
              <button 
                onClick={handleShare} 
                className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-full font-bold transition shadow-sm ${copied ? 'bg-green-100 text-green-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}
              >
                {copied ? <Check size={16}/> : <Share2 size={16}/>}
                {copied ? '連結已複製' : '分享文章'}
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