import type { BlockedSite, StorageData } from "./types";

const STORAGE_KEY = "blockedSites";

export async function loadSites(): Promise<BlockedSite[]> {
  const data = await chrome.storage.local.get<StorageData>(STORAGE_KEY);
  return data.blockedSites ?? [];
}

export async function saveSites(sites: BlockedSite[]): Promise<void> {
  await chrome.storage.local.set<StorageData>({ blockedSites: sites });
}

export function onSitesChanged(listener: () => void): void {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && STORAGE_KEY in changes) {
      listener();
    }
  });
}
