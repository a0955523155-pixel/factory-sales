const functions = require("firebase-functions");
const admin = require("firebase-admin");

// 初始化連線
admin.initializeApp();
const db = admin.firestore();

exports.renderShare = functions.https.onRequest(async (req, res) => {
  // 1. 取得網址上的 ID (例如 /share/ctlDBQ6SL...)
  const pathParts = req.path.split('/');
  const propertyId = pathParts[2];

  if (!propertyId) {
    return res.status(404).send("找不到案場");
  }

  try {
    // 2. 用 ID 直接去資料庫精準抓取這筆案場
    const docRef = db.collection("properties").doc(propertyId);
    const docSnap = await docRef.get();

    // 預設保底圖文
    let title = "綠芽團隊｜精選廠房與工業地";
    let desc = "點擊查看綠芽團隊為您推薦的精選優質廠房與工業地。";
    let image = "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop"; 

    if (docSnap.exists) {
      const docData = docSnap.data();
      if (docData.basicInfo) {
        title = `${docData.basicInfo.title} | 綠芽團隊`;
        desc = docData.basicInfo.description ? docData.basicInfo.description.substring(0, 100) + '...' : desc;
        image = docData.basicInfo.thumb || image;
      }
    }

    // 3. 產出給 LINE 看的純淨 HTML，並讓人類精準跳轉回 /property/ID
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
        </head>
        <body style="background-color: #f8fafc; text-align: center; padding-top: 50px; font-family: sans-serif;">
          <h2 style="color: #64748b;">正在為您開啟綠芽團隊案場...</h2>
          <script>
            // 這次跳轉的是系統 ID，保證能正確打開案場網頁！
            window.location.href = "/property/${propertyId}";
          </script>
        </body>
      </html>
    `;

    res.status(200).send(html);
  } catch (error) {
    console.error("Error fetching property:", error);
    res.status(500).send("伺服器錯誤");
  }
});