// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAkXR8wYN07Gu9kH_nI42xsFlH0kTlrYRU",
  authDomain: "web-design-6ff20.firebaseapp.com",
  projectId: "web-design-6ff20",
  storageBucket: "web-design-6ff20.firebasestorage.app",
  messagingSenderId: "469512497182",
  appId: "1:469512497182:web:163e718d61be8531fb260f",
  measurementId: "G-HKRJYGFT4B"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app); // 資料庫
const storage = getStorage(app); // 圖片儲存

export { db, storage };