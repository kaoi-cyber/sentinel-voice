"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Loader2, ScanSearch, Lightbulb } from "lucide-react";
import { analyze } from "@/lib/security/engine";
import { getScenario } from "@/lib/security/scenarios";
import { RISK_COPY, describeAction, explainFinding, sortFindings } from "@/lib/security/explain";
import type { SecurityReport } from "@/lib/security/types";
import { ScenarioPicker } from "./ScenarioPicker";
import { RiskBadge, severityDot } from "./RiskBadge";
import { ListenButton } from "@/components/voice/ListenButton";
import { explainReport } from "@/lib/voiceguard/answer";
import { replyToSpeech } from "@/lib/voice/scripts";

export function SentinelChecker() {
  const [selected, setSelected] = useState<string | null>(null);
  const [report, setReport] = useState<SecurityReport | null>(null);
  const [scanning, setScanning] = useState(false);

  function select(id: string) {
    setSelected(id);
    setReport(null);
  }

  function run() {
    const scenario = getScenario(selected);
    if (!scenario) return;
    setScanning(true);
    setReport(null);
    // The engine is instant; a short pause makes the scan readable in a live demo.
    setTimeout(() => {
      setReport(analyze(scenario.tx, { scenarioId: scenario.id, sample: true }));
      setScanning(false);
    }, 700);
  }

  return (
    <div className="mt-8 space-y-6">
      <ScenarioPicker selected={selected} onSelect={select} />

      <button
        type="button"
        onClick={run}
        disabled={!selected || scanning}
        className="inline-flex items-center gap-2 rounded-xl bg-violet px-5 py-3 font-semibold text-white transition hover:bg-violet/85 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {scanning ? <Loader2 size={18} className="animate-spin" /> : <ScanSearch size={18} />}
        {scanning ? "Checking…" : "Check this transaction"}
      </button>

      {report && <BeginnerReport report={report} />}
    </div>
  );
}

function BeginnerReport({ report }: { report: SecurityReport }) {
  return (
    <article className="glow-card rounded-3xl p-6 sm:p-8" aria-live="polite">
      <div className="flex flex-wrap items-center gap-3">
        <RiskBadge level={report.risk_level} size="lg" />
        {report.sample_data && (
          <span className="rounded-full border border-line px-3 py-1 text-xs text-muted">Sample transaction</span>
        )}
        <ListenButton id={`sentinel-${report.scenario_id}`} text={replyToSpeech(explainReport(report))} label="Explain it to me" />
      </div>
      <h2 className="mt-4 text-2xl font-extrabold tracking-tight">{RISK_COPY[report.risk_level].headline}</h2>
      <p className="mt-2 text-lg text-text/90">{describeAction(report)}</p>

      <h3 className="mt-8 text-sm font-semibold uppercase tracking-[0.15em] text-muted">What we found</h3>
      <ul className="mt-3 space-y-3">
        {sortFindings(report.findings).map((f) => (
          <li key={f.rule_id} className="flex gap-3">
            <span className={`mt-2 h-2 w-2 shrink-0 rounded-full ${severityDot(f.severity)}`} />
            <span className="text-text/90">{explainFinding(f, report)}</span>
          </li>
        ))}
      </ul>

      <div className="mt-8 flex gap-3 rounded-2xl border border-gold/40 bg-gold/10 p-4">
        <Lightbulb className="shrink-0 text-gold" size={20} />
        <div>
          <p className="font-semibold text-gold">What you should do</p>
          <p className="mt-1 text-text/90">{report.recommended_action}</p>
        </div>
      </div>

      <details className="mt-6 rounded-2xl border border-line p-4">
        <summary className="cursor-pointer text-sm font-semibold">What we checked — and what we didn&apos;t</summary>
        <div className="mt-4 grid gap-6 text-sm sm:grid-cols-2">
          <CheckList title="Checked" items={report.checks_performed} mark="✓" cls="text-safe" />
          <CheckList title="Not checked" items={report.not_checked} mark="–" cls="text-muted" />
        </div>
      </details>

      <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3">
        <Link
          href={`/learn?explain=${report.scenario_id ?? ""}`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-blue hover:text-blue/80"
        >
          Ask VoiceGuard to explain this <ArrowRight size={16} />
        </Link>
        <Link
          href={`/expert?scenario=${report.scenario_id ?? ""}`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-violet hover:text-violet/80"
        >
          See the technical evidence <ArrowRight size={16} />
        </Link>
      </div>
    </article>
  );
}

function CheckList({ title, items, mark, cls }: { title: string; items: string[]; mark: string; cls: string }) {
  return (
    <div>
      <p className="font-semibold">{title}</p>
      <ul className="mt-2 space-y-1.5">
        {items.map((c) => (
          <li key={c} className="flex gap-2 text-muted">
            <span className={cls}>{mark}</span>
            {c}
          </li>
        ))}
      </ul>
    </div>
  );
}
