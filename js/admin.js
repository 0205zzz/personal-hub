
import {
  signInWithPopup,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import {
  collection,
  doc,
  writeBatch,
  getDocs,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

import {
  auth,
  googleProvider,
  db,
  ADMIN_UID
} from "./firebase.js";

// =====================================
// 1. 取得 HTML 元素
// =====================================

const loginButton = document.getElementById("google-login");
const logoutButton = document.getElementById("google-logout");
const loginStatus = document.getElementById("login-status");
const adminContent = document.getElementById("admin-content");

const projectForm = document.getElementById("project-form");
const learningForm = document.getElementById("learning-form");

const projectList = document.getElementById("admin-project-list");
const learningList = document.getElementById("admin-learning-list");

const editDialog = document.getElementById("edit-dialog");
const editForm = document.getElementById("edit-form");

const editTitle = document.getElementById("edit-title");
const editDescription = document.getElementById("edit-description");
const editLink = document.getElementById("edit-link");
const editDate = document.getElementById("edit-date");
const editVisibility = document.getElementById("edit-visibility");

const editLinkGroup = document.getElementById("edit-link-group");
const editDateGroup = document.getElementById("edit-date-group");

const editDialogTitle = document.getElementById("edit-dialog-title");
const saveEditButton = document.getElementById("save-edit");

const yearElement = document.getElementById("current-year");

if (yearElement) {
  yearElement.textContent = new Date().getFullYear();
}

// 目前登入的管理員
let currentAdmin = null;

// 目前正在編輯的資料
let editingRecord = null;


// =====================================
// 2. Google 登入
// =====================================

loginButton.addEventListener("click", async () => {

  try {

    loginStatus.textContent = "正在登入...";

    googleProvider.setCustomParameters({
      prompt: "select_account"
    });

    await signInWithPopup(auth, googleProvider);

  } catch (error) {

    console.error("登入失敗：", error);

    loginStatus.textContent =
      "登入失敗：" + error.message;

  }

});


// =====================================
// 3. 登出
// =====================================

logoutButton.addEventListener("click", async () => {

  try {

    await signOut(auth);

    loginStatus.textContent = "已登出。";

  } catch (error) {

    console.error("登出失敗：", error);

    loginStatus.textContent =
      "登出失敗：" + error.message;

  }

});


// =====================================
// 4. 確認管理員身份
// =====================================

onAuthStateChanged(auth, async (user) => {

  if (!user) {

    currentAdmin = null;

    adminContent.hidden = true;
    loginButton.hidden = false;
    logoutButton.hidden = true;

    loginStatus.textContent =
      "請使用管理員 Google 帳號登入。";

    return;
  }

  // 使用 Firebase UID 判斷管理員
  if (user.uid !== ADMIN_UID) {

    currentAdmin = null;

    adminContent.hidden = true;
    loginButton.hidden = true;
    logoutButton.hidden = true;

    loginStatus.textContent =
      "此帳號沒有管理權限，正在登出...";

    await signOut(auth);

    return;
  }

  currentAdmin = user;

  adminContent.hidden = false;
  loginButton.hidden = true;
  logoutButton.hidden = false;

  loginStatus.textContent =
    "管理員登入成功：" + user.email;

  console.log("管理員登入成功！");

  await loadMyData();

});


// =====================================
// 5. 建立公開資料的 Collection 名稱
// =====================================

function getPublicCollectionName(type) {

  return type === "projects"
    ? "publicProjects"
    : "publicLearning";

}


// =====================================
// 6. 新增資料
// =====================================

async function saveRecord(type, data, visibility) {

  if (!currentAdmin) {
    throw new Error("尚未通過管理員驗證。");
  }

  // 建立私人資料位置
  const privateCollection = collection(
    db,
    "users",
    currentAdmin.uid,
    type
  );

  const privateDoc = doc(privateCollection);

  // 使用 Batch 確保私人和公開資料一起更新
  const batch = writeBatch(db);

  const privateData = {
    ...data,
    visibility: visibility,
    createdAt: serverTimestamp()
  };

  batch.set(privateDoc, privateData);

  const publicDoc = doc(
    db,
    getPublicCollectionName(type),
    privateDoc.id
  );

  if (visibility === "public") {

    // 公開資料另外儲存一份
    batch.set(publicDoc, {
      ...data,
      createdAt: serverTimestamp()
    });

  } else {

    // 私人資料不建立公開副本
    batch.delete(publicDoc);

  }

  await batch.commit();

}


// =====================================
// 7. 讀取管理員自己的資料
// =====================================

async function loadMyData() {

  if (!currentAdmin) return;

  try {

    const projectSnapshot = await getDocs(
      collection(
        db,
        "users",
        currentAdmin.uid,
        "projects"
      )
    );

    const learningSnapshot = await getDocs(
      collection(
        db,
        "users",
        currentAdmin.uid,
        "learning"
      )
    );

    renderList(
      projectList,
      projectSnapshot,
      "目前尚無作品資料。",
      "projects"
    );

    renderList(
      learningList,
      learningSnapshot,
      "目前尚無學習紀錄。",
      "learning"
    );

  } catch (error) {

    console.error("讀取資料失敗：", error);

    loginStatus.textContent =
      "讀取資料失敗：" + error.message;

  }

}


// =====================================
// 8. 顯示資料列表
// =====================================

function renderList(container, snapshot, emptyMessage, type) {

  if (!container) return;

  container.innerHTML = "";

  if (snapshot.empty) {

    const empty = document.createElement("p");
    empty.className = "empty-message";
    empty.textContent = emptyMessage;

    container.appendChild(empty);

    return;
  }

  snapshot.forEach((item) => {

    const data = item.data();

    const card = document.createElement("div");
    card.className = "content-card admin-content-card";

    const title = document.createElement("h3");
    title.textContent = data.title || "未命名";

    const description = document.createElement("p");
    description.textContent =
      data.description || "";

    const visibility = document.createElement("p");
    visibility.className = "record-visibility";

    visibility.textContent =
      data.visibility === "public"
        ? "公開"
        : "私人";

    // 編輯按鈕
    const editButton = document.createElement("button");

    editButton.type = "button";
    editButton.className = "admin-button";
    editButton.textContent = "編輯";

    editButton.addEventListener("click", () => {
      openEditDialog(item.id, type, data);
    });

    // 刪除按鈕
    const deleteButton = document.createElement("button");

    deleteButton.type = "button";
    deleteButton.className = "admin-button delete-button";
    deleteButton.textContent = "刪除";

    deleteButton.addEventListener("click", () => {
      deleteRecord(item.id, type, data.title);
    });

    card.append(
      title,
      description,
      visibility
    );

    // 顯示資料連結
    if (data.link) {

      const link = document.createElement("a");

      link.href = data.link;
      link.textContent = "查看相關連結";
      link.target = "_blank";
      link.rel = "noopener noreferrer";

      card.appendChild(link);

    }

    // 顯示學習日期
    if (data.date) {

      const date = document.createElement("p");

      date.textContent =
        "學習日期：" + data.date;

      card.appendChild(date);

    }

    const buttonGroup = document.createElement("div");

    buttonGroup.className = "record-button-group";

    buttonGroup.append(editButton, deleteButton);

    card.appendChild(buttonGroup);

    container.appendChild(card);

  });

}


// =====================================
// 9. 開啟大型編輯視窗
// =====================================

function openEditDialog(id, type, oldData) {

  if (!currentAdmin) return;

  editingRecord = {
    id,
    type,
    oldData
  };

  editDialogTitle.textContent =
    type === "projects"
      ? "編輯作品"
      : "編輯學習紀錄";

  // 填入舊資料
  editTitle.value = oldData.title || "";
  editDescription.value =
    oldData.description || "";
  editLink.value = oldData.link || "";
  editDate.value = oldData.date || "";
  editVisibility.value =
    oldData.visibility || "private";

  // 作品與學習紀錄都可以放連結
  editLinkGroup.hidden = false;

  if (type === "learning") {
    editDateGroup.hidden = false;
    editDate.value = oldData.date || "";
  } else {
    editDateGroup.hidden = true;
    editDate.value = "";
  }
  
  // 只有學習紀錄需要日期
  //editDateGroup.hidden =
    //type !== "learning";

  editDialog.showModal();

}


// =====================================
// 10. 關閉編輯視窗
// =====================================

function closeEditDialog() {

  editDialog.close();

  editingRecord = null;

  editForm.reset();

}

document
  .getElementById("close-edit")
  .addEventListener("click", closeEditDialog);

document
  .getElementById("cancel-edit")
  .addEventListener("click", closeEditDialog);

// 點擊背景關閉
editDialog.addEventListener("click", (event) => {

  if (event.target === editDialog) {
    closeEditDialog();
  }

});


// =====================================
// 11. 儲存編輯結果
// =====================================

editForm.addEventListener("submit", async (event) => {

  event.preventDefault();

  if (!currentAdmin || !editingRecord) return;

  const { id, type, oldData } = editingRecord;

  const title = editTitle.value.trim();

  const description = editDescription.value.trim();

  const link = editLink.value.trim();

  const date = editDate.value;

  const visibility = editVisibility.value;

  if (!title || !description) {

    alert("標題和內容不能空白。");

    return;
  }

  if (!["public", "private"].includes(visibility)) {

    alert("公開狀態設定錯誤。");

    return;
  }

  const data = {
    title,
    description,
    link
  };

  if (type === "learning") {
    data.date = date;
  }

  try {

    saveEditButton.disabled = true;
    saveEditButton.textContent = "儲存中...";

    const batch = writeBatch(db);

    // 私人資料位置
    const privateDoc = doc(
      db,
      "users",
      currentAdmin.uid,
      type,
      id
    );

    batch.set(privateDoc, {
      ...data,
      visibility,
      createdAt: oldData.createdAt || serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    // 公開資料位置
    const publicDoc = doc(
      db,
      getPublicCollectionName(type),
      id
    );

    if (visibility === "public") {

      // 改成公開：建立或更新公開副本
      batch.set(publicDoc, {
        ...data,
        createdAt: oldData.createdAt || serverTimestamp(),
        updatedAt: serverTimestamp()
      });

    } else {

      // 改成私人：刪除公開副本
      batch.delete(publicDoc);

    }

    await batch.commit();

    alert("編輯成功！");

    closeEditDialog();

    await loadMyData();

  } catch (error) {

    console.error("編輯失敗：", error);

    alert("編輯失敗：" + error.message);

  } finally {

    saveEditButton.disabled = false;
    saveEditButton.textContent = "儲存修改";

  }

});


// =====================================
// 12. 刪除資料
// =====================================

async function deleteRecord(id, type, title) {

  if (!currentAdmin) return;

  const confirmed = confirm(
    `確定要刪除「${title || "未命名"}」嗎？\n\n私人資料與公開副本都會刪除，而且無法復原。`
  );

  if (!confirmed) return;

  try {

    const batch = writeBatch(db);

    // 刪除私人資料
    const privateDoc = doc(
      db,
      "users",
      currentAdmin.uid,
      type,
      id
    );

    batch.delete(privateDoc);

    // 同時刪除公開副本
    const publicDoc = doc(
      db,
      getPublicCollectionName(type),
      id
    );

    batch.delete(publicDoc);

    await batch.commit();

    alert("刪除成功！");

    await loadMyData();

  } catch (error) {

    console.error("刪除失敗：", error);

    alert("刪除失敗：" + error.message);

  }

}


// =====================================
// 13. 新增作品
// =====================================

projectForm.addEventListener("submit", async (event) => {

  event.preventDefault();

  if (!currentAdmin) {

    alert("請先登入管理員帳號！");

    return;
  }

  const title =
    document.getElementById("project-title").value.trim();

  const description =
    document.getElementById("project-description").value.trim();

  const link =
    document.getElementById("project-link").value.trim();

  const visibility =
    document.getElementById("project-visibility").value;

  if (!title || !description) {

    alert("作品名稱和介紹不能空白。");

    return;
  }

  try {

    await saveRecord(
      "projects",
      {
        title,
        description,
        link
      },
      visibility
    );

    alert("作品新增成功！");

    projectForm.reset();

    await loadMyData();

  } catch (error) {

    console.error("新增作品失敗：", error);

    alert("新增作品失敗：" + error.message);

  }

});


// =====================================
// 14. 新增學習紀錄
// =====================================

learningForm.addEventListener("submit", async (event) => {

  event.preventDefault();

  if (!currentAdmin) {

    alert("請先登入管理員帳號！");

    return;
  }

  const title =
    document.getElementById("learning-title").value.trim();

  const description =
    document.getElementById("learning-description").value.trim();

  const date =
    document.getElementById("learning-date").value;

  const link =
    document.getElementById("learning-link").value.trim();

  const visibility =
    document.getElementById("learning-visibility").value;

  if (!title || !description) {

    alert("學習主題和內容不能空白。");

    return;
  }

  try {

    await saveRecord(
      "learning",
      {
        title,
        description,
        date,
        link
      },
      visibility
    );

    alert("學習紀錄新增成功！");

    learningForm.reset();

    await loadMyData();

  } catch (error) {

    console.error("新增學習紀錄失敗：", error);

    alert("新增學習紀錄失敗：" + error.message);

  }

});


console.log("Admin page loaded successfully.");
