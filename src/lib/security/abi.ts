// Minimal ERC-20 calldata encoding/decoding — just the two calls our rules understand.
import type { Decoded } from "./types";

export const SELECTORS = {
  transfer: "0xa9059cbb",
  approve: "0x095ea7b3",
  increaseAllowance: "0x39509351",
  setApprovalForAll: "0xa22cb465",
} as const;

export const MAX_UINT256 = (1n << 256n) - 1n;

/**
 * Wallets usually request 2^256−1 for "unlimited", but some apps use other huge values.
 * Anything at or above 2^128 is far beyond any real token supply, so we treat it as unlimited.
 */
export const UNLIMITED_THRESHOLD = 1n << 128n;

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

const HEX = /^0x[0-9a-f]*$/;

export function encodeCall(fn: "transfer" | "approve" | "increaseAllowance" | "setApprovalForAll", address: string, amount: bigint): string {
  const addr = address.toLowerCase().replace(/^0x/, "").padStart(64, "0");
  const amt = amount.toString(16).padStart(64, "0");
  return SELECTORS[fn] + addr + amt;
}

export function decodeCall(data: string): Decoded {
  const hex = data.trim().toLowerCase();
  if (!HEX.test(hex) || hex.length < 10) return { kind: "unknown", selector: null };

  const selector = hex.slice(0, 10);
  const args = hex.slice(10);
  const isKnown = (Object.values(SELECTORS) as string[]).includes(selector);
  // Two 32-byte arguments; the address word must have its top 12 bytes empty.
  if (!isKnown || args.length !== 128 || !/^0{24}/.test(args)) return { kind: "unknown", selector };

  const address = "0x" + args.slice(24, 64);
  const amount = BigInt("0x" + args.slice(64, 128));

  if (selector === SELECTORS.transfer) {
    return { kind: "transfer", function: "transfer(address,uint256)", selector, recipient: address, amount_raw: amount.toString() };
  }
  if (selector === SELECTORS.setApprovalForAll) {
    // The second argument is a bool: exactly 0 or 1.
    if (amount > 1n) return { kind: "unknown", selector };
    return { kind: "approval_for_all", function: "setApprovalForAll(address,bool)", selector, operator: address, approved: amount === 1n };
  }
  return {
    kind: "approve",
    function: selector === SELECTORS.increaseAllowance ? "increaseAllowance(address,uint256)" : "approve(address,uint256)",
    selector,
    spender: address,
    amount_raw: amount.toString(),
    unlimited: amount >= UNLIMITED_THRESHOLD,
  };
}

/** 250000000 with 6 decimals → "250". Keeps up to 6 fractional digits. */
export function formatUnits(raw: bigint, decimals: number): string {
  const base = 10n ** BigInt(decimals);
  const whole = raw / base;
  const frac = (raw % base).toString().padStart(decimals, "0").replace(/0+$/, "").slice(0, 6);
  return whole.toLocaleString("en-US") + (frac ? "." + frac : "");
}

export function shortAddress(address: string): string {
  return address.length > 12 ? `${address.slice(0, 6)}…${address.slice(-4)}` : address;
}
