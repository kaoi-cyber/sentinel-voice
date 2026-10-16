// Supply-risk calls from the browser. The full app asks its server (which holds the
// Tokenomist key); the static GitHub Pages edition runs the same rules on the sample tokens.
import { canonicalJson } from "@/lib/security/hash";
import { STATIC_DEMO } from "@/lib/staticDemo";
import { SAMPLES, sampleSnapshot } from "@/lib/tokenomist/samples";
import { analyzeSupply } from "./engine";
import type { SupplyReport } from "./types";

export type SupplyStatus = { live: boolean; reason: string | null; samples: string[]; suggestions: string[] };

export async function supplyStatus(): Promise<SupplyStatus> {
  if (STATIC_DEMO) {
    return { live: false, reason: "this is the static demo site; live data runs in the full app", samples: Object.keys(SAMPLES), suggestions: [] };
  }
  return fetch("/api/supply/status").then((r) => r.json());
}

export async function supplyReport(id: string): Promise<SupplyReport> {
  if (STATIC_DEMO) {
    const snap = sampleSnapshot(id.trim().toLowerCase(), "Fictional sample token for the demo", new Date());
    if (!snap) throw new Error("The demo site only has the sample tokens — real tokens need the full app with a Tokenomist key.");
    const bytes = new TextEncoder().encode(canonicalJson({ token: snap.token, allocations: snap.allocations, unlockEvents: snap.unlockEvents }));
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    const dataHash = "0x" + Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
    return analyzeSupply(snap, { dataHash });
  }
  const res = await fetch(`/api/supply?token=${encodeURIComponent(id.trim())}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error ?? `HTTP ${res.status}`);
  return data.report;
}
