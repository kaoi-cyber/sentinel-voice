// The supply-risk report. Same principles as the transaction report: fixed rules decide,
// every finding cites the exact Tokenomist field and value it came from.
import type { RiskLevel, Severity } from "@/lib/security/types";

export type StandardGroup = "founderTeam" | "privateInvestors" | "publicInvestors" | "community" | "reserve" | "others";

export type SupplyRuleId =
  | "NO_DATA"
  | "DATA_INCONSISTENT"
  | "DATA_STALE"
  | "AI_LISTED_DATA"
  | "UNLOCK_DATA_UNAVAILABLE"
  | "LARGE_UNLOCK_SOON"
  | "MODERATE_UNLOCK_SOON"
  | "SMALL_UNLOCK_SOON"
  | "NO_UNLOCK_SOON"
  | "INSIDER_HEAVY_UNLOCK"
  | "LOW_FLOAT"
  | "PARTIAL_FLOAT"
  | "HIGH_FLOAT"
  | "INSIDER_CONCENTRATION"
  | "INSIDER_SHARE"
  | "TBD_SUPPLY";

export type SupplyFinding = {
  rule_id: SupplyRuleId;
  severity: Severity;
  unverified: boolean;
  title: string;
  evidence: string;
  /** Tokenomist field(s) the evidence comes from. */
  source_fields: string[];
};

export type HolderGroup = { group: StandardGroup; label: string; amount: number; percent: number };

export type SupplyReport = {
  schema_version: "supply-1.0";
  generated_at: string;
  token: { id: string; name: string; symbol: string };
  data_source: {
    provider: "Tokenomist";
    mode: "live" | "sample";
    note: string | null;
    query_date: string;
    token_last_updated: string | null;
    listed_method: string | null;
    endpoints: string[];
    /** SHA-256 of the exact Tokenomist data used — lets anyone check what the data said. */
    data_hash: string;
  };
  metrics: {
    max_supply: number | null;
    unlocked: number | null;
    locked: number | null;
    tbd_locked: number | null;
    untracked: number | null;
    unlocked_percent: number | null;
    market_cap_usd: number | null;
    holders: HolderGroup[];
    insider_percent: number | null;
    next_unlock: null | {
      date: string;
      days_away: number;
      amount: number;
      value_usd: number;
      value_to_market_cap_percent: number;
      insider_share_percent: number;
      breakdown: { group: StandardGroup; label: string; amount: number }[];
    };
  };
  thresholds: Record<string, number>;
  risk_level: RiskLevel;
  findings: SupplyFinding[];
  checks_performed: string[];
  not_checked: string[];
  recommended_action: string;
  report_hash: string | null;
  verification_tx: string | null;
};
