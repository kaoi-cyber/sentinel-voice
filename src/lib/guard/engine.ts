// Sentinel Payment Guard: a policy layer between an AI payment agent and the user's wallet.
// Every payment the agent proposes is checked against the user's guardrails AND Sentinel's
// drainer detection, then Allowed, sent to the user ("Ask me"), or Blocked — with reasons.
// Deterministic: the agent can't talk its way past a rule.
import { detect } from "@/lib/audit/detect";
import type { SigningRequest } from "@/lib/audit/testpack";
import { decodeCall, shortAddress } from "@/lib/security/abi";
import { KNOWN } from "@/lib/security/reputation";

export type Policy = {
  perPaymentLimitUsd: number;
  dailyCapUsd: number;
  askAboveUsd: number;
  /** Payments to anyone not in the trusted list need the user's OK. */
  newRecipientsNeedApproval: boolean;
  /** Token approvals, permits and blind signatures are never allowed for an agent. */
  blockPermissions: boolean;
};

export const DEFAULT_POLICY: Policy = {
  perPaymentLimitUsd: 500,
  dailyCapUsd: 1000,
  askAboveUsd: 100,
  newRecipientsNeedApproval: true,
  blockPermissions: true,
};

export type Contact = { address: string; label: string };

export type PaymentIntent = {
  id: string;
  /** What the agent says it's doing — shown to the user, never trusted by the rules. */
  agentNote: string;
  request: SigningRequest;
};

export type Verdict = "allow" | "ask" | "block";
export type Reason = { rule: string; verdict: Verdict; text: string };

export type Decision = {
  intentId: string;
  verdict: Verdict;
  amountUsd: number | null;
  recipient: string | null;
  recipientLabel: string | null;
  reasons: Reason[];
};

// Tokens the guard can value. Stablecoins are valued at $1 (a stated simplification).
const STABLECOINS: Record<string, { symbol: string; decimals: number }> = {
  [KNOWN.usdc]: { symbol: "USDC", decimals: 6 },
};

function describe(req: SigningRequest): { amountUsd: number | null; recipient: string | null; kind: "payment" | "permission" | "other" } {
  if (req.method !== "eth_sendTransaction") return { amountUsd: null, recipient: null, kind: "permission" };
  const d = decodeCall(req.tx.data);
  if (d.kind === "transfer") {
    const token = STABLECOINS[req.tx.to.toLowerCase()];
    const amount = token ? Number(BigInt(d.amount_raw)) / 10 ** token.decimals : null;
    return { amountUsd: amount, recipient: d.recipient, kind: "payment" };
  }
  if (d.kind === "approve" || d.kind === "approval_for_all") return { amountUsd: null, recipient: null, kind: "permission" };
  return { amountUsd: null, recipient: req.tx.to, kind: "other" };
}

const usd = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 })}`;

export function decide(intent: PaymentIntent, policy: Policy, contacts: Contact[], spentTodayUsd: number): Decision {
  const reasons: Reason[] = [];
  const { amountUsd, recipient, kind } = describe(intent.request);
  const contact = recipient ? contacts.find((c) => c.address.toLowerCase() === recipient.toLowerCase()) : undefined;

  // 1. Sentinel's drainer detection — the same engine used in the wallet audit.
  const sentinel = detect(intent.request, contacts.map((c) => c.address));
  const drainSignals = sentinel.findings.filter((f) => f.severity === "high");
  for (const f of drainSignals) reasons.push({ rule: f.rule_id, verdict: "block", text: f.evidence });

  // 2. Agents may move money, not hand out permissions.
  if (kind === "permission" && policy.blockPermissions)
    reasons.push({ rule: "NO_AGENT_PERMISSIONS", verdict: "block", text: "Your policy never lets an agent grant approvals or sign permission messages." });
  else if (kind === "permission" && !drainSignals.length)
    reasons.push({ rule: "AGENT_PERMISSION", verdict: "ask", text: "The agent wants to grant a permission — you decide." });

  if (kind === "payment") {
    if (amountUsd === null) {
      reasons.push({ rule: "UNPRICED_TOKEN", verdict: "ask", text: "This token can't be valued, so limits can't be checked." });
    } else {
      if (amountUsd > policy.perPaymentLimitUsd)
        reasons.push({ rule: "OVER_PAYMENT_LIMIT", verdict: "block", text: `${usd(amountUsd)} is above your ${usd(policy.perPaymentLimitUsd)} per-payment limit.` });
      if (spentTodayUsd + amountUsd > policy.dailyCapUsd)
        reasons.push({
          rule: "OVER_DAILY_CAP",
          verdict: "block",
          text: `Would bring today's spending to ${usd(spentTodayUsd + amountUsd)}, above your ${usd(policy.dailyCapUsd)} daily cap.`,
        });
      if (amountUsd > policy.askAboveUsd && amountUsd <= policy.perPaymentLimitUsd)
        reasons.push({ rule: "LARGE_PAYMENT", verdict: "ask", text: `${usd(amountUsd)} is above the ${usd(policy.askAboveUsd)} you asked to confirm.` });
    }
    if (!contact && policy.newRecipientsNeedApproval && !drainSignals.length)
      reasons.push({ rule: "NEW_RECIPIENT", verdict: "ask", text: `${shortAddress(recipient ?? "")} isn't in your trusted contacts.` });
    if (contact) reasons.push({ rule: "TRUSTED_RECIPIENT", verdict: "allow", text: `Recipient is your trusted contact "${contact.label}".` });
  }
  if (kind === "other") reasons.push({ rule: "UNKNOWN_ACTION", verdict: "ask", text: "The agent wants to call a contract the guard can't classify." });

  const verdict: Verdict = reasons.some((r) => r.verdict === "block") ? "block" : reasons.some((r) => r.verdict === "ask") ? "ask" : "allow";
  if (verdict === "allow" && !reasons.length) reasons.push({ rule: "WITHIN_POLICY", verdict: "allow", text: "Within all of your limits." });
  if (verdict === "allow" && amountUsd !== null)
    reasons.push({ rule: "WITHIN_LIMITS", verdict: "allow", text: `${usd(amountUsd)} is within your limits (${usd(spentTodayUsd + amountUsd)} of ${usd(policy.dailyCapUsd)} today).` });

  return { intentId: intent.id, verdict, amountUsd, recipient, recipientLabel: contact?.label ?? null, reasons };
}
