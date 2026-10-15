// The deterministic security engine: same input → same findings, every time.
// No AI here — the AI layer only explains what these rules produce.
import { decodeCall, formatUnits, MAX_UINT256, shortAddress, ZERO_ADDRESS } from "./abi";
import { FUJI, lookupLabel, lookupToken } from "./reputation";
import type { Counterparty, Finding, RiskLevel, SecurityReport, TokenInfo, TxInput } from "./types";

const NOT_CHECKED = [
  "Contract source code or audit status",
  "Live on-chain state (current allowances, balances, contract bytecode)",
  "Whether the token contract behaves like a standard ERC-20",
  "The website, message or person asking you to sign",
];

export function analyze(
  tx: TxInput,
  opts: { scenarioId?: string; sample?: boolean; generatedAt?: string } = {},
): SecurityReport {
  const to = tx.to.trim().toLowerCase();
  const decoded = decodeCall(tx.data);
  const token = lookupToken(to);
  const findings: Finding[] = [];
  const checks = ["Decoded the calldata against supported ERC-20 functions"];
  let counterparty: Counterparty | null = null;

  const add = (f: Omit<Finding, "unverified"> & { unverified?: boolean }) =>
    findings.push({ unverified: false, ...f });

  if (decoded.kind === "unknown") {
    add({
      rule_id: "UNSUPPORTED_CALL",
      severity: "medium",
      title: "Transaction could not be decoded",
      evidence: decoded.selector
        ? `Function selector ${decoded.selector} is not a supported call (transfer, approve).`
        : "Calldata is empty or not valid hex.",
    });
  } else {
    checks.push("Compared the token contract with the reputation list");
    const symbol = token?.symbol ?? "tokens";
    const fmt = (raw: string) => (token ? formatUnits(BigInt(raw), token.decimals) : raw + " (raw units)");

    if (token) {
      add({ rule_id: "KNOWN_TOKEN", severity: "info", title: `Token recognised: ${token.symbol}`, evidence: `${to} is listed as ${token.name}.` });
    } else {
      add({
        rule_id: "UNKNOWN_TOKEN",
        severity: "medium",
        unverified: true,
        title: "Token contract not recognised",
        evidence: `${to} is not in the reputation list; symbol and decimals are unknown.`,
      });
    }

    const party =
      decoded.kind === "approve" ? decoded.spender : decoded.kind === "approval_for_all" ? decoded.operator : decoded.recipient;
    const role = decoded.kind === "approve" ? "spender" : decoded.kind === "approval_for_all" ? "operator" : "recipient";
    const label = lookupLabel(party);
    counterparty = { role, address: party, label };

    checks.push(`Compared the ${role} with the reputation list`, "Checked for the zero address");
    if (party === ZERO_ADDRESS) {
      add({
        rule_id: "ZERO_ADDRESS",
        severity: "high",
        title: `The ${role} is the zero address`,
        evidence: `${role} = ${ZERO_ADDRESS}; nobody controls this address.`,
      });
    }

    if (decoded.kind === "approval_for_all") {
      checks.push("Checked for collection-wide NFT approvals (setApprovalForAll)");
      if (decoded.approved) {
        add({
          rule_id: "NFT_APPROVAL_FOR_ALL",
          severity: "high",
          title: "Approval for ALL items in a collection",
          evidence: `setApprovalForAll(${party}, true) lets the operator move every NFT you hold in ${to}, now and later.`,
        });
      } else {
        add({
          rule_id: "APPROVAL_FOR_ALL_REVOKED",
          severity: "info",
          title: "Removes a collection-wide approval",
          evidence: `setApprovalForAll(${party}, false) revokes the operator's access.`,
        });
      }
      if (label) {
        add({ rule_id: "KNOWN_SPENDER", severity: "info", title: `Operator recognised: ${label}`, evidence: `${party} is listed as "${label}".` });
      } else if (decoded.approved) {
        add({
          rule_id: "UNKNOWN_SPENDER",
          severity: "medium",
          unverified: true,
          title: "Operator not recognised",
          evidence: `${party} has no entry in the reputation list. Unknown does not mean malicious.`,
        });
      }
    } else if (decoded.kind === "approve") {
      checks.push("Checked the approval amount against the unlimited threshold (≥ 2^128)");
      if (decoded.unlimited) {
        add({
          rule_id: "UNLIMITED_ALLOWANCE",
          severity: "high",
          title: "Unlimited token approval",
          evidence: `${decoded.function.split("(")[0]}() amount is ${
            BigInt(decoded.amount_raw) === MAX_UINT256 ? "2^256−1 (the maximum possible)" : `${decoded.amount_raw} (≥ 2^128)`
          }, effectively unlimited ${symbol}.`,
        });
      } else {
        add({
          rule_id: "LIMITED_ALLOWANCE",
          severity: "info",
          title: `Allowance capped at ${fmt(decoded.amount_raw)} ${symbol}`,
          evidence: `approve() amount is ${decoded.amount_raw} raw units.`,
        });
      }
      if (label) {
        add({ rule_id: "KNOWN_SPENDER", severity: "info", title: `Spender recognised: ${label}`, evidence: `${party} is listed as "${label}".` });
      } else {
        add({
          rule_id: "UNKNOWN_SPENDER",
          severity: "medium",
          unverified: true,
          title: "Spender not recognised",
          evidence: `${party} has no entry in the reputation list. Unknown does not mean malicious.`,
        });
      }
    } else {
      add({
        rule_id: "TRANSFER_AMOUNT",
        severity: "info",
        title: `Sends ${fmt(decoded.amount_raw)} ${symbol}`,
        evidence: `transfer() amount is ${decoded.amount_raw} raw units to ${shortAddress(party)}.`,
      });
      if (label) {
        add({ rule_id: "KNOWN_RECIPIENT", severity: "info", title: `Recipient recognised: ${label}`, evidence: `${party} is listed as "${label}".` });
      } else {
        add({
          rule_id: "UNKNOWN_RECIPIENT",
          severity: "low",
          title: "Recipient not recognised",
          evidence: `${party} is not in the reputation list or saved contacts.`,
        });
      }
    }
  }

  checks.push("Checked for native AVAX attached to the call");
  const value = safeBigInt(tx.value);
  if (value > 0n) {
    add({
      rule_id: "NATIVE_VALUE_ATTACHED",
      severity: "medium",
      title: `Also sends ${formatUnits(value, 18)} AVAX`,
      evidence: `value = ${tx.value} wei. Token transfers and approvals normally attach no AVAX.`,
    });
  }

  const risk_level = overallRisk(findings);
  return {
    schema_version: "1.0",
    scenario_id: opts.scenarioId ?? null,
    sample_data: opts.sample ?? false,
    generated_at: opts.generatedAt ?? new Date().toISOString(),
    chain: tx.chain_id === FUJI.chain_id ? { ...FUJI } : { name: `Chain ${tx.chain_id}`, chain_id: tx.chain_id },
    transaction: { ...tx, to },
    decoded,
    token,
    counterparty,
    risk_level,
    findings,
    checks_performed: checks,
    not_checked: NOT_CHECKED,
    recommended_action: recommend(findings, risk_level, token, counterparty),
    report_hash: null,
    verification_tx: null,
  };
}

function overallRisk(findings: Finding[]): RiskLevel {
  if (findings.some((f) => f.severity === "high")) return "high";
  if (findings.some((f) => f.rule_id === "UNSUPPORTED_CALL")) return "insufficient";
  if (findings.some((f) => f.unverified)) return "unverified";
  if (findings.some((f) => f.severity === "medium")) return "medium";
  return "low";
}

function recommend(findings: Finding[], risk: RiskLevel, token: TokenInfo | null, party: Counterparty | null): string {
  const has = (id: Finding["rule_id"]) => findings.some((f) => f.rule_id === id);
  const who = party?.label ?? "the spender";
  if (has("ZERO_ADDRESS")) return "Do not sign. Tokens sent or approved to the zero address cannot be recovered or used.";
  if (has("UNLIMITED_ALLOWANCE"))
    return `Don't approve an unlimited amount. If you trust ${who}, set a spending cap equal to what you need now, and revoke the approval when you're done.`;
  switch (risk) {
    case "insufficient":
      return "Don't sign a transaction you can't read. Use a tool that supports this contract, or ask someone you trust.";
    case "unverified":
      return token
        ? "Confirm the spender address through the project's official website or docs before approving. Unknown does not mean malicious — it means we couldn't confirm who it is."
        : "Confirm the token contract address from an official source before interacting — fake tokens often copy real names.";
    case "medium":
      return "Review the flagged items carefully before signing.";
    default:
      return "Double-check the address and amount match what you intended, then proceed.";
  }
}

function safeBigInt(value: string): bigint {
  try {
    return BigInt(value || "0");
  } catch {
    return 0n;
  }
}
