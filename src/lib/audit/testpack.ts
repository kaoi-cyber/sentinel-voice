// The Drainer Test Pack: signing requests that mirror real wallet-drain techniques,
// plus benign controls to catch over-warning. Wallet teams replay each payload through
// their wallet (on Fuji) and record what their UI did. All addresses are demo addresses.
import { encodeCall, MAX_UINT256 } from "@/lib/security/abi";
import { DEMO_WALLET, FUJI, KNOWN } from "@/lib/security/reputation";

export type SigningRequest =
  | { method: "eth_sendTransaction"; tx: { from: string; to: string; value: string; data: string } }
  | { method: "eth_signTypedData_v4"; typedData: Record<string, unknown> }
  | { method: "eth_sign"; hash: string }
  | { method: "personal_sign"; message: string };

export type TestCase = {
  id: string;
  name: string;
  /** "attack" should be warned/blocked; "control" is legitimate and should pass without alarm. */
  kind: "attack" | "control";
  /** How bad it is if a wallet misses it (attack cases only). */
  weight: 1 | 2 | 3;
  technique: string;
  howItDrains: string;
  walletShould: string;
  request: SigningRequest;
  /** Addresses the user recently interacted with (for address-poisoning checks). */
  recentAddresses?: string[];
};

// Uniswap's canonical Permit2 contract address (same on every EVM chain).
export const PERMIT2 = "0x000000000022d473030f116ddee9f6b43ac78ba3";
const DRAINER = KNOWN.unknownSpender;
const NFT_COLLECTION = "0x6c3e1f2a9d8b7e5c4a3f2e1d0c9b8a7f6e5d4c3b";
const MAX_UINT160 = (1n << 160n) - 1n;
const FAR_FUTURE = "4102444800"; // 2100-01-01
// A look-alike of the saved "Savings wallet" address: same first 4 and last 4 hex characters.
const POISONED = "0x3b9f" + "77a1c0de55aa11bb22cc33dd44ee55ff" + "8b9c";

const tx = (data: string, to: string = KNOWN.usdc) => ({
  method: "eth_sendTransaction" as const,
  tx: { from: DEMO_WALLET, to, value: "0", data },
});

export const TEST_PACK: TestCase[] = [
  {
    id: "unlimited-approve",
    name: "Unlimited ERC-20 approval",
    kind: "attack",
    weight: 3,
    technique: "approve(spender, 2^256−1)",
    howItDrains: "The spender can move the user's entire token balance at any time, long after the site is closed.",
    walletShould: "Show the spender and an unmistakable 'unlimited' warning, and offer to set a spending cap.",
    request: tx(encodeCall("approve", DRAINER, MAX_UINT256)),
  },
  {
    id: "increase-allowance",
    name: "Unlimited increaseAllowance",
    kind: "attack",
    weight: 2,
    technique: "increaseAllowance(spender, huge amount)",
    howItDrains: "Same effect as an unlimited approve, but through a function some wallets don't decode.",
    walletShould: "Decode increaseAllowance the same way as approve and warn identically.",
    request: tx(encodeCall("increaseAllowance", DRAINER, MAX_UINT256)),
  },
  {
    id: "nft-approve-all",
    name: "NFT collection-wide approval",
    kind: "attack",
    weight: 3,
    technique: "setApprovalForAll(operator, true)",
    howItDrains: "The operator can transfer every NFT the user owns in that collection, including ones bought later.",
    walletShould: "Warn that this grants access to ALL items, name the operator, and flag unknown operators.",
    request: tx(encodeCall("setApprovalForAll", DRAINER, 1n), NFT_COLLECTION),
  },
  {
    id: "permit-signature",
    name: "EIP-2612 Permit signature",
    kind: "attack",
    weight: 3,
    technique: "eth_signTypedData_v4 · primaryType Permit",
    howItDrains: "A gasless off-chain signature that grants an allowance. No transaction appears, so users think they 'just signed in'.",
    walletShould: "Recognise Permit typed data, show it as a token approval with amount and spender, and warn on large values.",
    request: {
      method: "eth_signTypedData_v4",
      typedData: {
        domain: { name: "USD Coin (demo token)", version: "2", chainId: FUJI.chain_id, verifyingContract: KNOWN.usdc },
        primaryType: "Permit",
        types: {
          Permit: [
            { name: "owner", type: "address" },
            { name: "spender", type: "address" },
            { name: "value", type: "uint256" },
            { name: "nonce", type: "uint256" },
            { name: "deadline", type: "uint256" },
          ],
        },
        message: { owner: DEMO_WALLET, spender: DRAINER, value: MAX_UINT256.toString(), nonce: "0", deadline: FAR_FUTURE },
      },
    },
  },
  {
    id: "permit2-signature",
    name: "Permit2 signature",
    kind: "attack",
    weight: 3,
    technique: "eth_signTypedData_v4 · Permit2 PermitSingle",
    howItDrains: "Signs away any token already approved to Permit2 — one signature can empty balances across tokens.",
    walletShould: "Decode Permit2 messages, show token, amount, spender and expiry, and warn on unlimited amounts or far expiries.",
    request: {
      method: "eth_signTypedData_v4",
      typedData: {
        domain: { name: "Permit2", chainId: FUJI.chain_id, verifyingContract: PERMIT2 },
        primaryType: "PermitSingle",
        types: {
          PermitSingle: [
            { name: "details", type: "PermitDetails" },
            { name: "spender", type: "address" },
            { name: "sigDeadline", type: "uint256" },
          ],
          PermitDetails: [
            { name: "token", type: "address" },
            { name: "amount", type: "uint160" },
            { name: "expiration", type: "uint48" },
            { name: "nonce", type: "uint48" },
          ],
        },
        message: {
          details: { token: KNOWN.usdc, amount: MAX_UINT160.toString(), expiration: FAR_FUTURE, nonce: "0" },
          spender: DRAINER,
          sigDeadline: FAR_FUTURE,
        },
      },
    },
  },
  {
    id: "blind-eth-sign",
    name: "Blind eth_sign of a raw hash",
    kind: "attack",
    weight: 3,
    technique: "eth_sign(32-byte hash)",
    howItDrains: "The user signs an opaque hash that can be any transaction. Nobody — not even the wallet — can show what it does.",
    walletShould: "Block eth_sign by default, or require an explicit advanced-mode opt-in with a severe warning.",
    request: { method: "eth_sign", hash: "0x" + "9a".repeat(32) },
  },
  {
    id: "address-poisoning",
    name: "Address poisoning (look-alike recipient)",
    kind: "attack",
    weight: 2,
    technique: "transfer() to an address matching the first & last characters of a saved address",
    howItDrains: "Scammers plant look-alike addresses in the user's history; users copy the wrong one and send funds to the attacker.",
    walletShould: "Detect recipients that resemble a saved/recent address but differ, and warn before sending.",
    request: tx(encodeCall("transfer", POISONED, 1_000_000_000n)),
    recentAddresses: [KNOWN.savings],
  },
  {
    id: "control-transfer",
    name: "Control: transfer to a saved contact",
    kind: "control",
    weight: 1,
    technique: "transfer() to a known saved address",
    howItDrains: "Legitimate — included to measure false alarms.",
    walletShould: "Proceed normally. Constant warnings on safe actions train users to ignore warnings.",
    request: tx(encodeCall("transfer", KNOWN.savings, 250_000_000n)),
    recentAddresses: [KNOWN.savings],
  },
  {
    id: "control-login",
    name: "Control: plain-text sign-in message",
    kind: "control",
    weight: 1,
    technique: "personal_sign(readable message)",
    howItDrains: "Legitimate — a human-readable sign-in message moves no funds.",
    walletShould: "Show the readable message and proceed without a drain warning.",
    request: {
      method: "personal_sign",
      message: "Sign in to Demo DEX\nNonce: 8f3a1c\nThis request will not trigger a blockchain transaction or cost any gas.",
    },
  },
];
