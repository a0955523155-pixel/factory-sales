import { db } from '../firebase';
import { doc, setDoc, increment } from 'firebase/firestore';

export const recordView = async (pageId, pageTitle, type) => {
  // ★★★ 新增防呆：如果是管理員 (localStorage 有 isAuth)，直接結束，不紀錄流量 ★★★
  if (localStorage.getItem('isAuth') === 'true') {
    console.log("管理者瀏覽，不計入流量統計");
    return;
  }

  try {
    // 1. 取得今天日期 (YYYY-MM-DD)
    const today = new Date().toISOString().split('T')[0];
    const analyticsRef = doc(db, "analytics", today);

    // 2. 判斷來源 (Referrer)
    const referrer = document.referrer;
    let source = "直接訪問 (Direct)";
    
    if (referrer.includes("google")) source = "Google 搜尋";
    else if (referrer.includes("facebook") || referrer.includes("fb")) source = "Facebook";
    else if (referrer.includes("instagram")) source = "Instagram";
    else if (referrer.includes("line")) source = "LINE";
    else if (window.location.hostname && referrer.includes(window.location.hostname)) source = "站內連結";
    else if (referrer) source = "其他網站";

    // 3. 準備更新資料
    const updateData = {
      date: today,
      totalViews: increment(1),
      [`sources.${source}`]: increment(1),
      [`pages.${pageId}.title`]: pageTitle,
      [`pages.${pageId}.count`]: increment(1),
      [`pages.${pageId}.type`]: type
    };

    // 4. 寫入資料庫
    await setDoc(analyticsRef, updateData, { merge: true });

  } catch (error) {
    console.error("Analytics Error:", error);
  }
};