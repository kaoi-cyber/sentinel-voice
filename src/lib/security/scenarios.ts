// The three prepared demo transactions. Clearly labelled as samples in the UI.
import { encodeCall, MAX_UINT256 } from "./abi";
import { DEMO_WALLET, FUJI, KNOWN } from "./reputation";
import type { RiskLevel, TxInput } from "./types";

export type Scenario = {
  id: string;
  title: string;
  story: string;
  expected: RiskLevel;
  tx: TxInput;
};

const base = { chain_id: FUJI.chain_id, from: DEMO_WALLET, to: KNOWN.usdc, value: "0" };

export const SCENARIOS: Scenario[] = [
  {
    id: "ordinary-transfer",
    title: "Send 250 USDC to savings",
    story: "You're moving 250 USDC to your own savings wallet.",
    expected: "low",
    tx: { ...base, data: encodeCall("transfer", KNOWN.savings, 250_000_000n) },
  },
  {
    id: "unlimited-approval",
    title: "Swap site asks for approval",
    story: "A swap app asks permission to spend your USDC so it can trade for you.",
    expected: "high",
    tx: { ...base, data: encodeCall("approve", KNOWN.dexRouter, MAX_UINT256) },
  },
  {
    id: "unknown-spender",
    title: "Airdrop site asks for approval",
    story: "A site promising a free airdrop asks permission to spend 100 USDC.",
    expected: "unverified",
    tx: { ...base, data: encodeCall("approve", KNOWN.unknownSpender, 100_000_000n) },
  },
];

export function getScenario(id: string | null | undefined): Scenario | undefined {
  return SCENARIOS.find((s) => s.id === id);
}
