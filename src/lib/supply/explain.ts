// Beginner wording for supply findings. Explains the engine's findings — never adds a verdict.
import { RISK_COPY } from "@/lib/security/explain";
import type { SupplyFinding, SupplyReport } from "./types";

const SEVERITY_ORDER = { high: 0, medium: 1, low: 2, info: 3 } as const;
export const sortSupplyFindings = (f: SupplyFinding[]) =>
  [...f].sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);

const pct = (n: number) => `${n.toFixed(n < 10 ? 1 : 0)}%`;

export function explainSupplyFinding(f: SupplyFinding, r: SupplyReport): string {
  const s = r.token.symbol;
  const m = r.metrics;
  const n = m.next_unlock;
  switch (f.rule_id) {
    case "LARGE_UNLOCK_SOON":
    case "MODERATE_UNLOCK_SOON":
      return `In ${n?.days_away} days, ${s} tokens worth about ${pct(n?.value_to_market_cap_percent ?? 0)} of the whole market value become free to sell. More tokens for sale with the same demand often pushes prices down.`;
    case "SMALL_UNLOCK_SOON":
      return `A small batch of ${s} unlocks in ${n?.days_away} days — too small, relative to the market, to be a big concern on its own.`;
    case "NO_UNLOCK_SOON":
      return `No big batch of ${s} is scheduled to unlock in the next month.`;
    case "INSIDER_HEAVY_UNLOCK":
      return `Most of those unlocking tokens go to the team and early investors. They often bought much cheaper, so they may be more willing to sell.`;
    case "INSIDER_CONCENTRATION":
      return `The team and private investors control ${pct(m.insider_percent ?? 0)} of all ${s}. When a few groups hold that much, their decisions can move the price a lot.`;
    case "INSIDER_SHARE":
      return `The team and private investors hold ${pct(m.insider_percent ?? 0)} of ${s} — not an unusually large share.`;
    case "LOW_FLOAT":
      return `Only ${pct(m.unlocked_percent ?? 0)} of all ${s} that will ever exist is unlocked today. Most of the supply is still coming, which can weigh on the price for years.`;
    case "PARTIAL_FLOAT":
      return `About ${pct(m.unlocked_percent ?? 0)} of ${s} is unlocked so far — a good chunk is still to come.`;
    case "HIGH_FLOAT":
      return `Most ${s} (${pct(m.unlocked_percent ?? 0)}) is already unlocked, so there's less new supply waiting.`;
    case "TBD_SUPPLY":
      return `A big pile of ${s} has no fixed release date — the project can release it whenever it decides. That's an unknown you can't plan around.`;
    case "UNLOCK_DATA_UNAVAILABLE":
      return "We couldn't get the upcoming unlock schedule, so we can't tell you whether a big unlock is coming. Unknown is not the same as safe.";
    case "DATA_STALE":
      return "This token's data hasn't been updated in a while, so it may be out of date.";
    case "AI_LISTED_DATA":
      return "Tokenomist built this token's data with AI assistance rather than a full manual review, so treat it with extra care.";
    case "DATA_INCONSISTENT":
      return "The numbers for this token don't add up, so we won't draw conclusions from them.";
    case "NO_DATA":
      return "We couldn't find supply data for this token.";
  }
}

const HEADLINE: Record<SupplyReport["risk_level"], string> = {
  low: "No major supply-pressure signals found.",
  medium: "Some supply risks are worth understanding.",
  high: "Heads up — significant new supply is coming.",
  unverified: "Part of the supply picture can't be verified.",
  insufficient: "Not enough data to judge supply risk.",
};

export function supplyHeadline(r: SupplyReport): string {
  return HEADLINE[r.risk_level];
}

/** What VoiceGuard says out loud. */
export function supplySpeech(r: SupplyReport): string {
  const parts = [`Supply check for ${r.token.name}: ${RISK_COPY[r.risk_level].label}.`];
  for (const f of sortSupplyFindings(r.findings).filter((x) => x.severity !== "info")) parts.push(explainSupplyFinding(f, r));
  parts.push(r.recommended_action);
  if (r.data_source.mode === "sample") parts.push("Note: this is a fictional sample token, not live data.");
  return parts.join(" ");
}
