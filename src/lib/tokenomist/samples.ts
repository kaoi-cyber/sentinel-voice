// FICTIONAL sample tokens in Tokenomist's exact response format, used when live
// API access isn't available. They are not real projects and the UI always labels them.
// Dates are relative to "now" so the demo stays meaningful on any day.
import type { AllocationsData, TokenListItem, TokenomistSnapshot, UnlockEvent } from "./types";

type Sample = { token: TokenListItem; allocations: AllocationsData; unlockEvents: (now: Date) => UnlockEvent[] };

const day = 86_400_000;
const iso = (d: Date) => d.toISOString().replace(/\.\d{3}Z$/, "Z");
const UPDATED = "2026-10-01T08:00:00Z";

function alloc(name: string, standard: string, amount: number, unlocked: number, max: number, type: "Scheduled" | "TBD" = "Scheduled") {
  return {
    allocationName: name,
    allocationType: type,
    standardAllocationName: standard,
    allocationUnlockedAmount: unlocked,
    allocationLockedAmount: amount - unlocked,
    allocationAmount: amount,
    trackedAllocationPercentage: (amount / max) * 100,
  };
}

function event(now: Date, inDays: number, symbol: string, name: string, price: number, mcap: number, parts: [string, string, number][]): UnlockEvent {
  const date = iso(new Date(now.getTime() + inDays * day));
  const cliffAmount = parts.reduce((s, p) => s + p[2], 0);
  return {
    unlockDate: date,
    tokenName: name,
    tokenSymbol: symbol,
    listedMethod: "INTERNAL",
    dataSource: "Sample",
    cliffUnlocks: {
      cliffAmount,
      cliffValue: cliffAmount * price,
      valueToMarketCap: ((cliffAmount * price) / mcap) * 100,
      allocationBreakdown: parts.map(([allocationName, standardAllocationName, amount]) => ({
        unlockDate: date,
        allocationName,
        standardAllocationName,
        cliffAmount: amount,
        cliffValue: amount * price,
        referencePrice: price,
        referencePriceUpdatedTime: UPDATED,
        unlockPrecision: "day",
      })),
    },
    latestUpdateDate: UPDATED,
  };
}

const NOVA_MAX = 1_000_000_000;
const NOVA_PRICE = 0.25;
const NOVA_MCAP = 220_000_000 * NOVA_PRICE;

const STDY_MAX = 500_000_000;
const STDY_PRICE = 1.2;
const STDY_MCAP = 410_000_000 * STDY_PRICE;

export const SAMPLES: Record<string, Sample> = {
  "sample-nova": {
    token: {
      id: "sample-nova",
      name: "Nova Protocol (sample)",
      symbol: "NOVA",
      listedMethod: "INTERNAL",
      circulatingSupply: 220_000_000,
      marketCap: NOVA_MCAP,
      maxSupply: NOVA_MAX,
      lastUpdatedDate: UPDATED,
    },
    allocations: {
      name: "Nova Protocol (sample)",
      symbol: "NOVA",
      listedMethod: "INTERNAL",
      maxSupply: NOVA_MAX,
      lastUpdatedDate: UPDATED,
      totalUnlockedAmount: 220_000_000,
      totalLockedAmount: 700_000_000,
      totalUntrackedAmount: 0,
      totalTBDLockedAmount: 80_000_000,
      allocations: [
        alloc("Core Team", "Founder / Team", 200_000_000, 20_000_000, NOVA_MAX),
        alloc("Seed & Series A", "Private Investors", 250_000_000, 40_000_000, NOVA_MAX),
        alloc("Public Sale", "Public Investors", 50_000_000, 50_000_000, NOVA_MAX),
        alloc("Staking Rewards", "Community", 300_000_000, 70_000_000, NOVA_MAX),
        alloc("Foundation Treasury", "Reserve", 120_000_000, 40_000_000, NOVA_MAX),
        alloc("Strategic Reserve", "Reserve", 80_000_000, 0, NOVA_MAX, "TBD"),
      ],
    },
    unlockEvents: (now) => [
      event(now, 9, "NOVA", "Nova Protocol (sample)", NOVA_PRICE, NOVA_MCAP, [
        ["Core Team", "Founder / Team", 20_000_000],
        ["Seed & Series A", "Private Investors", 22_000_000],
        ["Staking Rewards", "Community", 3_000_000],
      ]),
      event(now, 39, "NOVA", "Nova Protocol (sample)", NOVA_PRICE, NOVA_MCAP, [["Core Team", "Founder / Team", 20_000_000]]),
    ],
  },
  "sample-steady": {
    token: {
      id: "sample-steady",
      name: "Steady Chain (sample)",
      symbol: "STDY",
      listedMethod: "INTERNAL",
      circulatingSupply: 410_000_000,
      marketCap: STDY_MCAP,
      maxSupply: STDY_MAX,
      lastUpdatedDate: UPDATED,
    },
    allocations: {
      name: "Steady Chain (sample)",
      symbol: "STDY",
      listedMethod: "INTERNAL",
      maxSupply: STDY_MAX,
      lastUpdatedDate: UPDATED,
      totalUnlockedAmount: 410_000_000,
      totalLockedAmount: 60_000_000,
      totalUntrackedAmount: 30_000_000,
      totalTBDLockedAmount: 0,
      allocations: [
        alloc("Team", "Founder / Team", 60_000_000, 40_000_000, STDY_MAX),
        alloc("Private Sale", "Private Investors", 50_000_000, 50_000_000, STDY_MAX),
        alloc("Public Sale", "Public Investors", 75_000_000, 75_000_000, STDY_MAX),
        alloc("Ecosystem Rewards", "Community", 225_000_000, 185_000_000, STDY_MAX),
        alloc("Treasury", "Reserve", 60_000_000, 60_000_000, STDY_MAX),
      ],
    },
    unlockEvents: (now) => [
      event(now, 41, "STDY", "Steady Chain (sample)", STDY_PRICE, STDY_MCAP, [["Team", "Founder / Team", 2_000_000]]),
    ],
  },
};

export function sampleSnapshot(tokenId: string, reason: string, now: Date): TokenomistSnapshot | null {
  const s = SAMPLES[tokenId];
  if (!s) return null;
  return {
    tokenId,
    mode: "sample",
    sampleReason: reason,
    queryDate: now.toISOString(),
    token: s.token,
    allocations: s.allocations,
    unlockEvents: s.unlockEvents(now),
    endpoints: ["sample data (fictional token)"],
  };
}
