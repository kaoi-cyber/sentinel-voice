// Deterministic supply-risk rules over Tokenomist data. No AI, no price predictions:
// it flags known supply-pressure patterns and cites the exact field behind each one.
// Missing or inconsistent data is never treated as "safe".
import type { RiskLevel } from "@/lib/security/types";
import type { TokenomistSnapshot } from "@/lib/tokenomist/types";
import type { HolderGroup, StandardGroup, SupplyFinding, SupplyReport } from "./types";

export const THRESHOLDS = {
  unlock_window_days: 30,
  large_unlock_percent_of_mcap: 5,
  moderate_unlock_percent_of_mcap: 2,
  insider_heavy_unlock_share_percent: 50,
  low_float_percent: 30,
  partial_float_percent: 50,
  insider_concentration_percent: 40,
  tbd_supply_percent: 20,
  stale_data_days: 180,
};

export const GROUP_LABEL: Record<StandardGroup, string> = {
  founderTeam: "Founder / Team",
  privateInvestors: "Private Investors",
  publicInvestors: "Public Investors",
  community: "Community",
  reserve: "Reserve",
  others: "Other",
};
export const GROUP_ORDER: StandardGroup[] = ["founderTeam", "privateInvestors", "publicInvestors", "community", "reserve", "others"];
const INSIDERS: StandardGroup[] = ["founderTeam", "privateInvestors"];

/** Maps Tokenomist's standardAllocationName onto its six standard groups. */
export function toGroup(standardName: string): StandardGroup {
  const n = standardName.toLowerCase();
  if (/founder|team/.test(n)) return "founderTeam";
  if (/private/.test(n)) return "privateInvestors";
  if (/public/.test(n)) return "publicInvestors";
  if (/community/.test(n)) return "community";
  if (/reserve/.test(n)) return "reserve";
  return "others";
}

const DAY = 86_400_000;
const pct = (n: number) => `${n.toFixed(n < 10 ? 1 : 0)}%`;
const num = (n: number) => Math.round(n).toLocaleString("en-US");
const usd = (n: number) => "$" + Math.round(n).toLocaleString("en-US");

const NOT_CHECKED = [
  "Future price — unlocks add supply but don't decide the price",
  "Whether recipients will actually sell unlocked tokens",
  "Exchange liquidity, order books and market demand",
  "Smart-contract security of the token itself",
];

export function analyzeSupply(snap: TokenomistSnapshot, opts: { now?: Date; dataHash: string }): SupplyReport {
  const now = opts.now ?? new Date();
  const findings: SupplyFinding[] = [];
  const checks: string[] = [];
  const add = (f: Omit<SupplyFinding, "unverified"> & { unverified?: boolean }) => findings.push({ unverified: false, ...f });

  const a = snap.allocations;
  const t = snap.token;
  const symbol = a?.symbol ?? t?.symbol ?? snap.tokenId.toUpperCase();
  const maxSupply = a?.maxSupply ?? t?.maxSupply ?? null;
  const marketCap = t?.marketCap ?? null;
  const lastUpdated = a?.lastUpdatedDate ?? t?.lastUpdatedDate ?? null;
  const listedMethod = a?.listedMethod ?? t?.listedMethod ?? null;

  // ── Data quality first: these gate everything else ─────────────────────
  checks.push("Checked the data exists and is internally consistent");
  if (!a) {
    add({
      rule_id: "NO_DATA",
      severity: "medium",
      title: "No allocation data available",
      evidence: `Tokenomist returned no allocation data for "${snap.tokenId}".`,
      source_fields: ["allocations"],
    });
  } else {
    const tracked = a.totalUnlockedAmount + a.totalLockedAmount + a.totalTBDLockedAmount + a.totalUntrackedAmount;
    const pctSum = a.allocations.reduce((s, x) => s + x.trackedAllocationPercentage, 0);
    const overMax = maxSupply !== null && tracked > maxSupply * 1.01;
    const badPct = a.allocations.length > 0 && (pctSum < 90 || pctSum > 101);
    if (overMax || badPct) {
      add({
        rule_id: "DATA_INCONSISTENT",
        severity: "medium",
        title: "Supply figures don't add up",
        evidence: overMax
          ? `unlocked + locked + TBD + untracked = ${num(tracked)} exceeds maxSupply ${num(maxSupply!)}.`
          : `trackedAllocationPercentage sums to ${pctSum.toFixed(1)}%, expected ~100%.`,
        source_fields: ["allocations.totalUnlockedAmount", "allocations.maxSupply", "allocations[].trackedAllocationPercentage"],
      });
    }
  }

  if (lastUpdated) {
    checks.push(`Checked the data is no older than ${THRESHOLDS.stale_data_days} days`);
    const age = Math.floor((now.getTime() - new Date(lastUpdated).getTime()) / DAY);
    if (age > THRESHOLDS.stale_data_days) {
      add({
        rule_id: "DATA_STALE",
        severity: "low",
        unverified: true,
        title: `Data last updated ${age} days ago`,
        evidence: `lastUpdatedDate = ${lastUpdated}.`,
        source_fields: ["allocations.lastUpdatedDate"],
      });
    }
  }
  if (listedMethod === "AI") {
    add({
      rule_id: "AI_LISTED_DATA",
      severity: "low",
      unverified: true,
      title: "Tokenomics listed with AI assistance",
      evidence: 'listedMethod = "AI" — Tokenomist marks this data as AI-assisted rather than fully reviewed.',
      source_fields: ["allocations.listedMethod"],
    });
  }

  // ── Holders: who owns the supply ─────────────────────────────────────────
  let holders: HolderGroup[] = [];
  let insiderPercent: number | null = null;
  if (a && a.allocations.length) {
    checks.push("Grouped allocations into Tokenomist's six standard holder types");
    const totals = new Map<StandardGroup, number>();
    for (const x of a.allocations) totals.set(toGroup(x.standardAllocationName), (totals.get(toGroup(x.standardAllocationName)) ?? 0) + x.allocationAmount);
    const total = [...totals.values()].reduce((s, v) => s + v, 0);
    holders = GROUP_ORDER.filter((g) => totals.has(g)).map((g) => ({
      group: g,
      label: GROUP_LABEL[g],
      amount: totals.get(g)!,
      percent: total ? (totals.get(g)! / total) * 100 : 0,
    }));
    insiderPercent = holders.filter((h) => INSIDERS.includes(h.group)).reduce((s, h) => s + h.percent, 0);
    const insiderEvidence = `Founder / Team + Private Investors = ${pct(insiderPercent)} of allocated supply.`;
    if (insiderPercent >= THRESHOLDS.insider_concentration_percent) {
      add({
        rule_id: "INSIDER_CONCENTRATION",
        severity: "medium",
        title: `Insiders hold ${pct(insiderPercent)} of supply`,
        evidence: insiderEvidence,
        source_fields: ["allocations[].standardAllocationName", "allocations[].allocationAmount"],
      });
    } else {
      add({
        rule_id: "INSIDER_SHARE",
        severity: "info",
        title: `Insiders hold ${pct(insiderPercent)} of supply`,
        evidence: insiderEvidence,
        source_fields: ["allocations[].standardAllocationName", "allocations[].allocationAmount"],
      });
    }
  }

  // ── Float: how much supply is already out ────────────────────────────────
  let unlockedPercent: number | null = null;
  if (a && maxSupply) {
    checks.push("Compared unlocked supply with max supply");
    unlockedPercent = (a.totalUnlockedAmount / maxSupply) * 100;
    const ev = `totalUnlockedAmount ${num(a.totalUnlockedAmount)} of maxSupply ${num(maxSupply)} ${symbol}.`;
    const fields = ["allocations.totalUnlockedAmount", "allocations.maxSupply"];
    if (unlockedPercent < THRESHOLDS.low_float_percent) {
      add({ rule_id: "LOW_FLOAT", severity: "medium", title: `Only ${pct(unlockedPercent)} of supply unlocked`, evidence: ev, source_fields: fields });
    } else if (unlockedPercent < THRESHOLDS.partial_float_percent) {
      add({ rule_id: "PARTIAL_FLOAT", severity: "low", title: `${pct(unlockedPercent)} of supply unlocked`, evidence: ev, source_fields: fields });
    } else {
      add({ rule_id: "HIGH_FLOAT", severity: "info", title: `${pct(unlockedPercent)} of supply already unlocked`, evidence: ev, source_fields: fields });
    }

    const tbdPercent = (a.totalTBDLockedAmount / maxSupply) * 100;
    if (tbdPercent >= THRESHOLDS.tbd_supply_percent) {
      add({
        rule_id: "TBD_SUPPLY",
        severity: "medium",
        unverified: true,
        title: `${pct(tbdPercent)} of supply has no release schedule`,
        evidence: `totalTBDLockedAmount ${num(a.totalTBDLockedAmount)} ${symbol} — can be released at the project's discretion.`,
        source_fields: ["allocations.totalTBDLockedAmount"],
      });
    }
  }

  // ── Next unlock: the early-warning signal ────────────────────────────────
  let nextUnlock: SupplyReport["metrics"]["next_unlock"] = null;
  if (snap.unlockEvents === null) {
    add({
      rule_id: "UNLOCK_DATA_UNAVAILABLE",
      severity: "medium",
      unverified: true,
      title: "Upcoming unlock data not available",
      evidence: "The unlock-events endpoint wasn't available for this API key, so upcoming unlocks couldn't be checked.",
      source_fields: ["unlock/events"],
    });
  } else {
    checks.push(`Looked for cliff unlocks in the next ${THRESHOLDS.unlock_window_days} days`);
    const upcoming = snap.unlockEvents.find((e) => new Date(e.unlockDate).getTime() >= now.getTime());
    if (upcoming) {
      const c = upcoming.cliffUnlocks;
      const daysAway = Math.ceil((new Date(upcoming.unlockDate).getTime() - now.getTime()) / DAY);
      const groups = new Map<StandardGroup, number>();
      for (const b of c.allocationBreakdown) groups.set(toGroup(b.standardAllocationName), (groups.get(toGroup(b.standardAllocationName)) ?? 0) + b.cliffAmount);
      const insiderAmount = INSIDERS.reduce((s, g) => s + (groups.get(g) ?? 0), 0);
      const insiderShare = c.cliffAmount ? (insiderAmount / c.cliffAmount) * 100 : 0;
      nextUnlock = {
        date: upcoming.unlockDate,
        days_away: daysAway,
        amount: c.cliffAmount,
        value_usd: c.cliffValue,
        value_to_market_cap_percent: c.valueToMarketCap,
        insider_share_percent: insiderShare,
        breakdown: GROUP_ORDER.filter((g) => groups.has(g)).map((g) => ({ group: g, label: GROUP_LABEL[g], amount: groups.get(g)! })),
      };

      const when = `${upcoming.unlockDate.slice(0, 10)} (in ${daysAway} day${daysAway === 1 ? "" : "s"})`;
      const ev = `cliffAmount ${num(c.cliffAmount)} ${symbol} ≈ ${usd(c.cliffValue)}, valueToMarketCap ${c.valueToMarketCap.toFixed(2)}%, on ${when}.`;
      const fields = ["unlock/events[].cliffUnlocks.cliffAmount", "cliffUnlocks.valueToMarketCap", "unlockDate"];
      if (daysAway <= THRESHOLDS.unlock_window_days) {
        if (c.valueToMarketCap >= THRESHOLDS.large_unlock_percent_of_mcap) {
          add({ rule_id: "LARGE_UNLOCK_SOON", severity: "high", title: `Large unlock in ${daysAway} days: ${pct(c.valueToMarketCap)} of market cap`, evidence: ev, source_fields: fields });
        } else if (c.valueToMarketCap >= THRESHOLDS.moderate_unlock_percent_of_mcap) {
          add({ rule_id: "MODERATE_UNLOCK_SOON", severity: "medium", title: `Unlock in ${daysAway} days: ${pct(c.valueToMarketCap)} of market cap`, evidence: ev, source_fields: fields });
        } else {
          add({ rule_id: "SMALL_UNLOCK_SOON", severity: "info", title: `Small unlock in ${daysAway} days`, evidence: ev, source_fields: fields });
        }
        if (insiderShare >= THRESHOLDS.insider_heavy_unlock_share_percent) {
          add({
            rule_id: "INSIDER_HEAVY_UNLOCK",
            severity: "medium",
            title: `${pct(insiderShare)} of that unlock goes to insiders`,
            evidence: `Founder / Team + Private Investors receive ${num(insiderAmount)} of ${num(c.cliffAmount)} ${symbol}.`,
            source_fields: ["cliffUnlocks.allocationBreakdown[].standardAllocationName", "allocationBreakdown[].cliffAmount"],
          });
        }
      } else {
        add({ rule_id: "NO_UNLOCK_SOON", severity: "info", title: `No cliff unlock in the next ${THRESHOLDS.unlock_window_days} days`, evidence: `Next: ${ev}`, source_fields: fields });
      }
    } else {
      add({ rule_id: "NO_UNLOCK_SOON", severity: "info", title: "No upcoming cliff unlocks listed", evidence: "unlock/events returned no future events.", source_fields: ["unlock/events"] });
    }
  }

  const risk_level = overallRisk(findings);
  return {
    schema_version: "supply-1.0",
    generated_at: now.toISOString(),
    token: { id: snap.tokenId, name: a?.name ?? t?.name ?? snap.tokenId, symbol },
    data_source: {
      provider: "Tokenomist",
      mode: snap.mode,
      note: snap.sampleReason,
      query_date: snap.queryDate,
      token_last_updated: lastUpdated,
      listed_method: listedMethod,
      endpoints: snap.endpoints,
      data_hash: opts.dataHash,
    },
    metrics: {
      max_supply: maxSupply,
      unlocked: a?.totalUnlockedAmount ?? null,
      locked: a?.totalLockedAmount ?? null,
      tbd_locked: a?.totalTBDLockedAmount ?? null,
      untracked: a?.totalUntrackedAmount ?? null,
      unlocked_percent: unlockedPercent,
      market_cap_usd: marketCap,
      holders,
      insider_percent: insiderPercent,
      next_unlock: nextUnlock,
    },
    thresholds: THRESHOLDS,
    risk_level,
    findings,
    checks_performed: checks,
    not_checked: NOT_CHECKED,
    recommended_action: recommend(findings, risk_level, nextUnlock, symbol),
    report_hash: null,
    verification_tx: null,
  };
}

function overallRisk(findings: SupplyFinding[]): RiskLevel {
  if (findings.some((f) => f.rule_id === "NO_DATA" || f.rule_id === "DATA_INCONSISTENT")) return "insufficient";
  if (findings.some((f) => f.severity === "high")) return "high";
  if (findings.some((f) => f.unverified)) return "unverified";
  if (findings.some((f) => f.severity === "medium")) return "medium";
  return "low";
}

function recommend(findings: SupplyFinding[], risk: RiskLevel, next: SupplyReport["metrics"]["next_unlock"], symbol: string): string {
  const has = (id: SupplyFinding["rule_id"]) => findings.some((f) => f.rule_id === id);
  if (risk === "insufficient")
    return "We can't assess this token's supply risk from the available data — missing data is not a sign of safety. Check the project's official tokenomics before deciding anything.";
  if (has("LARGE_UNLOCK_SOON") && next)
    return `New supply worth ${next.value_to_market_cap_percent.toFixed(1)}% of ${symbol}'s market cap unlocks in ${next.days_away} days${
      has("INSIDER_HEAVY_UNLOCK") ? ", mostly to insiders" : ""
    }. Factor this in before buying or approving ${symbol}: large unlocks often add selling pressure. This is a risk signal, not a price prediction.`;
  if (risk === "unverified")
    return "Part of this token's supply picture couldn't be verified. Treat the gaps as unknowns, not as safe, and check the project's official vesting schedule.";
  if (risk === "medium")
    return `${symbol} has supply-side risks worth understanding — see the flagged items. None of them predicts the price, but they can add selling pressure over time.`;
  return `No major supply-pressure signals found for ${symbol} in the next ${THRESHOLDS.unlock_window_days} days. Supply is only one part of risk — this says nothing about price or smart-contract safety.`;
}
