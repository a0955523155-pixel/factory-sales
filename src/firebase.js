// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth"; // 引入 Auth

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAkXR8wYN07Gu9kH_nI42xsFlH0kTlrYRU",
  authDomain: "web-design-6ff20.firebaseapp.com",
  projectId: "web-design-6ff20",
  storageBucket: "web-design-6ff20.firebasestorage.app",
  messagingSenderId: "469512497182",
  appId: "1:469512497182:web:163e718d61be8531fb260f",
  measurementId: "G-HKRJYGFT4B"
};

// ==========================================
// 1. 先讓 app 誕生！(這行一定要在最前面)
// ==========================================
const app = initializeApp(firebaseConfig);

// ==========================================
// 2. 誕生之後，才能把 app 交給資料庫、儲存桶跟驗證機制！
// ==========================================
const auth = getAuth(app);       // 驗證
const db = getFirestore(app);    // 資料庫
const storage = getStorage(app); // 圖片儲存

// ==========================================
// 3. 把他們三個都匯出，讓別的檔案可以使用
// ==========================================
export { db, storage, auth };