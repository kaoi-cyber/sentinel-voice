"use client";

import { useState } from "react";
import { CheckCircle2, ClipboardPaste, Loader2, SearchCheck, XCircle, TriangleAlert } from "lucide-react";
import { explorers, type OnchainRecord } from "@/lib/avalanche/chain";
import { lookupRecord } from "@/lib/avalanche/useAvalanche";
import { hashReport } from "@/lib/security/hash";
import { ExplorerLinks } from "./ExplorerLinks";

type Result = {
  computed: string;
  claimed: string | null;
  verificationTx: string | null;
  record: OnchainRecord | null;
  lookupError: string | null;
};

/** Paste any report JSON → recompute its fingerprint → check the Fuji registry. */
export function VerifyReport({ currentJson }: { currentJson?: string }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  async function verify() {
    setError(null);
    setResult(null);
    let report: { schema_version?: string; report_hash?: string | null; verification_tx?: string | null };
    try {
      report = JSON.parse(text);
      if (!report || typeof report !== "object" || !["1.0", "supply-1.0", "wallet-audit-1.0"].includes(report.schema_version ?? "")) throw new Error();
    } catch {
      setError("That doesn't look like a Sentinel report. Paste the full JSON from “Copy JSON”.");
      return;
    }
    setBusy(true);
    const computed = await hashReport(report);
    let record: OnchainRecord | null = null;
    let lookupError: string | null = null;
    try {
      record = await lookupRecord(computed);
    } catch (e) {
      lookupError = e instanceof Error ? e.message : "Lookup failed";
    }
    setResult({ computed, claimed: report.report_hash ?? null, verificationTx: report.verification_tx ?? null, record, lookupError });
    setBusy(false);
  }

  const edited = result?.claimed && result.claimed !== result.computed;

  return (
    <section id="verify" className="glow-card rounded-2xl p-5">
      <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-muted">
        <SearchCheck size={16} className="text-blue" /> Verify a report
      </h2>
      <p className="mt-2 text-sm text-muted">
        Paste a report&apos;s JSON. We recompute its SHA-256 fingerprint and check it against the registry on Avalanche
        Fuji. Change even one character and the fingerprint won&apos;t match.
      </p>
      {currentJson && (
        <button
          type="button"
          onClick={() => {
            setText(currentJson);
            setResult(null);
            setError(null);
          }}
          className="mt-3 inline-flex items-center gap-2 rounded-xl border border-violet/60 px-4 py-2 text-sm font-semibold text-text transition hover:bg-violet/10"
        >
          <ClipboardPaste size={16} /> Paste this report
        </button>
      )}
      <textarea
        rows={12}
        value={text}
        onChange={(e) => setText(e.target.value)}
        spellCheck={false}
        placeholder='{ "schema_version": "1.0", … }'
        aria-label="Report JSON"
        className="mt-3 w-full rounded-xl border border-line bg-ink/70 p-3 font-mono text-xs text-text outline-none focus:border-blue"
      />
      <button
        type="button"
        onClick={verify}
        disabled={!text.trim() || busy}
        className="mt-3 inline-flex items-center gap-2 rounded-xl border border-blue/60 px-4 py-2 text-sm font-semibold text-text transition hover:bg-blue/10 disabled:opacity-40"
      >
        {busy ? <Loader2 size={16} className="animate-spin" /> : <SearchCheck size={16} />}
        Verify on Avalanche
      </button>
      {error && <p className="mt-3 text-sm text-danger">{error}</p>}

      {result && (
        <div className="mt-4 space-y-3 text-sm">
          <p className="break-all">
            <span className="text-muted">Fingerprint of this JSON: </span>
            <code className="font-mono text-xs">{result.computed}</code>
          </p>
          {edited && (
            <p className="flex gap-2 rounded-xl border border-danger/40 bg-danger/10 p-3 text-danger">
              <TriangleAlert size={18} className="shrink-0" />
              The report_hash written inside this JSON doesn&apos;t match its contents — the report was changed after it was
              fingerprinted.
            </p>
          )}
          {result.lookupError ? (
            <p className="text-danger">{result.lookupError}</p>
          ) : result.record?.recorded ? (
            <div className="rounded-xl border border-safe/40 bg-safe/10 p-3">
              <p className="flex items-center gap-2 font-semibold text-safe">
                <CheckCircle2 size={18} /> Match — recorded on Avalanche Fuji
              </p>
              <p className="mt-1 text-text/90">
                Recorded {new Date(result.record.timestamp * 1000).toLocaleString()} with risk level{" "}
                <span className="font-mono">{result.record.riskLevel}</span>. This report hasn&apos;t been changed since.
              </p>
              {result.verificationTx && <ExplorerLinks label="Transaction:" links={explorers.tx(result.verificationTx)} />}
            </div>
          ) : (
            <p className="flex gap-2 rounded-xl border border-danger/40 bg-danger/10 p-3 text-danger">
              <XCircle size={18} className="shrink-0" />
              No record of this fingerprint on Avalanche Fuji — the report was never recorded, or it has been modified.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
