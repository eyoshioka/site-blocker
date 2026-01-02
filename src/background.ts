import { BlockedSite, StorageData } from "./types";

// 拡張機能のインストール時に初期化
chrome.runtime.onInstalled.addListener(async () => {
  const data = await chrome.storage.local.get("blockedSites");
  if (!data.blockedSites) {
    await chrome.storage.local.set({ blockedSites: [] });
  }
  await updateBlockRules();
});

// ストレージが変更されたらルールを更新
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.blockedSites) {
    updateBlockRules();
  }
});

// タブのURL変更を監視(SPA対策)
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.url || changeInfo.status === 'loading') {
    const url = changeInfo.url || tab.url;
    if (url) {
      await checkAndBlockUrl(tabId, url);
    }
  }
});

// 新しいタブを開いた時
chrome.tabs.onCreated.addListener(async (tab) => {
  if (tab.url && tab.id) {
    await checkAndBlockUrl(tab.id, tab.url);
  }
});

// URL をチェックしてブロック
async function checkAndBlockUrl(tabId: number, url: string): Promise<void> {
  const data = await chrome.storage.local.get("blockedSites") as StorageData;
  const sites = data.blockedSites || [];

  for (const site of sites) {
    if (!site.enabled) continue;

    // ドメインを抽出して比較
    const domain = site.urlPattern.replace('||', '');
    if (url.includes(domain)) {
      const blockedUrl = chrome.runtime.getURL('blocked.html');
      // 無限ループ防止
      if (!url.startsWith(blockedUrl)) {
        chrome.tabs.update(tabId, { url: blockedUrl });
      }
      break;
    }
  }
}

// ブロックルールを更新する関数
async function updateBlockRules(): Promise<void> {
  const data = await chrome.storage.local.get("blockedSites") as StorageData;
  const sites = data.blockedSites || [];

  // 既存ルールを全て削除
  const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
  const existingIds = existingRules.map(rule => rule.id);

  // 新しいルールを作成
  const newRules: chrome.declarativeNetRequest.Rule[] = sites
    .filter(site => site.enabled)
    .map(site => ({
      id: site.id,
      priority: 1,
      action: {
        type: chrome.declarativeNetRequest.RuleActionType.REDIRECT,
        redirect: {
          extensionPath: "/blocked.html"
        }
      },
      condition: {
        urlFilter: site.urlPattern,
        resourceTypes: [chrome.declarativeNetRequest.ResourceType.MAIN_FRAME]
      }
    }));

  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: existingIds,
    addRules: newRules
  });

  console.log(`Block rules updated: ${newRules.length} sites blocked`);
}

