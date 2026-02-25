import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Helmet } from 'react-helmet-async';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ContactSection from '../components/ContactSection';
import { ArrowLeft, Calendar, Share2, Check, Copy } from 'lucide-react';
import { recordView } from '../utils/analytics'; 

const ArticleDetail = () => {
  const { id } = useParams();
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
          const data = docSnap.data();
          setArticle({ id: docSnap.id, ...data });
          // 紀錄瀏覽數
          recordView(docSnap.id, data.title, 'article');
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

  // ★★★ 終極淨水器：專門清除 HTML 標籤與怪異的英文代碼 ★★★
  const getPlainText = (htmlString) => {
    if (!htmlString) return '';
    return htmlString
      .replace(/<[^>]+>/g, '')       // 1. 殺掉所有 <p>, <strong> 等 HTML 標籤
      .replace(/&nbsp;/g, ' ')       // 2. 把英文空白代碼換成「真正的空白」
      .replace(/&amp;/g, '&')        // 3. 處理 & 符號
      .replace(/&lt;/g, '<')         // 4. 處理 < 符號
      .replace(/&gt;/g, '>')         // 5. 處理 > 符號
      .replace(/&quot;/g, '"')       // 6. 處理雙引號
      .replace(/&#39;/g, "'")        // 7. 處理單引號
      .trim();                       // 8. 削掉頭尾多餘的空白
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          // 分享時也套用淨水器，確保標題乾淨
          title: getPlainText(article.title) || '綠芽團隊文章',
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

  // 分類標籤與返回路徑邏輯
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
      
      {/* ★★★ 文章專屬動態 SEO 標籤 (全面套用 getPlainText) ★★★ */}
      <Helmet>
        {/* 動態網頁標題 */}
        <title>{getPlainText(article.title) || '文章內容'} | 綠芽團隊 - 高雄屏東工業地產</title>
        
        {/* 動態 Google 搜尋摘要 (擷取內文前 120 字) */}
        <meta name="description" content={getPlainText(article.content) ? getPlainText(article.content).substring(0, 120) + '...' : '綠芽團隊專業房地產新聞與知識分享'} />
        
        {/* 動態關鍵字 */}
        <meta name="keywords" content={`綠芽團隊, 高雄廠房, 屏東廠房, ${article.category === 'academy' ? '房產小學堂, 稅務法規' : '最新建案, 區域利多'}`} />
        
        {/* LINE / FB 分享預覽設定 (OG Tags) */}
        <meta property="og:title" content={getPlainText(article.title) || '文章內容'} />
        <meta property="og:description" content={getPlainText(article.content) ? getPlainText(article.content).substring(0, 120) + '...' : ''} />
        <meta property="og:type" content="article" />
        {article.image && <meta property="og:image" content={article.image} />}
      </Helmet>

      <Navbar />

      <article className="pt-32 pb-20">
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

          <h1 
            className="font-black text-slate-900 mb-8 leading-tight tracking-tight ql-editor"
            style={{ padding: 0 }}
            dangerouslySetInnerHTML={{ __html: article.title }}
          />

          <div className="w-full h-[1px] bg-slate-200 my-8"></div>
        </div>

        {article.image && (
          <div className="max-w-5xl mx-auto px-6 mb-12">
            <div className="aspect-video w-full relative overflow-hidden rounded-2xl shadow-xl bg-slate-100">
              <img 
                src={article.image} 
                alt={getPlainText(article.title) || '文章封面'} 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}

        <div className="max-w-3xl mx-auto px-6">
          <div 
            className="prose prose-lg prose-slate max-w-none text-slate-700 leading-loose text-justify break-words ql-editor"
            style={{ padding: 0 }}
            dangerouslySetInnerHTML={{ __html: article.content }} 
          />
          
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