"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Check, Copy, Fingerprint } from "lucide-react";
import { analyze } from "@/lib/security/engine";
import { getScenario, SCENARIOS } from "@/lib/security/scenarios";
import { sortFindings } from "@/lib/security/explain";
import { hashReport } from "@/lib/security/hash";
import { encodeCall, MAX_UINT256 } from "@/lib/security/abi";
import { FUJI, KNOWN } from "@/lib/security/reputation";
import type { SecurityReport, TxInput } from "@/lib/security/types";
import { ListenButton } from "@/components/voice/ListenButton";
import { RecordOnAvalanche } from "@/components/avalanche/RecordOnAvalanche";
import { VerifyReport } from "@/components/avalanche/VerifyReport";
import { expertSummary } from "@/lib/voice/scripts";
import { ScenarioPicker } from "./ScenarioPicker";
import { RiskBadge, SeverityPill } from "./RiskBadge";

const CUSTOM = { id: "custom", title: "Paste your own", story: "Analyze any ERC-20 transfer or approve calldata." };

export function ExpertWorkspace() {
  const params = useSearchParams();
  const [selected, setSelected] = useState(getScenario(params.get("scenario"))?.id ?? SCENARIOS[1].id);
  const [custom, setCustom] = useState<TxInput>({
    chain_id: FUJI.chain_id,
    from: null,
    to: KNOWN.usdc,
    value: "0",
    data: encodeCall("approve", KNOWN.unknownSpender, MAX_UINT256),
  });
  const [customReport, setCustomReport] = useState<SecurityReport | null>(null);

  // Reports carry a timestamp, so build them only in the browser (server HTML would differ).
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const report = useMemo(() => {
    if (!mounted) return null;
    if (selected === CUSTOM.id) return customReport;
    const s = getScenario(selected);
    return s ? analyze(s.tx, { scenarioId: s.id, sample: true }) : null;
  }, [selected, customReport, mounted]);

  return (
    <div className="mt-8 space-y-6">
      <ScenarioPicker selected={selected} onSelect={setSelected} extra={CUSTOM} />

      {selected === CUSTOM.id && (
        <form
          className="glow-card space-y-4 rounded-2xl p-5"
          onSubmit={(e) => {
            e.preventDefault();
            setCustomReport(analyze(custom));
          }}
        >
          <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
            <Field label="to (token contract)" value={custom.to} onChange={(to) => setCustom({ ...custom, to })} />
            <Field label="value (wei)" value={custom.value} onChange={(value) => setCustom({ ...custom, value })} />
          </div>
          <Field label="data (calldata hex)" value={custom.data} onChange={(data) => setCustom({ ...custom, data })} multiline />
          <p className="text-xs text-muted">Chain: {FUJI.name}. Supported calls: transfer(address,uint256), approve(address,uint256).</p>
          <button type="submit" className="rounded-xl bg-violet px-5 py-2.5 font-semibold text-white hover:bg-violet/85">
            Analyze
          </button>
        </form>
      )}

      {report ? <ExpertReport key={report.generated_at} report={report} /> : <VerifyReport />}
    </div>
  );
}

function ExpertReport({ report }: { report: SecurityReport }) {
  const [hash, setHash] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [verificationTx, setVerificationTx] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    setHash(null);
    hashReport(report).then((h) => live && setHash(h));
    return () => {
      live = false;
    };
  }, [report]);

  const json = JSON.stringify({ ...report, report_hash: hash, verification_tx: verificationTx }, null, 2);
  const d = report.decoded;

  return (
    <div className="space-y-6">
      <div className="glow-card flex flex-wrap items-center justify-between gap-4 rounded-2xl p-5">
        <div className="flex flex-wrap items-center gap-3">
          <RiskBadge level={report.risk_level} size="lg" />
          <span className="font-mono text-sm text-muted">
            {report.findings.length} findings · {report.findings.filter((f) => f.severity === "high").length} high
          </span>
          {report.sample_data && <span className="rounded-full border border-line px-3 py-1 text-xs text-muted">Sample data</span>}
          <ListenButton id={`expert-${report.scenario_id ?? "custom"}`} text={expertSummary(report)} label="Spoken summary" />
        </div>
        <span className="font-mono text-xs text-muted">{report.chain.name} · chainId {report.chain.chain_id}</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Transaction">
          <KV k="from" v={report.transaction.from ?? "—"} />
          <KV k="to" v={report.transaction.to} />
          <KV k="value" v={`${report.transaction.value} wei`} />
          <KV k="data" v={report.transaction.data || "0x"} />
        </Panel>
        <Panel title="Decoded call">
          {d.kind === "unknown" ? (
            <KV k="selector" v={d.selector ?? "—"} />
          ) : (
            <>
              <KV k="function" v={d.function} />
              <KV k="selector" v={d.selector} />
              <KV k="token" v={report.token ? `${report.token.symbol} · ${report.token.decimals} decimals` : "unrecognised"} />
              <KV k={report.counterparty?.role ?? "counterparty"} v={report.counterparty?.address ?? "—"} />
              <KV k="label" v={report.counterparty?.label ?? "none (not in reputation list)"} />
              {d.kind === "approval_for_all" ? <KV k="approved" v={String(d.approved)} /> : <KV k="amount_raw" v={d.amount_raw} />}
              {d.kind === "approve" && <KV k="unlimited" v={String(d.unlimited)} />}
            </>
          )}
        </Panel>
      </div>

      <Panel title="Findings">
        <div className="-mx-1 overflow-x-auto">
          <table className="w-full min-w-[36rem] text-left text-sm">
            <thead className="text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="px-1 py-2 font-medium">Rule</th>
                <th className="px-1 py-2 font-medium">Severity</th>
                <th className="px-1 py-2 font-medium">Evidence</th>
              </tr>
            </thead>
            <tbody>
              {sortFindings(report.findings).map((f) => (
                <tr key={f.rule_id} className="border-t border-line/60 align-top">
                  <td className="px-1 py-3 font-mono text-xs text-blue">{f.rule_id}</td>
                  <td className="px-1 py-3">
                    <SeverityPill severity={f.severity} />
                    {f.unverified && <span className="ml-1 font-mono text-[11px] text-gold">unverified</span>}
                  </td>
                  <td className="px-1 py-3">
                    <p className="font-semibold">{f.title}</p>
                    <p className="mt-0.5 break-all text-muted">{f.evidence}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 rounded-xl border border-gold/40 bg-gold/10 p-3 text-sm">
          <span className="font-semibold text-gold">Recommended action: </span>
          {report.recommended_action}
        </p>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Checks performed">
          <List items={report.checks_performed} />
        </Panel>
        <Panel title="Not checked">
          <List items={report.not_checked} />
        </Panel>
      </div>

      <Panel title="Report">
        <div className="flex flex-wrap items-center gap-3">
          <Fingerprint size={18} className="text-violet" />
          <span className="text-sm text-muted">SHA-256</span>
          <code className="break-all font-mono text-xs text-text">{hash ?? "computing…"}</code>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(json).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              });
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-line px-4 py-2 text-sm font-semibold hover:border-blue/60"
          >
            {copied ? <Check size={16} className="text-safe" /> : <Copy size={16} />}
            {copied ? "Copied" : "Copy JSON"}
          </button>
        </div>
        <div className="mt-4">
          <RecordOnAvalanche reportHash={hash} riskLevel={report.risk_level} onRecorded={setVerificationTx} />
        </div>
        <pre className="mt-4 max-h-96 overflow-auto rounded-xl border border-line bg-ink/70 p-4 font-mono text-xs leading-relaxed text-text/85">
          {json}
        </pre>
      </Panel>

      <VerifyReport currentJson={hash ? json : undefined} />
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="glow-card rounded-2xl p-5">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-muted">{title}</h2>
      {children}
    </section>
  );
}

function KV({ k, v }: { k: string; v: string }) {
  return (
    <div className="grid grid-cols-[7rem_1fr] gap-3 border-t border-line/50 py-2 first:border-t-0 text-sm">
      <span className="font-mono text-xs text-muted">{k}</span>
      <span className="break-all font-mono text-xs">{v}</span>
    </div>
  );
}

function List({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1.5 text-sm text-muted">
      {items.map((i) => (
        <li key={i}>• {i}</li>
      ))}
    </ul>
  );
}

function Field({
  label,
  value,
  onChange,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
}) {
  const cls = "mt-1 w-full rounded-xl border border-line bg-ink/70 px-3 py-2 font-mono text-xs text-text outline-none focus:border-blue";
  return (
    <label className="block">
      <span className="font-mono text-xs text-muted">{label}</span>
      {multiline ? (
        <textarea rows={3} className={cls} value={value} onChange={(e) => onChange(e.target.value)} spellCheck={false} />
      ) : (
        <input className={cls} value={value} onChange={(e) => onChange(e.target.value)} spellCheck={false} />
      )}
    </label>
  );
}
