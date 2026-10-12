import { matchesUrl, toUrlFilter } from "./pattern";
import { loadSites, onSitesChanged } from "./storage";
import type { BlockedSite } from "./types";

const BLOCKED_PAGE = "blocked.html";
const RULE_PRIORITY = 1;

chrome.runtime.onInstalled.addListener(() => {
  void updateBlockRules();
});

onSitesChanged(() => {
  void updateBlockRules();
});

// SPA の画面遷移はリクエストを伴わず declarativeNetRequest で止められないため、タブの URL も監視する
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  const url =
    changeInfo.url ?? (changeInfo.status === "loading" ? tab.url : undefined);
  if (url !== undefined) {
    void checkAndBlockUrl(tabId, url);
  }
});

chrome.tabs.onCreated.addListener((tab) => {
  if (tab.id !== undefined && tab.url !== undefined) {
    void checkAndBlockUrl(tab.id, tab.url);
  }
});

async function checkAndBlockUrl(tabId: number, url: string): Promise<void> {
  const sites = await loadSites();
  const blocked = sites.some(
    (site) => site.enabled && matchesUrl(site.urlPattern, url)
  );
  const blockedUrl = chrome.runtime.getURL(BLOCKED_PAGE);
  // ブロック画面自体を再びブロックしないようにする
  if (blocked && !url.startsWith(blockedUrl)) {
    await chrome.tabs.update(tabId, { url: blockedUrl });
  }
}

async function updateBlockRules(): Promise<void> {
  const sites = await loadSites();
  const existingRules = await chrome.declarativeNetRequest.getDynamicRules();

  const newRules = sites
    .filter((site) => site.enabled)
    .flatMap((site) => toRule(site) ?? []);

  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: existingRules.map((rule) => rule.id),
    addRules: newRules,
  });
}

// ドメインとして読めないパターンにはルールを作らない
function toRule(
  site: BlockedSite
): chrome.declarativeNetRequest.Rule | undefined {
  const urlFilter = toUrlFilter(site.urlPattern);
  if (urlFilter === undefined) {
    return undefined;
  }
  return {
    id: site.id,
    priority: RULE_PRIORITY,
    action: {
      type: chrome.declarativeNetRequest.RuleActionType.REDIRECT,
      redirect: { extensionPath: `/${BLOCKED_PAGE}` },
    },
    condition: {
      urlFilter,
      resourceTypes: [chrome.declarativeNetRequest.ResourceType.MAIN_FRAME],
    },
  };
}
