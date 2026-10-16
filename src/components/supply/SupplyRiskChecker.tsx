"use client";

import { useEffect, useState } from "react";
import { CalendarClock, Check, Copy, Database, FlaskConical, Fingerprint, Lightbulb, Loader2, ScanSearch } from "lucide-react";
import { RecordOnAvalanche } from "@/components/avalanche/RecordOnAvalanche";
import { VerifyReport } from "@/components/avalanche/VerifyReport";
import { RiskBadge, SeverityPill, severityDot } from "@/components/security/RiskBadge";
import { ListenButton } from "@/components/voice/ListenButton";
import { hashReport } from "@/lib/security/hash";
import { explainSupplyFinding, sortSupplyFindings, supplyHeadline, supplySpeech } from "@/lib/supply/explain";
import type { SupplyReport } from "@/lib/supply/types";
import { FloatBar, formatAmount, GROUP_COLOR, HolderChart } from "./HolderChart";
import { supplyReport, supplyStatus } from "@/lib/supply/clientApi";

type Status = { live: boolean; reason: string | null; samples: string[]; suggestions: string[] };

const SAMPLE_LABEL: Record<string, string> = {
  "sample-nova": "Nova Protocol (sample)",
  "sample-steady": "Steady Chain (sample)",
};

export function SupplyRiskChecker() {
  const [status, setStatus] = useState<Status | null>(null);
  const [tokenId, setTokenId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<SupplyReport | null>(null);

  useEffect(() => {
    supplyStatus()
      .then(setStatus)
      .catch(() => setStatus({ live: false, reason: "Couldn't reach the server", samples: Object.keys(SAMPLE_LABEL), suggestions: [] }));
  }, []);

  // /supply?token=<id> opens straight onto that token (handy for links and demos).
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("token");
    if (id) void check(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function check(id = tokenId) {
    if (!id.trim()) return;
    setTokenId(id);
    setLoading(true);
    setError(null);
    setReport(null);
    try {
      setReport(await supplyReport(id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-8 space-y-6">
      <DataSourceBanner status={status} />

      <form
        className="glow-card flex flex-col gap-3 rounded-2xl p-4 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          void check();
        }}
      >
        <input
          value={tokenId}
          onChange={(e) => setTokenId(e.target.value)}
          placeholder={status?.live ? "Tokenomist token id, e.g. arbitrum" : "Pick a sample token below"}
          aria-label="Token id"
          className="min-w-0 flex-1 rounded-xl border border-line bg-ink/70 px-4 py-3 font-mono text-sm text-text outline-none placeholder:text-muted focus:border-blue"
        />
        <button
          type="submit"
          disabled={loading || !tokenId.trim()}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet px-5 py-3 font-semibold text-white transition hover:bg-violet/85 disabled:opacity-40"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <ScanSearch size={18} />}
          Check supply risk
        </button>
      </form>

      {status && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted">Try:</span>
          {status.samples.map((id) => (
            <Chip key={id} onClick={() => check(id)} icon={<FlaskConical size={13} />}>
              {SAMPLE_LABEL[id] ?? id}
            </Chip>
          ))}
          {status.suggestions.map((id) => (
            <Chip key={id} onClick={() => check(id)}>
              {id}
            </Chip>
          ))}
        </div>
      )}

      {error && <p className="rounded-xl border border-danger/40 bg-danger/10 p-3 text-sm text-danger">{error}</p>}
      {report && <SupplyReportView key={report.generated_at} report={report} />}
    </div>
  );
}

function Chip({ children, onClick, icon }: { children: React.ReactNode; onClick: () => void; icon?: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1 text-muted transition hover:border-blue/60 hover:text-text"
    >
      {icon}
      {children}
    </button>
  );
}

function DataSourceBanner({ status }: { status: Status | null }) {
  if (!status) return null;
  return status.live ? (
    <p className="flex items-center gap-2 text-sm text-safe">
      <Database size={16} /> Connected to live Tokenomist data.
    </p>
  ) : (
    <div className="flex gap-3 rounded-xl border border-gold/40 bg-gold/10 p-3 text-sm">
      <FlaskConical size={18} className="shrink-0 text-gold" />
      <p>
        <span className="font-semibold text-gold">Sample mode.</span> Live Tokenomist data isn&apos;t available ({status.reason}). The tokens
        below are fictional samples in Tokenomist&apos;s exact data format — real tokens will work as soon as API access is enabled.
      </p>
    </div>
  );
}

function SupplyReportView({ report }: { report: SupplyReport }) {
  const [hash, setHash] = useState<string | null>(null);
  const [tx, setTx] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showEvidence, setShowEvidence] = useState(false);

  useEffect(() => {
    hashReport(report).then(setHash);
  }, [report]);

  const json = JSON.stringify({ ...report, report_hash: hash, verification_tx: tx }, null, 2);
  const m = report.metrics;
  const n = m.next_unlock;
  const ds = report.data_source;

  return (
    <div className="space-y-6">
      <article className="glow-card rounded-3xl p-6 sm:p-8" aria-live="polite">
        <div className="flex flex-wrap items-center gap-3">
          <RiskBadge level={report.risk_level} size="lg" />
          {ds.mode === "sample" && <span className="rounded-full border border-gold/50 px-3 py-1 text-xs text-gold">Sample token — fictional</span>}
          <ListenButton id={`supply-${report.generated_at}`} text={supplySpeech(report)} label="Explain it to me" />
        </div>
        <h2 className="mt-4 text-2xl font-extrabold tracking-tight">
          {report.token.name} <span className="text-muted">({report.token.symbol})</span>
        </h2>
        <p className="mt-1 text-lg text-text/90">{supplyHeadline(report)}</p>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {n && (
            <div className="rounded-2xl border border-line bg-ink/40 p-4">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-muted">
                <CalendarClock size={14} /> Next unlock
              </p>
              <p className="mt-2 text-3xl font-extrabold">
                {n.days_away} <span className="text-base font-semibold text-muted">days away</span>
              </p>
              <p className="text-sm text-muted">{new Date(n.date).toLocaleDateString(undefined, { dateStyle: "medium" })}</p>
              <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <dt className="text-muted">Amount</dt>
                <dd className="text-right font-mono">
                  {formatAmount(n.amount)} {report.token.symbol}
                </dd>
                <dt className="text-muted">Value</dt>
                <dd className="text-right font-mono">${formatAmount(n.value_usd)}</dd>
                <dt className="text-muted">% of market cap</dt>
                <dd className="text-right font-mono text-text">{n.value_to_market_cap_percent.toFixed(2)}%</dd>
                <dt className="text-muted">To insiders</dt>
                <dd className="text-right font-mono">{n.insider_share_percent.toFixed(0)}%</dd>
              </dl>
              <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted">
                {n.breakdown.map((b) => (
                  <span key={b.group} className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-sm" style={{ background: GROUP_COLOR[b.group] }} />
                    {b.label}: {formatAmount(b.amount)}
                  </span>
                ))}
              </div>
            </div>
          )}
          <div className="space-y-4 rounded-2xl border border-line bg-ink/40 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted">Who holds the supply</p>
            {m.holders.length ? <HolderChart holders={m.holders} symbol={report.token.symbol} /> : <p className="text-sm text-muted">No allocation data.</p>}
            {m.unlocked_percent !== null && <FloatBar percent={m.unlocked_percent} />}
          </div>
        </div>

        <div className="mt-8 flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold uppercase tracking-[0.15em] text-muted">What we found</h3>
          <button type="button" onClick={() => setShowEvidence((v) => !v)} className="text-xs font-semibold text-violet hover:text-violet/80">
            {showEvidence ? "Hide evidence" : "Show evidence"}
          </button>
        </div>
        <ul className="mt-3 space-y-3">
          {sortSupplyFindings(report.findings).map((f) => (
            <li key={f.rule_id} className="flex gap-3">
              <span className={`mt-2 h-2 w-2 shrink-0 rounded-full ${severityDot(f.severity)}`} />
              <div>
                <p className="text-text/90">{explainSupplyFinding(f, report)}</p>
                {showEvidence && (
                  <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
                    <span className="font-mono text-blue">{f.rule_id}</span>
                    <SeverityPill severity={f.severity} />
                    {f.unverified && <span className="font-mono text-gold">unverified</span>}
                    <span className="break-all">{f.evidence}</span>
                    <span className="font-mono">source: {f.source_fields.join(", ")}</span>
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-8 flex gap-3 rounded-2xl border border-gold/40 bg-gold/10 p-4">
          <Lightbulb className="shrink-0 text-gold" size={20} />
          <div>
            <p className="font-semibold text-gold">What this means for you</p>
            <p className="mt-1 text-text/90">{report.recommended_action}</p>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-line p-4 text-sm">
          <p className="flex items-center gap-2 font-semibold">
            <Database size={16} className="text-blue" /> Where this data comes from
          </p>
          <ul className="mt-2 space-y-1 text-muted">
            <li>
              Provider: <span className="text-text">Tokenomist</span> · {ds.mode === "live" ? "live API" : "fictional sample in Tokenomist's format"}
            </li>
            <li>Queried: {new Date(ds.query_date).toLocaleString()}</li>
            {ds.token_last_updated && <li>Token data last updated by Tokenomist: {new Date(ds.token_last_updated).toLocaleDateString()}</li>}
            {ds.listed_method && <li>Listing method: {ds.listed_method}</li>}
            <li className="break-all">
              Data fingerprint: <span className="font-mono text-xs text-text">{ds.data_hash}</span>
            </li>
          </ul>
          <details className="mt-3">
            <summary className="cursor-pointer font-semibold">What we checked — and what we didn&apos;t</summary>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <ul className="space-y-1 text-muted">
                {report.checks_performed.map((c) => (
                  <li key={c}>
                    <span className="text-safe">✓</span> {c}
                  </li>
                ))}
              </ul>
              <ul className="space-y-1 text-muted">
                {report.not_checked.map((c) => (
                  <li key={c}>– {c}</li>
                ))}
              </ul>
            </div>
          </details>
        </div>
      </article>

      <section className="glow-card rounded-2xl p-5">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-muted">Report</h2>
        <div className="flex flex-wrap items-center gap-3">
          <Fingerprint size={18} className="text-violet" />
          <span className="text-sm text-muted">SHA-256</span>
          <code className="break-all font-mono text-xs">{hash ?? "computing…"}</code>
        </div>
        <button
          type="button"
          onClick={() =>
            navigator.clipboard.writeText(json).then(() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            })
          }
          className="mt-4 inline-flex items-center gap-2 rounded-xl border border-line px-4 py-2 text-sm font-semibold hover:border-blue/60"
        >
          {copied ? <Check size={16} className="text-safe" /> : <Copy size={16} />}
          {copied ? "Copied" : "Copy JSON"}
        </button>
        <div className="mt-4">
          <RecordOnAvalanche reportHash={hash} riskLevel={report.risk_level} onRecorded={setTx} />
        </div>
        <details className="mt-4">
          <summary className="cursor-pointer text-sm font-semibold">Raw report JSON</summary>
          <pre className="mt-3 max-h-96 overflow-auto rounded-xl border border-line bg-ink/70 p-4 font-mono text-xs leading-relaxed text-text/85">
            {json}
          </pre>
        </details>
      </section>

      <VerifyReport currentJson={hash ? json : undefined} />
    </div>
  );
}
