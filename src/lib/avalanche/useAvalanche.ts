"use client";

import { useCallback, useEffect, useState } from "react";
import type { AvalancheConfig, OnchainRecord } from "./chain";

let configRequest: Promise<AvalancheConfig | null> | null = null;

export function fetchAvalancheConfig(fresh = false): Promise<AvalancheConfig | null> {
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
