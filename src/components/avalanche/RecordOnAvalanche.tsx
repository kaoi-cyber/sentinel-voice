"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Link2, Loader2, TriangleAlert } from "lucide-react";
import { explorers, type OnchainRecord } from "@/lib/avalanche/chain";
import { lookupRecord, recallTx, rememberTx, useAvalancheConfig } from "@/lib/avalanche/useAvalanche";
import { friendlyWalletError, recordReport, type Stage } from "@/lib/avalanche/wallet";
import { shortAddress } from "@/lib/security/abi";
import type { RiskLevel } from "@/lib/security/types";
import { ExplorerLinks } from "./ExplorerLinks";

const STAGE_LABEL: Record<Stage, string> = {
  connecting: "Connecting to your wallet…",
  confirm: "Confirm in your wallet…",
  pending: "Waiting for Avalanche Fuji…",
};

type Props = {
  reportHash: string | null;
  riskLevel: RiskLevel;
  onRecorded: (txHash: string) => void;
};

export function RecordOnAvalanche({ reportHash, riskLevel, onRecorded }: Props) {
  const { config } = useAvalancheConfig();
  const registry = config?.registry ?? null;
  const [record, setRecord] = useState<OnchainRecord | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Already on-chain? (e.g. revisiting a report recorded earlier)
  useEffect(() => {
    if (!reportHash || !registry) return;
    let live = true;
    lookupRecord(reportHash)
      .then((r) => {
        if (!live || !r.recorded) return;
        setRecord(r);
        const tx = recallTx(reportHash);
        if (tx) {
          setTxHash(tx);
          onRecorded(tx);
        }
      })
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [reportHash, registry, onRecorded]);

  async function publish() {
    if (!reportHash || !registry) return;
    setError(null);
    try {
      const { txHash: tx } = await recordReport(registry, reportHash as `0x${string}`, riskLevel, setStage);
      rememberTx(reportHash, tx);
      setTxHash(tx);
      onRecorded(tx);
      // Read it back from the chain, independently of the wallet.
      setRecord(await lookupRecord(reportHash));
    } catch (e) {
      setError(friendlyWalletError(e));
    } finally {
      setStage(null);
    }
  }

  if (config === undefined) return <p className="text-sm text-muted">Checking Avalanche…</p>;

  if (!registry) {
    return (
      <div className="flex gap-3 rounded-xl border border-gold/40 bg-gold/10 p-3 text-sm">
        <TriangleAlert size={18} className="shrink-0 text-gold" />
        <p>
          The report registry isn&apos;t deployed on Avalanche Fuji yet.{" "}
          <Link href="/deploy" className="font-semibold text-gold underline">
            Deploy it once
          </Link>{" "}
          with your wallet to enable recording.
        </p>
      </div>
    );
  }

  if (record?.recorded) {
    return (
      <div className="rounded-xl border border-safe/40 bg-safe/10 p-4 text-sm">
        <p className="flex items-center gap-2 font-semibold text-safe">
          <CheckCircle2 size={18} /> Recorded on Avalanche Fuji
        </p>
        <p className="mt-1 text-text/90">
          The registry holds this exact fingerprint — recorded {new Date(record.timestamp * 1000).toLocaleString()} by{" "}
          <span className="font-mono">{shortAddress(record.submitter)}</span> with risk level{" "}
          <span className="font-mono">{record.riskLevel}</span>.
        </p>
        <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1">
          {txHash && <ExplorerLinks label="Transaction:" links={explorers.tx(txHash)} />}
          <ExplorerLinks label="Registry:" links={explorers.address(registry)} />
        </div>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={publish}
        disabled={!reportHash || stage !== null}
        className="inline-flex items-center gap-2 rounded-xl bg-blue px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue/85 disabled:opacity-50"
      >
        {stage ? <Loader2 size={16} className="animate-spin" /> : <Link2 size={16} />}
        {stage ? STAGE_LABEL[stage] : "Record on Avalanche Fuji"}
      </button>
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
      <p className="mt-2 text-xs text-muted">
        Stores only the fingerprint and risk level on the Fuji testnet — no transaction details. Uses free test AVAX.
      </p>
    </div>
  );
}
