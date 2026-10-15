// Sentinel's reference detector for any signing request — the same checks a wallet
// should run before showing a "Sign" button. Transactions go through the core engine;
// off-chain signatures and address poisoning get their own deterministic rules.
import { UNLIMITED_THRESHOLD, shortAddress } from "@/lib/security/abi";
import { analyze } from "@/lib/security/engine";
import { FUJI, lookupLabel } from "@/lib/security/reputation";
import type { RiskLevel, Severity } from "@/lib/security/types";
import { PERMIT2, type SigningRequest } from "./testpack";

export type Detection = {
  risk_level: RiskLevel;
  /** Would Sentinel stop or warn the user? */
  flagged: boolean;
  findings: { rule_id: string; severity: Severity; evidence: string }[];
};

const PERMIT2_TYPES = ["PermitSingle", "PermitBatch", "PermitTransferFrom", "PermitBatchTransferFrom"];
const LONG_EXPIRY_SECONDS = 30 * 24 * 3600;

function big(v: unknown): bigint {
  try {
    return BigInt(String(v));
  } catch {
    return 0n;
  }
}

/** Same first 4 and last 4 hex characters as a known address, but not identical. */
export function looksLikePoisoning(target: string, known: string[]): string | null {
  const t = target.toLowerCase();
  for (const k of known.map((a) => a.toLowerCase())) {
    if (k !== t && k.slice(2, 6) === t.slice(2, 6) && k.slice(-4) === t.slice(-4)) return k;
  }
  return null;
}

function level(findings: Detection["findings"], unverified = false): RiskLevel {
  if (findings.some((f) => f.severity === "high")) return "high";
  if (unverified) return "unverified";
  if (findings.some((f) => f.severity === "medium")) return "medium";
  return "low";
}

export function detect(req: SigningRequest, recentAddresses: string[] = [], nowSeconds = Math.floor(Date.now() / 1000)): Detection {
  const findings: Detection["findings"] = [];

  if (req.method === "eth_sign") {
    findings.push({
      rule_id: "BLIND_SIGNATURE",
      severity: "high",
      evidence: `eth_sign over raw hash ${shortAddress(req.hash)} — the content can't be decoded or shown to the user.`,
    });
    return { risk_level: "high", flagged: true, findings };
  }

  if (req.method === "personal_sign") {
    const readable = /^[\x20-\x7E\n\r\t]+$/.test(req.message);
    findings.push(
      readable
        ? { rule_id: "READABLE_MESSAGE", severity: "info", evidence: "Plain-text message; no funds or permissions involved." }
        : { rule_id: "UNREADABLE_MESSAGE", severity: "medium", evidence: "Message isn't readable text — may hide a hash." },
    );
    const risk = level(findings);
    return { risk_level: risk, flagged: risk !== "low", findings };
  }

  if (req.method === "eth_signTypedData_v4") {
    const td = req.typedData as { primaryType?: string; domain?: { verifyingContract?: string }; message?: Record<string, unknown> };
    const msg = td.message ?? {};
    let unverified = false;
    const spender = String(msg.spender ?? "");
    const spenderNote = () => {
      if (!lookupLabel(spender)) {
        unverified = true;
        findings.push({ rule_id: "UNKNOWN_SPENDER", severity: "medium", evidence: `Spender ${shortAddress(spender)} is not in the reputation list.` });
      }
    };

    if (td.primaryType === "Permit") {
      const value = big(msg.value);
      findings.push({
        rule_id: "PERMIT_SIGNATURE",
        severity: value >= UNLIMITED_THRESHOLD ? "high" : "medium",
        evidence: `Off-chain Permit grants ${spender ? shortAddress(spender) : "a spender"} an allowance of ${
          value >= UNLIMITED_THRESHOLD ? "an unlimited amount" : value.toString()
        } — no transaction is shown to the user.`,
      });
      if (big(msg.deadline) - BigInt(nowSeconds) > BigInt(LONG_EXPIRY_SECONDS))
        findings.push({ rule_id: "LONG_DEADLINE", severity: "medium", evidence: `Signature valid until ${new Date(Number(big(msg.deadline)) * 1000).toISOString().slice(0, 10)}.` });
      spenderNote();
      const risk = level(findings, unverified);
      return { risk_level: risk, flagged: risk !== "low", findings };
    }

    if (PERMIT2_TYPES.includes(td.primaryType ?? "") || td.domain?.verifyingContract?.toLowerCase() === PERMIT2) {
      const details = (msg.details ?? msg.permitted ?? {}) as Record<string, unknown>;
      const amount = big(details.amount);
      findings.push({
        rule_id: "PERMIT2_SIGNATURE",
        severity: amount >= 1n << 159n || amount === 0n ? "high" : "medium",
        evidence: `Permit2 ${td.primaryType} lets ${spender ? shortAddress(spender) : "a spender"} pull ${
          amount >= 1n << 159n ? "an unlimited amount" : amount.toString()
        } of token ${details.token ? shortAddress(String(details.token)) : "(unknown)"}.`,
      });
      const expiry = big(details.expiration ?? msg.deadline);
      if (expiry - BigInt(nowSeconds) > BigInt(LONG_EXPIRY_SECONDS))
        findings.push({ rule_id: "LONG_EXPIRATION", severity: "medium", evidence: `Permission lasts until ${new Date(Number(expiry) * 1000).toISOString().slice(0, 10)}.` });
      spenderNote();
      const risk = level(findings, unverified);
      return { risk_level: risk, flagged: risk !== "low", findings };
    }

    findings.push({ rule_id: "UNKNOWN_TYPED_DATA", severity: "medium", evidence: `Typed data "${td.primaryType ?? "?"}" isn't a recognised format.` });
    return { risk_level: "unverified", flagged: true, findings };
  }

  // eth_sendTransaction → core engine + address-poisoning check
  const report = analyze({ chain_id: FUJI.chain_id, from: req.tx.from, to: req.tx.to, value: req.tx.value, data: req.tx.data });
  for (const f of report.findings) findings.push({ rule_id: f.rule_id, severity: f.severity, evidence: f.evidence });
  let risk = report.risk_level;
  const target = report.counterparty?.address;
  const lookalike = target ? looksLikePoisoning(target, recentAddresses) : null;
  if (lookalike) {
    findings.unshift({
      rule_id: "ADDRESS_POISONING",
      severity: "high",
      evidence: `Recipient ${shortAddress(target!)} imitates recent address ${shortAddress(lookalike)} (same first and last characters).`,
    });
    risk = "high";
  }
  return { risk_level: risk, flagged: risk !== "low", findings };
}
