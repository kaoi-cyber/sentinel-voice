"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, Rocket, Wallet } from "lucide-react";
import { explorers } from "@/lib/avalanche/chain";
import { useAvalancheConfig } from "@/lib/avalanche/useAvalanche";
import { deployRegistry, detectedWallets, friendlyWalletError, type Stage } from "@/lib/avalanche/wallet";
import { ExplorerLinks } from "./ExplorerLinks";

const STAGE_LABEL: Record<Stage, string> = {
  connecting: "Connecting to your wallet…",
  confirm: "Confirm the deployment in your wallet…",
  pending: "Waiting for Avalanche Fuji…",
};

export function DeployRegistry() {
  const { config, refresh } = useAvalancheConfig();
  const [stage, setStage] = useState<Stage | "saving" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [unsaved, setUnsaved] = useState<{ address: string; txHash: string } | null>(null);
  const [wallets, setWallets] = useState<string[] | null>(null);

  useEffect(() => {
    detectedWallets().then(setWallets);
  }, []);

  async function deploy() {
    setError(null);
    try {
      const { address, txHash } = await deployRegistry(setStage);
      if (!config?.canSaveDeployment) {
        setUnsaved({ address, txHash });
        return;
      }
      setStage("saving");
      const res = await fetch("/api/avalanche/deployment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, txHash }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? `HTTP ${res.status}`);
      await refresh();
    } catch (e) {
      setError(friendlyWalletError(e));
    } finally {
      setStage(null);
    }
  }

  if (config === undefined) return <p className="text-muted">Checking Avalanche…</p>;

  const busy = stage !== null;
  return (
    <div className="space-y-6">
      {config?.registry && (
        <div className="rounded-2xl border border-safe/40 bg-safe/10 p-5">
          <p className="flex items-center gap-2 font-semibold text-safe">
            <CheckCircle2 size={18} /> Registry deployed on Avalanche Fuji
          </p>
          <p className="mt-2 break-all font-mono text-sm">{config.registry}</p>
          <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1">
            <ExplorerLinks label="Contract:" links={explorers.address(config.registry)} />
            {config.deployTx && <ExplorerLinks label="Deployment:" links={explorers.tx(config.deployTx)} />}
          </div>
          <p className="mt-3 text-sm text-text/90">
            You&apos;re all set — go to the expert dashboard and press “Record on Avalanche Fuji”.
          </p>
        </div>
      )}

      <WalletDetected wallets={wallets} />

      <ol className="space-y-3 text-sm text-text/90">
        <li>
          <span className="font-semibold text-gold">1.</span> Install the <span className="font-semibold">Core</span> wallet
          (core.app) and turn on <span className="font-semibold">testnet mode</span> in its settings.
        </li>
        <li>
          <span className="font-semibold text-gold">2.</span> Get free test AVAX from the{" "}
          <a
            href="https://build.avax.network/console/primary-network/faucet"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-blue underline"
          >
            Builder Hub faucet
          </a>
          .
        </li>
        <li>
          <span className="font-semibold text-gold">3.</span> Press deploy and confirm in your wallet. It costs a tiny amount of
          test AVAX and only needs doing once.
        </li>
      </ol>

      <button
        type="button"
        onClick={deploy}
        disabled={busy}
        className={`inline-flex items-center gap-2 rounded-xl px-5 py-3 font-semibold transition disabled:opacity-50 ${
          config?.registry ? "border border-line text-muted hover:text-text" : "bg-violet text-white hover:bg-violet/85"
        }`}
      >
        {busy ? <Loader2 size={18} className="animate-spin" /> : <Rocket size={18} />}
        {stage === "saving"
          ? "Saving to the project…"
          : stage
            ? STAGE_LABEL[stage]
            : config?.registry
              ? "Deploy a new registry (replaces the saved one)"
              : "Deploy the registry with my wallet"}
      </button>
      {error && <p className="text-sm text-danger">{error}</p>}

      {unsaved && (
        <div className="rounded-2xl border border-gold/40 bg-gold/10 p-4 text-sm">
          <p className="font-semibold text-gold">Deployed — one more step</p>
          <p className="mt-1">
            This server can&apos;t save files, so set <code className="font-mono">REPORT_REGISTRY_ADDRESS</code> to:
          </p>
          <p className="mt-1 break-all font-mono">{unsaved.address}</p>
          <ExplorerLinks label="Deployment:" links={explorers.tx(unsaved.txHash)} />
        </div>
      )}
    </div>
  );
}

function WalletDetected({ wallets }: { wallets: string[] | null }) {
  if (wallets === null) return <p className="text-sm text-muted">Looking for a wallet in this browser…</p>;
  if (wallets.length === 0) {
    return (
      <div className="flex gap-3 rounded-xl border border-danger/40 bg-danger/10 p-3 text-sm">
        <Wallet size={18} className="shrink-0 text-danger" />
        <p>
          <span className="font-semibold text-danger">No wallet detected in this browser.</span> Open{" "}
          <span className="font-mono">{typeof window !== "undefined" ? window.location.href : "this page"}</span> in the
          browser where Core is installed (Chrome, Edge or Brave), and refresh.
        </p>
      </div>
    );
  }
  return (
    <p className="flex items-center gap-2 text-sm text-safe">
      <Wallet size={16} /> Wallet detected: {wallets.join(", ")}
    </p>
  );
}
