import { toUrlPattern } from "./pattern";
import { loadSites, saveSites } from "./storage";
import type { BlockedSite } from "./types";

const urlInput = document.getElementById("url-input") as HTMLInputElement;
const addBtn = document.getElementById("add-btn") as HTMLButtonElement;
const siteList = document.getElementById("site-list") as HTMLUListElement;

document.addEventListener("DOMContentLoaded", () => {
  void showSites();
});
addBtn.addEventListener("click", () => {
  void addSite();
});
urlInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    void addSite();
  }
});

async function showSites(): Promise<void> {
  renderSites(await loadSites());
}

function renderSites(sites: BlockedSite[]): void {
  siteList.innerHTML = "";

  if (sites.length === 0) {
    siteList.innerHTML = `<li class="empty">ブロックするサイトがありません</li>`;
    return;
  }

  for (const site of sites) {
    siteList.appendChild(createSiteItem(site));
  }
}

function createSiteItem(site: BlockedSite): HTMLLIElement {
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = site.enabled;
  checkbox.addEventListener("change", () => {
    void toggleSite(site.id);
  });

  const span = document.createElement("span");
  span.textContent = site.urlPattern;

  const deleteBtn = document.createElement("button");
  deleteBtn.className = "delete-btn";
  deleteBtn.textContent = "削除";
  deleteBtn.addEventListener("click", () => {
    void deleteSite(site.id);
  });

  const li = document.createElement("li");
  li.append(checkbox, span, deleteBtn);
  return li;
}

async function addSite(): Promise<void> {
  const domain = urlInput.value.trim();
  if (domain === "") {
    return;
  }

  const sites = await loadSites();
  const maxId = Math.max(0, ...sites.map((s) => s.id));
  sites.push({
    id: maxId + 1,
    urlPattern: toUrlPattern(domain),
    enabled: true,
  });
  await saveSites(sites);

  urlInput.value = "";
  renderSites(sites);
}

async function toggleSite(id: number): Promise<void> {
  const sites = await loadSites();
  const site = sites.find((s) => s.id === id);
  if (site === undefined) {
    return;
  }

  site.enabled = !site.enabled;
  await saveSites(sites);
  renderSites(sites);
}

async function deleteSite(id: number): Promise<void> {
  const sites = (await loadSites()).filter((s) => s.id !== id);
  await saveSites(sites);
  renderSites(sites);
}
