"use client";

import { useEffect, useMemo, useState } from "react";
import { Bot, Check, CheckCircle2, CircleHelp, Copy, RotateCcw, ShieldX, UserCheck, X } from "lucide-react";
import { RecordOnAvalanche } from "@/components/avalanche/RecordOnAvalanche";
import { VerifyReport } from "@/components/avalanche/VerifyReport";
import { decide, DEFAULT_POLICY, type Decision, type Policy, type Verdict } from "@/lib/guard/engine";
import { AGENT_QUEUE, CONTACTS } from "@/lib/guard/scenarios";
import { shortAddress } from "@/lib/security/abi";
import { hashReport } from "@/lib/security/hash";
import type { RiskLevel } from "@/lib/security/types";

type UserChoice = "approved" | "rejected";

const VERDICT_STYLE: Record<Verdict, { label: string; cls: string; icon: typeof CheckCircle2 }> = {
  allow: { label: "Allowed", cls: "border-safe/50 bg-safe/10 text-safe", icon: CheckCircle2 },
  ask: { label: "Ask me", cls: "border-gold/50 bg-gold/10 text-gold", icon: CircleHelp },
  block: { label: "Blocked", cls: "border-danger/50 bg-danger/10 text-danger", icon: ShieldX },
};

const usd = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 })}`;

export function PaymentGuard() {
  const [policy, setPolicy] = useState<Policy>(DEFAULT_POLICY);
  const [choices, setChoices] = useState<Record<string, UserChoice>>({});

  // Decisions run in order; money the user approves counts toward the daily cap for later payments.
  const rows = useMemo(() => {
    let spent = 0;
    return AGENT_QUEUE.map((intent) => {
      const d = decide(intent, policy, CONTACTS, spent);
      const choice = d.verdict === "ask" ? choices[intent.id] : undefined;
      const paid = d.verdict === "allow" || choice === "approved";
      if (paid && d.amountUsd) spent += d.amountUsd;
      return { intent, d, choice, paid, spentAfter: spent };
    });
  }, [policy, choices]);

  const spent = rows.at(-1)?.spentAfter ?? 0;
  const counts = rows.reduce((c, r) => ({ ...c, [r.d.verdict]: (c[r.d.verdict] ?? 0) + 1 }), {} as Record<Verdict, number>);

  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-[18rem_1fr]">
      <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <div className="glow-card rounded-2xl p-5">
          <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-muted">Your guardrails</h2>
          <NumberField label="Max per payment" value={policy.perPaymentLimitUsd} onChange={(v) => setPolicy({ ...policy, perPaymentLimitUsd: v })} />
          <NumberField label="Daily spending cap" value={policy.dailyCapUsd} onChange={(v) => setPolicy({ ...policy, dailyCapUsd: v })} />
          <NumberField label="Ask me above" value={policy.askAboveUsd} onChange={(v) => setPolicy({ ...policy, askAboveUsd: v })} />
          <Toggle label="New recipients need my OK" value={policy.newRecipientsNeedApproval} onChange={(v) => setPolicy({ ...policy, newRecipientsNeedApproval: v })} />
          <Toggle label="Never let the agent grant permissions" value={policy.blockPermissions} onChange={(v) => setPolicy({ ...policy, blockPermissions: v })} />
          <button
            type="button"
            onClick={() => {
              setPolicy(DEFAULT_POLICY);
              setChoices({});
            }}
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-violet"
          >
            <RotateCcw size={13} /> Reset demo
          </button>
        </div>
        <div className="glow-card rounded-2xl p-5">
          <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-muted">Trusted contacts</h2>
          <ul className="mt-2 space-y-1.5 text-sm">
            {CONTACTS.map((c) => (
              <li key={c.address} className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5">
                  <UserCheck size={14} className="text-safe" />
                  {c.label}
                </span>
                <span className="font-mono text-[11px] text-muted">{shortAddress(c.address)}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="glow-card rounded-2xl p-5 text-sm">
          <p className="text-muted">Spent today</p>
          <p className="text-2xl font-extrabold">
            {usd(spent)} <span className="text-sm font-normal text-muted">/ {usd(policy.dailyCapUsd)}</span>
          </p>
          <div className="mt-2 h-2 overflow-hidden rounded bg-line/60">
            <div className="h-full rounded bg-blue" style={{ width: `${Math.min(100, (spent / policy.dailyCapUsd) * 100)}%` }} />
          </div>
          <p className="mt-3 text-xs text-muted">
            {counts.allow ?? 0} allowed · {counts.ask ?? 0} asked · {counts.block ?? 0} blocked
          </p>
        </div>
      </aside>

      <div className="space-y-3">
        {rows.map(({ intent, d, choice }) => (
          <IntentCard
            key={intent.id}
            note={intent.agentNote}
            d={d}
            choice={choice}
            onChoose={(c) => setChoices({ ...choices, [intent.id]: c })}
          />
        ))}
        <GuardLog policy={policy} rows={rows.map((r) => ({ id: r.intent.id, note: r.intent.agentNote, d: r.d, choice: r.choice ?? null }))} />
      </div>
    </div>
  );
}

function IntentCard({ note, d, choice, onChoose }: { note: string; d: Decision; choice?: UserChoice; onChoose: (c: UserChoice) => void }) {
  const v = VERDICT_STYLE[d.verdict];
  const Icon = v.icon;
  return (
    <article className="glow-card rounded-2xl p-4 sm:p-5">
      <div className="flex flex-wrap items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet/15 text-violet">
          <Bot size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted">Agent says</p>
          <p className="font-semibold">&ldquo;{note}&rdquo;</p>
          <p className="mt-0.5 text-sm text-muted">
            {d.amountUsd !== null ? `${usd(d.amountUsd)} USDC → ` : ""}
            {d.recipientLabel ?? (d.recipient ? shortAddress(d.recipient) : "signature / permission request")}
          </p>
        </div>
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-semibold ${v.cls}`}>
          <Icon size={15} /> {v.label}
        </span>
      </div>
      <ul className="mt-3 space-y-1 border-t border-line/50 pt-3 text-sm">
        {d.reasons.map((r) => (
          <li key={r.rule} className="flex gap-2">
            <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${r.verdict === "block" ? "bg-danger" : r.verdict === "ask" ? "bg-gold" : "bg-safe"}`} />
            <span className="text-text/90">
              {r.text} <span className="font-mono text-[11px] text-muted">{r.rule}</span>
            </span>
          </li>
        ))}
      </ul>
      {d.verdict === "ask" && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {choice ? (
            <span className={`text-sm font-semibold ${choice === "approved" ? "text-safe" : "text-muted"}`}>
              {choice === "approved" ? "You approved this payment." : "You rejected this payment."}
            </span>
          ) : (
            <>
              <button type="button" onClick={() => onChoose("approved")} className="inline-flex items-center gap-1.5 rounded-lg bg-safe/20 px-3 py-1.5 text-sm font-semibold text-safe hover:bg-safe/30">
                <Check size={15} /> Approve
              </button>
              <button type="button" onClick={() => onChoose("rejected")} className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-sm font-semibold text-muted hover:text-text">
                <X size={15} /> Reject
              </button>
            </>
          )}
        </div>
      )}
    </article>
  );
}

function GuardLog({ policy, rows }: { policy: Policy; rows: { id: string; note: string; d: Decision; choice: UserChoice | null }[] }) {
  const log = useMemo(
    () => ({
      schema_version: "payment-guard-1.0",
      generated_at: new Date().toISOString(),
      agent: "Simulated payment agent (designed for U-topia U-Bot agentic payments)",
      policy,
      decisions: rows.map((r) => ({
        intent: r.id,
        agent_note: r.note,
        verdict: r.d.verdict,
        user_choice: r.choice,
        amount_usd: r.d.amountUsd,
        recipient: r.d.recipient,
        rules: r.d.reasons.map((x) => x.rule),
      })),
      risk_level: (rows.some((r) => r.d.verdict === "block") ? "high" : "low") as RiskLevel,
      report_hash: null as string | null,
      verification_tx: null as string | null,
    }),
    [policy, rows],
  );
  const [hash, setHash] = useState<string | null>(null);
  const [tx, setTx] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    let live = true;
    setHash(null);
    hashReport(log).then((h) => live && setHash(h));
    return () => {
      live = false;
    };
  }, [log]);
  const json = JSON.stringify({ ...log, report_hash: hash, verification_tx: tx }, null, 2);

  return (
    <>
      <section className="glow-card mt-6 rounded-2xl p-5">
        <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-muted">Agent activity log</h2>
        <p className="mt-2 text-sm text-muted">
          Seal today&apos;s decisions on Avalanche — a tamper-proof record of what your agent tried, and what Sentinel let through.
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
          {copied ? <Check size={16} className="text-safe" /> : <Copy size={16} />} {copied ? "Copied" : "Copy JSON"}
        </button>
        <div className="mt-4">
          <RecordOnAvalanche key={hash ?? "pending"} reportHash={hash} riskLevel={log.risk_level} onRecorded={setTx} />
        </div>
      </section>
      <VerifyReport currentJson={hash ? json : undefined} />
    </>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="mt-3 flex items-center justify-between gap-3 text-sm">
      <span className="text-text/90">{label}</span>
      <span className="flex items-center rounded-lg border border-line bg-ink/70 px-2">
        <span className="text-muted">$</span>
        <input
          type="number"
          min={0}
          value={value}
          onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
          className="w-20 bg-transparent py-1.5 pl-1 text-right font-mono text-text outline-none"
        />
      </span>
    </label>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="mt-3 flex cursor-pointer items-center justify-between gap-3 text-sm">
      <span className="text-text/90">{label}</span>
      <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-[#4f7cff]" />
    </label>
  );
}
