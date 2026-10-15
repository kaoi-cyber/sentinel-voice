"use client";

import { useEffect, useState } from "react";
import { Check, ClipboardList, Copy, FileCheck2, FlaskConical, Loader2, Send, ShieldCheck, ShieldX, Wand2 } from "lucide-react";
import { RecordOnAvalanche } from "@/components/avalanche/RecordOnAvalanche";
import { VerifyReport } from "@/components/avalanche/VerifyReport";
import { CONTROLS, type ControlAnswer } from "@/lib/audit/controls";
import { detect } from "@/lib/audit/detect";
import { buildAuditReport, RESULT_LABEL, type Gap, type WalletAuditReport, type WalletResult } from "@/lib/audit/report";
import { TEST_PACK, type TestCase } from "@/lib/audit/testpack";
import { hashReport } from "@/lib/security/hash";
import { sendTestRequest, type TestOutcome } from "@/lib/avalanche/wallet";
import { DEMO_WALLET } from "@/lib/security/reputation";

const ATTACK_OPTIONS: WalletResult[] = ["blocked", "clear_warning", "weak_warning", "no_warning", "not_tested"];
const CONTROL_CASE_OPTIONS: WalletResult[] = ["no_warning", "weak_warning", "clear_warning", "not_tested"];
const CONTROL_CASE_LABEL: Partial<Record<WalletResult, string>> = {
  no_warning: "Passed normally",
  weak_warning: "Minor false alarm",
  clear_warning: "False alarm",
  not_tested: "Not tested yet",
};

// A fictional wallet's answers, for demos — clearly labelled when loaded.
const DEMO = {
  company: "DemoWallet Labs (fictional)",
  wallet: "DemoWallet Mobile 3.2",
  results: {
    "unlimited-approve": "clear_warning",
    "increase-allowance": "no_warning",
    "nft-approve-all": "clear_warning",
    "permit-signature": "weak_warning",
    "permit2-signature": "no_warning",
    "blind-eth-sign": "blocked",
    "address-poisoning": "no_warning",
    "control-transfer": "no_warning",
    "control-login": "weak_warning",
  } as Record<string, WalletResult>,
  answers: {
    "tx-simulation": "partial",
    "typed-data-decoding": "no",
    "eth-sign-blocked": "yes",
    "approval-caps": "yes",
    "approval-manager": "no",
    "phishing-blocklist": "yes",
    "address-poisoning": "no",
    "seed-handling": "yes",
    "hardware-support": "partial",
    "audits-bounty": "partial",
  } as Record<string, ControlAnswer>,
};

const SEV_STYLE: Record<Gap["severity"], string> = {
  critical: "border-danger/60 bg-danger/15 text-danger",
  high: "border-danger/40 text-danger",
  medium: "border-gold/50 text-gold",
  low: "border-line text-muted",
};

export function WalletAudit() {
  const [company, setCompany] = useState("");
  const [wallet, setWallet] = useState("");
  const [results, setResults] = useState<Record<string, WalletResult>>({});
  const [answers, setAnswers] = useState<Record<string, ControlAnswer>>({});
  const [report, setReport] = useState<WalletAuditReport | null>(null);
  const [demoLoaded, setDemoLoaded] = useState(false);

  // /business?demo=1 opens with the fictional demo wallet's report (handy for pitches).
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("demo") !== "1") return;
    loadDemo();
    setReport(buildAuditReport({ company: DEMO.company, wallet: DEMO.wallet, results: DEMO.results, answers: DEMO.answers }));
  }, []);

  function loadDemo() {
    setCompany(DEMO.company);
    setWallet(DEMO.wallet);
    setResults(DEMO.results);
    setAnswers(DEMO.answers);
    setDemoLoaded(true);
    setReport(null);
  }

  return (
    <div className="mt-10 space-y-10">
      <Step n={1} title="Who's being audited">
        <div className="grid gap-3 sm:grid-cols-2">
          <TextField label="Company" value={company} onChange={setCompany} placeholder="e.g. Acme Wallet Inc." />
          <TextField label="Wallet & version" value={wallet} onChange={setWallet} placeholder="e.g. Acme Wallet iOS 4.1" />
        </div>
        <button type="button" onClick={loadDemo} className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-violet hover:text-violet/80">
          <Wand2 size={16} /> Load a fictional demo wallet&apos;s answers
        </button>
        {demoLoaded && <p className="mt-1 text-xs text-gold">Demo answers loaded — DemoWallet is fictional.</p>}
      </Step>

      <Step n={2} title="Drainer test pack">
        <p className="text-sm text-muted">
          Replay each payload through your wallet on the Fuji testnet and record what your UI did. The badge shows how Sentinel&apos;s own
          reference engine handles the same request.
        </p>
        <div className="mt-4 space-y-4">
          {TEST_PACK.map((t) => (
            <TestCard key={t.id} t={t} value={results[t.id] ?? "not_tested"} onChange={(v) => setResults({ ...results, [t.id]: v })} />
          ))}
        </div>
      </Step>

      <Step n={3} title="Security controls">
        <div className="space-y-3">
          {CONTROLS.map((c) => (
            <div key={c.id} className="glow-card flex flex-col gap-3 rounded-2xl p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gold">{c.area}</p>
                <p className="mt-1 text-sm">{c.question}</p>
              </div>
              <Segmented
                options={["yes", "partial", "no", "unknown"] as ControlAnswer[]}
                labels={{ yes: "Yes", partial: "Partly", no: "No", unknown: "Not sure" }}
                value={answers[c.id]}
                onChange={(v) => setAnswers({ ...answers, [c.id]: v })}
              />
            </div>
          ))}
        </div>
      </Step>

      <div>
        <button
          type="button"
          onClick={() => setReport(buildAuditReport({ company, wallet, results, answers }))}
          className="inline-flex items-center gap-2 rounded-xl bg-violet px-6 py-3 font-semibold text-white transition hover:bg-violet/85"
        >
          <FileCheck2 size={18} /> Generate audit report
        </button>
      </div>

      {report && <AuditReportView key={report.generated_at} report={report} />}
    </div>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="flex items-center gap-3 text-xl font-bold">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-violet/20 text-sm text-violet">{n}</span>
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function TextField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <label className="block">
      <span className="text-xs text-muted">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full rounded-xl border border-line bg-ink/70 px-4 py-2.5 text-text outline-none placeholder:text-muted focus:border-blue"
      />
    </label>
  );
}

function Segmented<T extends string>({
  options,
  labels,
  value,
  onChange,
}: {
  options: T[];
  labels: Partial<Record<T, string>>;
  value: T | undefined;
  onChange: (v: T) => void;
}) {
  return (
    <div role="radiogroup" className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          role="radio"
          aria-checked={value === o}
          onClick={() => onChange(o)}
          className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
            value === o ? "border-blue bg-blue/20 text-text" : "border-line text-muted hover:border-blue/50 hover:text-text"
          }`}
        >
          {labels[o] ?? o}
        </button>
      ))}
    </div>
  );
}

function TestCard({ t, value, onChange }: { t: TestCase; value: WalletResult; onChange: (v: WalletResult) => void }) {
  const [copied, setCopied] = useState(false);
  const [sending, setSending] = useState(false);
  const [live, setLive] = useState<{ outcome: TestOutcome; detail: string } | null>(null);

  async function sendToWallet() {
    setSending(true);
    setLive(null);
    try {
      setLive(await sendTestRequest(t.request));
    } catch (e) {
      setLive({ outcome: "error", detail: e instanceof Error && e.message === "NO_WALLET" ? "No wallet found in this browser — open this page in Chrome with Core installed." : String(e) });
    } finally {
      setSending(false);
    }
  }
  const sentinel = detect(t.request, t.recentAddresses);
  const payload = JSON.stringify(toRpc(t), null, 2);
  const isAttack = t.kind === "attack";

  return (
    <div className="glow-card rounded-2xl p-5">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
            isAttack ? "border-danger/50 text-danger" : "border-safe/50 text-safe"
          }`}
        >
          {isAttack ? "Attack" : "Legitimate control"}
        </span>
        <h3 className="font-bold">{t.name}</h3>
        <span
          className={`ml-auto inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs ${
            sentinel.flagged === isAttack ? "border-safe/40 text-safe" : "border-danger/40 text-danger"
          }`}
        >
          {sentinel.flagged ? <ShieldX size={13} /> : <ShieldCheck size={13} />}
          Sentinel: {sentinel.flagged ? "flags it" : "allows it"}
        </span>
      </div>
      <p className="mt-2 font-mono text-xs text-blue">{t.technique}</p>
      <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
        <p>
          <span className="font-semibold text-text">How it drains: </span>
          <span className="text-muted">{t.howItDrains}</span>
        </p>
        <p>
          <span className="font-semibold text-text">A safe wallet should: </span>
          <span className="text-muted">{t.walletShould}</span>
        </p>
      </div>
      <details className="mt-3">
        <summary className="cursor-pointer text-xs font-semibold text-violet">Test payload</summary>
        <div className="relative mt-2">
          <pre className="max-h-64 overflow-auto rounded-xl border border-line bg-ink/70 p-3 font-mono text-[11px] leading-relaxed text-text/85">{payload}</pre>
          <button
            type="button"
            onClick={() =>
              navigator.clipboard.writeText(payload).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              })
            }
            className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-lg border border-line bg-surface px-2 py-1 text-[11px]"
          >
            {copied ? <Check size={12} className="text-safe" /> : <Copy size={12} />} {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </details>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={sendToWallet}
          disabled={sending}
          className="inline-flex items-center gap-2 rounded-lg border border-violet/60 px-3 py-1.5 text-xs font-semibold text-text transition hover:bg-violet/15 disabled:opacity-50"
        >
          {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          {sending ? "Waiting for your wallet…" : "Send to my wallet"}
        </button>
        <span className="text-xs text-gold">{isAttack ? "Look at the warning, then click Reject. Never approve or sign." : "Legitimate request — note whether your wallet raised a false alarm, then Reject."}</span>
      </div>
      {live && (
        <p className={`mt-2 text-xs ${live.outcome === "rejected" ? "text-safe" : live.outcome === "signed" ? "text-danger" : "text-muted"}`}>
          {live.outcome === "rejected" ? "✓ " : live.outcome === "signed" ? "⚠ " : ""}
          {live.detail}
          {live.outcome === "signed" && isAttack && " (Testnet only, fictional addresses — but in real life this is how funds get drained.)"}
        </p>
      )}
      <div className="mt-4">
        <p className="mb-2 text-xs text-muted">What did your wallet show?</p>
        <Segmented
          options={isAttack ? ATTACK_OPTIONS : CONTROL_CASE_OPTIONS}
          labels={isAttack ? RESULT_LABEL : CONTROL_CASE_LABEL}
          value={value}
          onChange={onChange}
        />
      </div>
    </div>
  );
}

/** The test as the JSON-RPC request a dApp would send to the wallet. */
function toRpc(t: TestCase) {
  const r = t.request;
  switch (r.method) {
    case "eth_sendTransaction":
      return { method: r.method, params: [r.tx] };
    case "eth_signTypedData_v4":
      return { method: r.method, params: [DEMO_WALLET, JSON.stringify(r.typedData)] };
    case "eth_sign":
      return { method: r.method, params: [DEMO_WALLET, r.hash] };
    case "personal_sign":
      return { method: r.method, params: [r.message, DEMO_WALLET] };
  }
}

function AuditReportView({ report }: { report: WalletAuditReport }) {
  const [hash, setHash] = useState<string | null>(null);
  const [tx, setTx] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    hashReport(report).then(setHash);
  }, [report]);
  const json = JSON.stringify({ ...report, report_hash: hash, verification_tx: tx }, null, 2);
  const s = report.scores;
  const gradeColor = s.grade === "A" || s.grade === "B" ? "text-safe" : s.grade === "C" ? "text-gold" : "text-danger";

  return (
    <div className="space-y-6">
      <article className="glow-card rounded-3xl p-6 sm:p-8">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted">
          <ClipboardList size={14} /> Drainer Readiness Audit · test pack {report.test_pack_version}
        </p>
        <h2 className="mt-2 text-2xl font-extrabold">
          {report.wallet} <span className="text-muted">· {report.company}</span>
        </h2>

        <div className="mt-6 grid gap-4 sm:grid-cols-4">
          <div className="rounded-2xl border border-line bg-ink/40 p-4 text-center sm:col-span-1">
            <p className="text-xs uppercase tracking-[0.15em] text-muted">Grade</p>
            <p className={`text-6xl font-black ${gradeColor}`}>{s.grade}</p>
            <p className="font-mono text-sm text-muted">{s.overall}/100</p>
          </div>
          <Stat label="Drainer coverage" value={`${s.drainer_coverage_percent}%`} note="weighted by severity · 60% of score" />
          <Stat label="Security controls" value={`${s.controls_percent}%`} note="questionnaire · 40% of score" />
          <Stat label="False alarms" value={String(s.false_alarms)} note="−2 points each" />
        </div>

        <h3 className="mt-8 text-sm font-semibold uppercase tracking-[0.15em] text-muted">Fix these first ({report.gaps.length})</h3>
        {report.gaps.length === 0 ? (
          <p className="mt-3 text-safe">No gaps found in this assessment.</p>
        ) : (
          <ol className="mt-3 space-y-3">
            {report.gaps.map((g, i) => (
              <li key={i} className="rounded-2xl border border-line bg-ink/30 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-md border px-2 py-0.5 font-mono text-[11px] uppercase ${SEV_STYLE[g.severity]}`}>{g.severity}</span>
                  <span className="text-xs text-muted">{g.area}</span>
                </div>
                <p className="mt-2 font-semibold">{g.title}</p>
                <p className="mt-1 text-sm text-muted">
                  <span className="text-text/80">Risk: </span>
                  {g.why}
                </p>
                <p className="mt-1 text-sm">
                  <span className="font-semibold text-safe">Fix: </span>
                  {g.fix}
                </p>
              </li>
            ))}
          </ol>
        )}

        <p className="mt-6 flex gap-2 rounded-xl border border-gold/40 bg-gold/10 p-3 text-sm">
          <FlaskConical size={18} className="shrink-0 text-gold" />
          {report.disclosure}
        </p>
      </article>

      <section className="glow-card rounded-2xl p-5">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-muted">Audit certificate</h2>
        <p className="text-sm text-muted">
          Seal this audit on Avalanche so the wallet company — and its users — can prove which version was assessed, when, and with
          what result.
        </p>
        <p className="mt-3 break-all font-mono text-xs">SHA-256 {hash ?? "computing…"}</p>
        <button
          type="button"
          onClick={() =>
            navigator.clipboard.writeText(json).then(() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            })
          }
          className="mt-3 inline-flex items-center gap-2 rounded-xl border border-line px-4 py-2 text-sm font-semibold hover:border-blue/60"
        >
          {copied ? <Check size={16} className="text-safe" /> : <Copy size={16} />}
          {copied ? "Copied" : "Copy JSON"}
        </button>
        <div className="mt-4">
          <RecordOnAvalanche reportHash={hash} riskLevel={report.risk_level} onRecorded={setTx} />
        </div>
      </section>

      <VerifyReport currentJson={hash ? json : undefined} />
    </div>
  );
}

function Stat({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="rounded-2xl border border-line bg-ink/40 p-4">
      <p className="text-xs uppercase tracking-[0.15em] text-muted">{label}</p>
      <p className="mt-1 text-3xl font-extrabold">{value}</p>
      <p className="mt-1 text-xs text-muted">{note}</p>
    </div>
  );
}
