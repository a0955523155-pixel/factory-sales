import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { db } from '../firebase'; 
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const AnalyticsTracker = () => {
  const location = useLocation();

  useEffect(() => {
    const trackPageView = async () => {
      // ★★★ 防狂刷機制：檢查這個人這次開啟網頁時，是否已經看過這頁了 ★★★
      // 我們給這頁一個專屬的記憶鑰匙，例如 "viewed_/property/123"
      const sessionKey = `viewed_${location.pathname}`;
      
      if (sessionStorage.getItem(sessionKey)) {
        return; // 如果記憶裡有，代表他剛剛看過了，直接跳出不寫入資料庫！
      }
      
      // 如果沒看過，就在記憶裡打個勾
      sessionStorage.setItem(sessionKey, 'true');

      try {
        let referer = document.referrer;
        let sourceCategory = "直接輸入網址或書籤";

        if (referer) {
          if (referer.includes("google.com")) sourceCategory = "Google 搜尋/廣告";
          else if (referer.includes("facebook.com") || referer.includes("fb.com")) sourceCategory = "Facebook";
          else if (referer.includes("line.me")) sourceCategory = "LINE";
          else if (referer.includes("yahoo.com")) sourceCategory = "Yahoo 搜尋";
          else sourceCategory = referer; 
        }

        await addDoc(collection(db, "page_views"), {
          path: location.pathname,
          source: sourceCategory, 
          timestamp: serverTimestamp(),
          userAgent: navigator.userAgent 
        });
        
      } catch (error) {
        console.error("追蹤紀錄寫入失敗:", error);
      }
    };

    trackPageView();
    
  }, [location]);

  return null; 
};

export default AnalyticsTracker;