// 引入 Firebase SDK
import { initializeApp } from
  "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";

import { getAuth, GoogleAuthProvider } from
  "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import { getFirestore } from
  "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";


// ==============================
// Firebase 專案設定
// ==============================

// 唯一管理員的 Firebase UID
const ADMIN_UID = "xHvKbCAv6CaHwRbKsVxofFN0oZm1";

const firebaseConfig = {
  apiKey: "AIzaSyALzarlsROM9X27vJnr3g07m0pSRUAEHY4",
  authDomain: "my-personal-hub-64128.firebaseapp.com",
  projectId: "my-personal-hub-64128",
  storageBucket: "my-personal-hub-64128.firebasestorage.app",
  messagingSenderId: "259765317610",
  appId: "1:259765317610:web:07cd8dc6b8d91846ea0c93"
};


// ==============================
// 初始化 Firebase
// ==============================

const app = initializeApp(firebaseConfig);


// ==============================
// 初始化登入功能
// ==============================

const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();


// ==============================
// 初始化資料庫
// ==============================

const db = getFirestore(app);


// ==============================
// 匯出，讓其他 JS 檔案使用
// ==============================

export {
  app,
  auth,
  googleProvider,
  db,
  ADMIN_UID
};

console.log("Firebase 初始化完成！");
console.log("目前連接的專案：", app.options.projectId);