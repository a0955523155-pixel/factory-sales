const functions = require("firebase-functions");
const admin = require("firebase-admin");

// 初始化 Firebase Admin (用來連線資料庫)
admin.initializeApp();
const db = admin.firestore();

exports.renderShare = functions.https.onRequest(async (req, res) => {
  try {
    // 1. 從網址擷取「中文案名」並解碼 (例如: /share/華富工業城一期)
    const pathParts = req.path.split('/');
    const propertyTitle = decodeURIComponent(pathParts[2] || '');

    // 如果沒有案名，直接回傳錯誤
    if (!propertyTitle) {
      return res.status(404).send("找不到案場");
    }

    // 2. 設定預設的「保底」圖文 (萬一資料庫找不到時顯示)
    let title = "綠芽團隊｜精選廠房與工業地";
    let desc = "點擊查看綠芽團隊為您推薦的精選優質廠房與工業地。";
    let image = "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop";

    // 3. 去資料庫尋找這筆案場的資料
    const q = db.collection("properties").where("basicInfo.title", "==", propertyTitle).limit(1);
    const snapshot = await q.get();

    if (!snapshot.empty) {
      const docData = snapshot.docs[0].data();
      if (docData.basicInfo) {
        title = `${docData.basicInfo.title} | 綠芽團隊`;
        desc = docData.basicInfo.description ? docData.basicInfo.description.substring(0, 100) + '...' : desc;
        // 抓取物件的封面圖，如果沒有就用預設圖
        image = docData.basicInfo.thumb || image;
      }
    }

    // 4. 產出「專門給 LINE / FB 機器人看」的靜態 HTML
    const html = `
      <!DOCTYPE html>
      <html lang="zh-TW">
        <head>
          <meta charset="utf-8">
          <title>${title}</title>
          <meta name="description" content="${desc}">
          
          <meta property="og:title" content="${title}">
          <meta property="og:description" content="${desc}">
          <meta property="og:image" content="${image}">
          <meta property="og:type" content="website">
          <meta property="og:url" content="https://${req.hostname}${req.url}">
          
          <meta name="twitter:card" content="summary_large_image">
          <meta name="twitter:title" content="${title}">
          <meta name="twitter:description" content="${desc}">
          <meta name="twitter:image" content="${image}">
        </head>
        <body style="background-color: #f8fafc; text-align: center; padding-top: 50px; font-family: sans-serif;">
          <h2 style="color: #64748b;">正在為您開啟綠芽團隊案場...</h2>
          <script>
            // 機器人不會執行這行，但真人點擊預覽圖進來時，會瞬間跳轉回真正的 React 網頁！
            window.location.href = "/property/${encodeURIComponent(propertyTitle)}";
          </script>
        </body>
      </html>
    `;

    res.status(200).send(html);
  } catch (error) {
    console.error("Error fetching property:", error);
    res.status(500).send("伺服器發生錯誤，請稍後再試。");
  }
});