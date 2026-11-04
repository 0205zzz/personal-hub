
import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

import {
  auth,
  db,
  ADMIN_UID
} from "./firebase.js";


// =====================================
// 1. 網頁年份
// =====================================

const yearElement = document.getElementById("current-year");

if (yearElement) {
  yearElement.textContent = new Date().getFullYear();
}


// =====================================
// 2. 管理員入口
// =====================================

const adminLink = document.getElementById("admin-link");

onAuthStateChanged(auth, (user) => {

  if (!adminLink) return;

  if (user && user.uid === ADMIN_UID) {

    adminLink.textContent = "管理後台";

  } else {

    adminLink.textContent = "管理員登入";

  }

});


// =====================================
// 3. 建立安全的連結元素
// =====================================

function createExternalLink(url, label) {

  if (!url) return null;

  try {

    const parsedUrl = new URL(url);

    // 只允許 HTTP / HTTPS 網址
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return null;
    }

    const link = document.createElement("a");

    link.href = parsedUrl.href;
    link.textContent = label;
    link.target = "_blank";
    link.rel = "noopener noreferrer";

    return link;

  } catch {
    return null;
  }

}


// =====================================
// 4. 載入公開作品
// =====================================

async function loadPublicProjects() {

  const projectList =
    document.getElementById("project-list");

  if (!projectList) return;

  projectList.textContent = "載入作品中...";

  try {

    const snapshot = await getDocs(
      collection(db, "publicProjects")
    );

    projectList.innerHTML = "";

    if (snapshot.empty) {

      projectList.textContent =
        "目前還沒有公開的作品。";

      return;
    }

    snapshot.forEach((item) => {

      const data = item.data();

      const card = document.createElement("article");

      card.className = "content-card";

      const title = document.createElement("h3");

      title.textContent =
        data.title || "未命名作品";

      const description = document.createElement("p");

      description.textContent =
        data.description || "";

      card.append(title, description);

      const link = createExternalLink(
        data.link,
        "查看作品"
      );

      if (link) {
        card.appendChild(link);
      }

      projectList.appendChild(card);

    });

  } catch (error) {

    console.error("讀取公開作品失敗：", error);

    projectList.textContent =
      "作品載入失敗，請稍後再試。";

  }

}


// =====================================
// 5. 載入公開學習紀錄
// =====================================

async function loadPublicLearning() {

  const learningList =
    document.getElementById("learning-list");

  if (!learningList) return;

  learningList.textContent =
    "載入學習紀錄中...";

  try {

    const snapshot = await getDocs(
      collection(db, "publicLearning")
    );

    learningList.innerHTML = "";

    if (snapshot.empty) {

      learningList.textContent =
        "目前還沒有公開的學習紀錄。";

      return;
    }

    snapshot.forEach((item) => {

      const data = item.data();

      const card = document.createElement("article");

      card.className = "content-card";

      const title = document.createElement("h3");

      title.textContent =
        data.title || "未命名紀錄";

      const description = document.createElement("p");

      description.textContent =
        data.description || "";

      card.append(title, description);

      // 學習日期
      if (data.date) {

        const date = document.createElement("p");

        date.textContent =
          "學習日期：" + data.date;

        card.appendChild(date);

      }

      // Notion / GitHub / 其他學習連結
      const link = createExternalLink(
        data.link,
        "查看學習筆記"
      );

      if (link) {
        card.appendChild(link);
      }

      learningList.appendChild(card);

    });

  } catch (error) {

    console.error("讀取公開學習紀錄失敗：", error);

    learningList.textContent =
      "學習紀錄載入失敗，請稍後再試。";

  }

}


// =====================================
// 6. 啟動首頁
// =====================================

loadPublicProjects();

loadPublicLearning();

console.log("Personal Hub 首頁載入成功！");
