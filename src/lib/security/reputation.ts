// DEMO reputation data for the hackathon — fictional addresses, not a real
// threat-intelligence feed. A verified sponsor data source can replace this later.
import type { TokenInfo } from "./types";

export const FUJI = { name: "Avalanche Fuji (testnet)", chain_id: 43113 } as const;

export const DEMO_WALLET = "0x9c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d";

const TOKENS: TokenInfo[] = [
  {
    address: "0x5f0e1c2a9b8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f",
    symbol: "USDC",
    name: "USD Coin (demo token)",
    decimals: 6,
  },
];

const ADDRESSES: { address: string; label: string }[] = [
  { address: "0x7a2c9e4b1d3f5a6c8e0b2d4f6a8c0e2b4d6f8a0c", label: "Demo DEX Router" },
  { address: "0x3b9f2e1d4c5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c", label: "Your saved contact: Savings wallet" },
];

export function lookupToken(address: string): TokenInfo | null {
  return TOKENS.find((t) => t.address === address.toLowerCase()) ?? null;
}

export function lookupLabel(address: string): string | null {
  return ADDRESSES.find((a) => a.address === address.toLowerCase())?.label ?? null;
}

export const KNOWN = {
  usdc: TOKENS[0].address,
  dexRouter: ADDRESSES[0].address,
  savings: ADDRESSES[1].address,
  unknownSpender: "0x4e8f2a7c1b9d3e5f6a0c8b2d4f7e1a3c5b9d0e2f",
};
