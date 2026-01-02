export interface BlockedSite {
  id: number;
  urlPattern: string;
  enabled: boolean;
}

export interface StorageData {
  blockedSites: BlockedSite[];
}

