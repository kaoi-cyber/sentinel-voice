// Beginner-friendly wording for each finding. This layer explains the engine's
// findings — it never adds or changes a verdict. VoiceGuard will speak these.
import { formatUnits } from "./abi";
import type { Finding, RiskLevel, SecurityReport } from "./types";

export const RISK_COPY: Record<RiskLevel, { label: string; headline: string }> = {
  low: { label: "Lower risk", headline: "Looks okay — just double-check the details." },
  medium: { label: "Take a closer look", headline: "Something here is worth a second look." },
  high: { label: "High risk", headline: "Stop — this needs your attention." },
  unverified: { label: "Unverified", headline: "We can't confirm who you're dealing with." },
  insufficient: { label: "Not enough information", headline: "We can't read what this transaction does." },
};

const SEVERITY_ORDER = { high: 0, medium: 1, low: 2, info: 3 } as const;

/** Most important findings first. */
export function sortFindings(findings: Finding[]): Finding[] {
  return [...findings].sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
}

/** One sentence: what signing this transaction would actually do. */
export function describeAction(r: SecurityReport): string {
  const sym = r.token?.symbol ?? "an unrecognised token";
  const who = r.counterparty?.label ?? "an address we don't recognise";
  const d = r.decoded;
  if (d.kind === "unknown") return "Calls a contract function we can't decode.";
  if (d.kind === "approval_for_all") {
    return d.approved
      ? `Gives ${who} control of every NFT you own in this collection.`
      : `Removes ${who}'s access to your NFTs in this collection.`;
  }
  const amount = r.token ? formatUnits(BigInt(d.amount_raw), r.token.decimals) : null;
  if (d.kind === "approve") {
    return d.unlimited
      ? `Gives ${who} permission to spend an unlimited amount of your ${sym}.`
      : `Gives ${who} permission to spend up to ${amount ?? "some"} of your ${sym}.`;
  }
  return `Sends ${amount ?? "some"} ${sym} to ${who}.`;
}

export function explainFinding(f: Finding, r: SecurityReport): string {
  const sym = r.token?.symbol ?? "tokens";
  const who = r.counterparty?.label ?? "this address";
  const amount =
    (r.decoded.kind === "approve" || r.decoded.kind === "transfer") && r.token ? formatUnits(BigInt(r.decoded.amount_raw), r.token.decimals) : null;

  switch (f.rule_id) {
    case "UNLIMITED_ALLOWANCE":
      return `You'd be giving ${who} permission to spend all of your ${sym} — not just once, but any time in the future, until you cancel it. If that app is ever hacked or turns malicious, your ${sym} could be taken.`;
    case "LIMITED_ALLOWANCE":
      return `The permission is capped at ${amount ?? "a set amount of"} ${sym}, so the spender can't take more than that.`;
    case "KNOWN_SPENDER":
      return `The app asking for permission matches "${who}" in our demo reputation list.`;
    case "UNKNOWN_SPENDER":
      return "We don't recognise the address asking for permission. That doesn't mean it's a scam — it means we can't vouch for it. Free-airdrop sites are a common trick to get approvals.";
    case "TRANSFER_AMOUNT":
      return `You're sending ${amount ?? "some"} ${sym}. Crypto transfers can't be reversed once they're sent.`;
    case "KNOWN_RECIPIENT":
      return `The recipient matches "${who}".`;
    case "UNKNOWN_RECIPIENT":
      return "We don't recognise who you're sending to. Scammers use addresses that look almost identical — check every character.";
    case "KNOWN_TOKEN":
      return `This is ${r.token?.name ?? sym}, a token we recognise.`;
    case "UNKNOWN_TOKEN":
      return "We don't recognise this token. Fake tokens often copy the names of real ones.";
    case "NATIVE_VALUE_ATTACHED":
      return "This also sends AVAX, which a normal token transfer or approval doesn't need.";
    case "ZERO_ADDRESS":
      return "This goes to the “zero address” — nobody controls it, so anything sent there is gone for good.";
    case "UNSUPPORTED_CALL":
      return "We can't read what this transaction does. A good rule: never sign something you don't understand.";
    case "NFT_APPROVAL_FOR_ALL":
      return `You'd let ${who} move every NFT you own in this collection — today and in the future. This is one of the most common tricks used to drain NFT wallets.`;
    case "APPROVAL_FOR_ALL_REVOKED":
      return "This cancels a previous permission — that's a safe, healthy thing to do.";
  }
}
