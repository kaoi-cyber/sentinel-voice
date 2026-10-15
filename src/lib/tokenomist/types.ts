// The parts of Tokenomist's API v5 responses that Sentinel reads.
// Field names match https://docs.tokenomist.ai/api-documents (v5) exactly.

export type ListedMethod = "INTERNAL" | "AI" | "EXTERNAL";

export type Envelope<T> = {
  metadata: { queryDate: string; credit?: { used: number; limit: number; resetAt?: string } };
  status: boolean;
  data: T;
};

/** GET /v5/token/list?tokenId=… */
export type TokenListItem = {
  id: string;
  name: string;
  symbol: string;
  listedMethod: ListedMethod;
  circulatingSupply: number | null;
  marketCap: number | null;
  maxSupply: number | null;
  lastUpdatedDate: string;
  websiteUrl?: string;
};

/** GET /v5/allocations/{tokenId} */
export type AllocationsData = {
  name: string;
  symbol: string;
  listedMethod: ListedMethod;
  maxSupply: number | null;
  lastUpdatedDate: string;
  totalUnlockedAmount: number;
  totalLockedAmount: number;
  totalUntrackedAmount: number;
  totalTBDLockedAmount: number;
  allocations: {
    allocationName: string;
    allocationType: "Scheduled" | "TBD" | "Untracked";
    standardAllocationName: string;
    allocationUnlockedAmount: number;
    allocationLockedAmount: number;
    allocationAmount: number;
    trackedAllocationPercentage: number;
  }[];
};

/** GET /v5/unlock/events/{tokenId}?start=YYYY-MM-DD */
export type UnlockEvent = {
  unlockDate: string;
  tokenName: string;
  tokenSymbol: string;
  listedMethod: string;
  dataSource: string;
  cliffUnlocks: {
    cliffAmount: number;
    cliffValue: number;
    valueToMarketCap: number;
    allocationBreakdown: {
      unlockDate: string;
      allocationName: string;
      standardAllocationName: string;
      cliffAmount: number;
      cliffValue: number;
      referencePrice: number;
      referencePriceUpdatedTime: string;
      unlockPrecision: string;
    }[];
  };
  latestUpdateDate: string;
};

/** Everything Sentinel fetched for one token, exactly as Tokenomist returned it. */
export type TokenomistSnapshot = {
  tokenId: string;
  mode: "live" | "sample";
  /** Why we're on sample data (no key, access not enabled…). Null when live. */
  sampleReason: string | null;
  queryDate: string;
  token: TokenListItem | null;
  allocations: AllocationsData | null;
  /** Upcoming cliff unlocks, soonest first. Null when the plan doesn't include this endpoint. */
  unlockEvents: UnlockEvent[] | null;
  endpoints: string[];
};
