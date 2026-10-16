// Turns a wallet team's test results + control answers into a scored, prioritised audit report.
// Deterministic and transparent: every point and every gap traces to a test or a control.
import type { RiskLevel } from "@/lib/security/types";
import { CONTROLS, type ControlAnswer } from "./controls";
import { detect } from "./detect";
import { PAYLOADS_HIDDEN, TEST_PACK } from "./testpack";

export const TEST_PACK_VERSION = "2026.10";

export type WalletResult = "blocked" | "clear_warning" | "weak_warning" | "no_warning" | "not_tested";

export const RESULT_LABEL: Record<WalletResult, string> = {
  blocked: "Blocked",
  clear_warning: "Clear warning",
  weak_warning: "Weak / generic warning",
  no_warning: "No warning",
  not_tested: "Not tested yet",
};

const CREDIT: Record<WalletResult, number> = { blocked: 1, clear_warning: 1, weak_warning: 0.5, no_warning: 0, not_tested: 0 };
const ANSWER_CREDIT: Record<ControlAnswer, number> = { yes: 1, partial: 0.5, no: 0, unknown: 0 };

export type Gap = { severity: "critical" | "high" | "medium" | "low"; area: string; title: string; why: string; fix: string };

export type WalletAuditReport = {
  schema_version: "wallet-audit-1.0";
  generated_at: string;
  company: string;
  wallet: string;
  assessment_type: string;
  test_pack_version: string;
  test_results: { id: string; name: string; kind: "attack" | "control"; weight: number; wallet_result: WalletResult; sentinel_flagged: boolean }[];
  controls: { id: string; area: string; answer: ControlAnswer }[];
  scores: { drainer_coverage_percent: number; controls_percent: number; false_alarms: number; overall: number; grade: "A" | "B" | "C" | "D" | "F" };
  risk_level: RiskLevel;
  gaps: Gap[];
  disclosure: string;
  report_hash: string | null;
  verification_tx: string | null;
};

const SEV_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };

export function buildAuditReport(input: {
  company: string;
  wallet: string;
  results: Record<string, WalletResult>;
  answers: Record<string, ControlAnswer>;
  now?: Date;
}): WalletAuditReport {
  const gaps: Gap[] = [];

  const testResults = TEST_PACK.map((t) => ({
    id: t.id,
    name: t.name,
    kind: t.kind,
    weight: t.weight,
    wallet_result: input.results[t.id] ?? "not_tested",
    // Without payloads (public demo) the verdict is the one the full app's tests confirm: attacks flagged, controls not.
    sentinel_flagged: PAYLOADS_HIDDEN ? t.kind === "attack" : detect(t.request, t.recentAddresses).flagged,
  }));

  // Drainer coverage: attack cases, weighted by how damaging a miss would be.
  const attacks = TEST_PACK.filter((t) => t.kind === "attack");
  const maxAttack = attacks.reduce((s, t) => s + t.weight, 0);
  const gotAttack = attacks.reduce((s, t) => s + t.weight * CREDIT[input.results[t.id] ?? "not_tested"], 0);
  for (const t of attacks) {
    const r = input.results[t.id] ?? "not_tested";
    if (CREDIT[r] === 1) continue;
    gaps.push({
      severity: r === "not_tested" ? "medium" : t.weight === 3 ? (r === "no_warning" ? "critical" : "high") : r === "no_warning" ? "high" : "medium",
      area: "Drainer test pack",
      title: r === "not_tested" ? `Not yet tested: ${t.name}` : `${RESULT_LABEL[r]} on ${t.name}`,
      why: t.howItDrains,
      fix: t.walletShould,
    });
  }

  // Controls: false alarms on legitimate actions train users to click through warnings.
  let falseAlarms = 0;
  for (const t of TEST_PACK.filter((x) => x.kind === "control")) {
    const r = input.results[t.id] ?? "not_tested";
    if (r === "blocked" || r === "clear_warning" || r === "weak_warning") {
      falseAlarms++;
      gaps.push({ severity: "low", area: "Drainer test pack", title: `False alarm on ${t.name.replace("Control: ", "")}`, why: "Warnings on safe actions cause warning fatigue — users learn to ignore them.", fix: t.walletShould });
    }
  }

  const maxCtl = CONTROLS.reduce((s, c) => s + c.weight, 0);
  const gotCtl = CONTROLS.reduce((s, c) => s + c.weight * ANSWER_CREDIT[input.answers[c.id] ?? "no"], 0);
  for (const c of CONTROLS) {
    const a = input.answers[c.id] ?? "no";
    if (a === "yes") continue;
    gaps.push({
      severity: a === "unknown" ? "medium" : c.weight === 3 ? (a === "no" ? "critical" : "high") : a === "no" ? "medium" : "low",
      area: c.area,
      title: a === "unknown" ? `Not verified: ${c.question}` : a === "partial" ? `Partially in place: ${c.question}` : `Missing: ${c.question}`,
      why: c.risk,
      fix: c.fix,
    });
  }

  const coverage = (gotAttack / maxAttack) * 100;
  const controls = (gotCtl / maxCtl) * 100;
  const overall = Math.max(0, Math.round(0.6 * coverage + 0.4 * controls - falseAlarms * 2));
  const grade = overall >= 90 ? "A" : overall >= 75 ? "B" : overall >= 60 ? "C" : overall >= 40 ? "D" : "F";

  return {
    schema_version: "wallet-audit-1.0",
    generated_at: (input.now ?? new Date()).toISOString(),
    company: input.company.trim() || "Unnamed company",
    wallet: input.wallet.trim() || "Unnamed wallet",
    assessment_type: "Drainer Readiness Audit — drainer test pack replayed by the wallet team + security controls questionnaire",
    test_pack_version: TEST_PACK_VERSION,
    test_results: testResults,
    controls: CONTROLS.map((c) => ({ id: c.id, area: c.area, answer: input.answers[c.id] ?? "no" })),
    scores: { drainer_coverage_percent: Math.round(coverage), controls_percent: Math.round(controls), false_alarms: falseAlarms, overall, grade },
    risk_level: grade === "A" || grade === "B" ? "low" : grade === "C" ? "medium" : "high",
    gaps: gaps.sort((a, b) => SEV_ORDER[a.severity] - SEV_ORDER[b.severity]),
    disclosure:
      "Self-assessment: test results and control answers are reported by the wallet team and were not independently verified by Sentinel. This is not a penetration test or a guarantee of security.",
    report_hash: null,
    verification_tx: null,
  };
}
