export interface BlockedSite {
  id: number;
  urlPattern: string;
  enabled: boolean;
}

// 初回起動時など、まだ何も保存されていないときは blockedSites がない
export interface StorageData {
  blockedSites?: BlockedSite[];
}
