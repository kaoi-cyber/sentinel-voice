"use client";

import { useCallback, useEffect, useState } from "react";
import { createPublicClient, http } from "viem";
import { STATIC_DEMO } from "@/lib/staticDemo";
import deployment from "../../../deployments/fuji.json";
import { FUJI_CHAIN, isBytes32, REGISTRY_ABI, type AvalancheConfig, type OnchainRecord } from "./chain";

let configRequest: Promise<AvalancheConfig | null> | null = null;

export function fetchAvalancheConfig(fresh = false): Promise<AvalancheConfig | null> {
  if (STATIC_DEMO) {
    return Promise.resolve({ chainId: FUJI_CHAIN.id, registry: deployment.address as `0x${string}`, deployTx: deployment.txHash, canSaveDeployment: false });
  }
  if (fresh || !configRequest) {
    configRequest = fetch("/api/avalanche/config", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null);
  }
  return configRequest;
}

export function useAvalancheConfig() {
  const [config, setConfig] = useState<AvalancheConfig | null | undefined>(undefined);
  const refresh = useCallback(async (fresh = true) => setConfig(await fetchAvalancheConfig(fresh)), []);
  useEffect(() => {
    let live = true;
    fetchAvalancheConfig().then((c) => live && setConfig(c));
    return () => {
      live = false;
    };
  }, []);
  return { config, refresh };
}

export async function lookupRecord(hash: string): Promise<OnchainRecord> {
  if (STATIC_DEMO) {
    // No server here: read the registry straight from Fuji's public RPC.
    if (!isBytes32(hash)) throw new Error("hash must be 0x + 64 hex characters");
    const client = createPublicClient({ chain: FUJI_CHAIN, transport: http() });
    const [recorded, submitter, timestamp, riskLevel] = (await client.readContract({
      address: deployment.address as `0x${string}`,
      abi: REGISTRY_ABI,
      functionName: "verify",
      args: [hash],
    })) as [boolean, string, bigint, string];
    return { recorded, submitter, timestamp: Number(timestamp), riskLevel };
  }
  const res = await fetch(`/api/avalanche/verify?hash=${hash}`, { cache: "no-store" });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error ?? `HTTP ${res.status}`);
  return data as OnchainRecord;
}

// Remembers which transaction recorded which report, in this browser only.
const TX_KEY = (hash: string) => `sentinel-voice:tx:${hash}`;
export function rememberTx(hash: string, tx: string) {
  try {
    localStorage.setItem(TX_KEY(hash), tx);
  } catch {
    // Storage unavailable (private mode) — the on-chain record is what matters.
  }
}
export function recallTx(hash: string): string | null {
  try {
    return localStorage.getItem(TX_KEY(hash));
  } catch {
    return null;
  }
}
