import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase'; // 確認您的 firebase 路徑

const SitemapGenerator = () => {
  const [xmlData, setXmlData] = useState('正在努力去資料庫抓資料中，請稍候...');

  useEffect(() => {
    const generateSitemap = async () => {
      // ⚠️ 請把這裡換成您「真正上線的網址」
      const baseUrl = "https://kh-pt-factory.com"; 

      let sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n`;
      sitemap += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

      // 1. 寫入固定的靜態頁面
      const staticPages = ['/', '/works', '/contact', '/about'];
      staticPages.forEach(page => {
        sitemap += `  <url>\n    <loc>${baseUrl}${page}</loc>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>\n`;
      });

      try {
        // 2. 去資料庫抓所有「廠房物件」的中文標題
        const propSnap = await getDocs(collection(db, "properties"));
        propSnap.forEach(doc => {
          const data = doc.data();
          const title = data.basicInfo?.title || doc.id;
          // Google 地圖的網址必須經過編碼
          sitemap += `  <url>\n    <loc>${baseUrl}/property/${encodeURIComponent(title)}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
        });

        // 3. 去資料庫抓所有「小學堂文章」
        const articleSnap = await getDocs(collection(db, "articles"));
        articleSnap.forEach(doc => {
          sitemap += `  <url>\n    <loc>${baseUrl}/article/${doc.id}</loc>\n    <changefreq>monthly</changefreq>\n    <priority>0.6</priority>\n  </url>\n`;
        });

      } catch (error) {
        console.error("抓取失敗", error);
        setXmlData("抓取資料庫失敗，請看 console");
        return;
      }

      sitemap += `</urlset>`;
      setXmlData(sitemap);
    };

    generateSitemap();
  }, []);

  return (
    <div className="p-10">
      <h1 className="text-2xl font-bold mb-4">請複製以下所有內容，並存成 sitemap.xml</h1>
      <textarea 
        className="w-full h-[80vh] p-4 font-mono text-sm border-2 border-slate-300 rounded"
        value={xmlData} 
        readOnly 
      />
    </div>
  );
};

export default SitemapGenerator;