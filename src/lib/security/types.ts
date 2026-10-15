// The shared report format. Both the beginner (Sentinel AI) and expert views read
// this exact structure — the engine decides the findings, the UI only explains them.
// Documented for the team in docs/report-schema.md.

export type Severity = "info" | "low" | "medium" | "high";

/**
 * Overall verdict.
 * - low: nothing concerning found by our checks
 * - medium: something worth a closer look
 * - high: a known risky pattern (e.g. unlimited approval)
 * - unverified: we have no reputation data for a party involved
 * - insufficient: we couldn't decode the transaction at all
 */
export type RiskLevel = "low" | "medium" | "high" | "unverified" | "insufficient";

export type RuleId =
  | "UNSUPPORTED_CALL"
  | "KNOWN_TOKEN"
  | "UNKNOWN_TOKEN"
  | "NATIVE_VALUE_ATTACHED"
  | "ZERO_ADDRESS"
  | "UNLIMITED_ALLOWANCE"
  | "LIMITED_ALLOWANCE"
  | "KNOWN_SPENDER"
  | "UNKNOWN_SPENDER"
  | "TRANSFER_AMOUNT"
  | "KNOWN_RECIPIENT"
  | "UNKNOWN_RECIPIENT"
  | "NFT_APPROVAL_FOR_ALL"
  | "APPROVAL_FOR_ALL_REVOKED";

/** A transaction as a wallet would ask you to sign it. */
export type TxInput = {
  chain_id: number;
  from: string | null;
  /** The contract being called — for ERC-20 calls, the token contract. */
  to: string;
  /** Native AVAX attached, in wei, as a decimal string. */
  value: string;
  /** Hex calldata. */
  data: string;
};

export type TokenInfo = {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
};

export type Decoded =
  | { kind: "transfer"; function: "transfer(address,uint256)"; selector: string; recipient: string; amount_raw: string }
  | {
      kind: "approve";
      function: "approve(address,uint256)" | "increaseAllowance(address,uint256)";
      selector: string;
      spender: string;
      amount_raw: string;
      unlimited: boolean;
    }
  | { kind: "approval_for_all"; function: "setApprovalForAll(address,bool)"; selector: string; operator: string; approved: boolean }
  | { kind: "unknown"; selector: string | null };

export type Finding = {
  rule_id: RuleId;
  severity: Severity;
  /** True when the finding is about missing reputation data rather than a known risk. */
  unverified: boolean;
  title: string;
  evidence: string;
};

export type Counterparty = {
  role: "spender" | "recipient" | "operator";
  address: string;
  label: string | null;
};

export type SecurityReport = {
  schema_version: "1.0";
  scenario_id: string | null;
  /** True when the input is one of our prepared demo transactions. */
  sample_data: boolean;
  /** When this analysis ran (ISO 8601). Makes every report's fingerprint unique. */
  generated_at: string;
  chain: { name: string; chain_id: number };
  transaction: TxInput;
  decoded: Decoded;
  token: TokenInfo | null;
  counterparty: Counterparty | null;
  risk_level: RiskLevel;
  findings: Finding[];
  checks_performed: string[];
  not_checked: string[];
  recommended_action: string;
  /** SHA-256 of the report with these last two fields set to null. Filled by the app. */
  report_hash: string | null;
  /** Avalanche Fuji transaction that recorded report_hash. Filled after publishing. */
  verification_tx: string | null;
};
