import { BlockedSite, StorageData } from "./types";

const urlInput = document.getElementById("url-input") as HTMLInputElement;
const addBtn = document.getElementById("add-btn") as HTMLButtonElement;
const siteList = document.getElementById("site-list") as HTMLUListElement;

// 初期化
document.addEventListener("DOMContentLoaded", loadSites);
addBtn.addEventListener("click", addSite);
urlInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") addSite();
});

// サイト一覧を読み込んで表示
async function loadSites(): Promise<void> {
  const data = await chrome.storage.local.get("blockedSites") as StorageData;
  const sites = data.blockedSites || [];
  renderSites(sites);
}

// サイト一覧を描画
function renderSites(sites: BlockedSite[]): void {
  siteList.innerHTML = "";

  if (sites.length === 0) {
    siteList.innerHTML = `<li class="empty">ブロックするサイトがありません</li>`;
    return;
  }

  sites.forEach(site => {
    const li = document.createElement("li");
    
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = site.enabled;
    checkbox.addEventListener("change", () => toggleSite(site.id));

    const span = document.createElement("span");
    span.textContent = site.urlPattern;

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-btn";
    deleteBtn.textContent = "削除";
    deleteBtn.addEventListener("click", () => deleteSite(site.id));

    li.appendChild(checkbox);
    li.appendChild(span);
    li.appendChild(deleteBtn);
    siteList.appendChild(li);
  });
}

// サイトを追加
async function addSite(): Promise<void> {
  const url = urlInput.value.trim();
  if (!url) return;

  const data = await chrome.storage.local.get("blockedSites") as StorageData;
  const sites = data.blockedSites || [];

  // 既存のIDの最大値 + 1 を新しいIDにする
  const maxId = sites.length > 0 ? Math.max(...sites.map(s => s.id)) : 0;

  // サブドメインなしのパターン
　// const newSiteWithoutSubdomain: BlockedSite = {
  //   id: maxId + 1,
  //   urlPattern: `*://${url}/*`,
  //   enabled: true
  // };

  // サブドメインありのパターン
  // const newSiteWithSubdomain: BlockedSite = {
  //   id: maxId + 2,
  //   urlPattern: `*://*.${url}/*`,
  //   enabled: true
  // };

  const newSite: BlockedSite = {
    id: maxId + 1,
    urlPattern: `||${url}`,
    enabled: true
  };

  sites.push(newSite);
  await chrome.storage.local.set({ blockedSites: sites });

  urlInput.value = "";
  renderSites(sites);
}

// サイトの有効/無効を切り替え
async function toggleSite(id: number): Promise<void> {
  const data = await chrome.storage.local.get("blockedSites") as StorageData;
  const sites = data.blockedSites || [];

  const site = sites.find(s => s.id === id);
  if (site) {
    site.enabled = !site.enabled;
    await chrome.storage.local.set({ blockedSites: sites });
    renderSites(sites);
  }
}

// サイトを削除
async function deleteSite(id: number): Promise<void> {
  const data = await chrome.storage.local.get("blockedSites") as StorageData;
  let sites = data.blockedSites || [];

  sites = sites.filter(s => s.id !== id);
  await chrome.storage.local.set({ blockedSites: sites });
  renderSites(sites);
}

