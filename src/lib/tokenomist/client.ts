// Server-side Tokenomist access. Keeps the API key on the server, caches responses on disk
// (saves credits; still works offline), and falls back to labelled sample tokens when live
// access isn't available — it never mixes sample and live data in one snapshot.
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { SAMPLES } from "./samples";
import type { AllocationsData, Envelope, TokenListItem, TokenomistSnapshot, UnlockEvent } from "./types";

const API = "https://api.tokenomist.ai";
const CACHE_DIR = process.env.VERCEL ? "/tmp/tokenomist-cache" : path.join(process.cwd(), ".tokenomist-cache");
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

export const SAMPLE_IDS = Object.keys(SAMPLES);
// Slugs used in Tokenomist's own documentation examples.
export const LIVE_SUGGESTIONS = ["arbitrum", "optimism", "layerzero"];

class TokenomistError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

function apiKey(): string | null {
  return process.env.TOKENOMIST_API_KEY?.trim() || null;
}

async function get<T>(endpoint: string): Promise<{ body: Envelope<T>; cached: boolean }> {
  const file = path.join(CACHE_DIR, createHash("sha256").update(endpoint).digest("hex") + ".json");
  try {
    const cached = JSON.parse(await readFile(file, "utf8")) as { savedAt: number; body: Envelope<T> };
    if (Date.now() - cached.savedAt < CACHE_TTL_MS) return { body: cached.body, cached: true };
  } catch {
    // No cache yet.
  }

  const key = apiKey();
  if (!key) throw new TokenomistError(401, "Tokenomist API key is not set");
  const res = await fetch(API + endpoint, { headers: { "x-api-key": key }, cache: "no-store" });
  const body = await res.json().catch(() => null);
  if (!res.ok || !body?.status) {
    throw new TokenomistError(res.status, body?.errorMessage ?? `Tokenomist returned HTTP ${res.status}`);
  }
  await mkdir(CACHE_DIR, { recursive: true })
    .then(() => writeFile(file, JSON.stringify({ savedAt: Date.now(), body })))
    .catch(() => undefined);
  return { body, cached: false };
}

let accessCheck: { at: number; live: boolean; reason: string | null } | null = null;

/** Is live Tokenomist data available? Re-checked at most every 10 minutes. */
export async function liveAccess(): Promise<{ live: boolean; reason: string | null }> {
  if (accessCheck && Date.now() - accessCheck.at < 10 * 60 * 1000) return accessCheck;
  let result: { live: boolean; reason: string | null };
  if (!apiKey()) {
    result = { live: false, reason: "No Tokenomist API key set" };
  } else {
    try {
      await get<TokenListItem[]>(`/v5/token/list?tokenId=${LIVE_SUGGESTIONS[0]}`);
      result = { live: true, reason: null };
    } catch (e) {
      const err = e as TokenomistError;
      result = {
        live: false,
        reason: err.status === 403 ? "Tokenomist API access is not enabled for this key yet (403)" : err.message,
      };
    }
  }
  accessCheck = { at: Date.now(), ...result };
  return result;
}

function sampleSnapshot(tokenId: string, reason: string, now: Date): TokenomistSnapshot | null {
  const s = SAMPLES[tokenId];
  if (!s) return null;
  return {
    tokenId,
    mode: "sample",
    sampleReason: reason,
    queryDate: now.toISOString(),
    token: s.token,
    allocations: s.allocations,
    unlockEvents: s.unlockEvents(now),
    endpoints: ["sample data (fictional token)"],
  };
}

/**
 * Fetches everything Sentinel needs for one token.
 * Sample ids always return sample data; real slugs need live access.
 */
export async function fetchSnapshot(rawId: string, now = new Date()): Promise<TokenomistSnapshot | null> {
  const tokenId = rawId.trim().toLowerCase();
  if (!/^[a-z0-9-]{1,80}$/.test(tokenId)) throw new TokenomistError(400, "Invalid token id");
  if (SAMPLES[tokenId]) return sampleSnapshot(tokenId, "Fictional sample token for the demo", now);

  const access = await liveAccess();
  if (!access.live) throw new TokenomistError(503, access.reason ?? "Live Tokenomist data unavailable");

  const today = now.toISOString().slice(0, 10);
  const endpoints = {
    token: `/v5/token/list?tokenId=${tokenId}`,
    allocations: `/v5/allocations/${tokenId}`,
    unlocks: `/v5/unlock/events/${tokenId}?start=${today}&pageSize=10`,
  };

  const [tokenRes, allocRes, unlockRes] = await Promise.allSettled([
    get<TokenListItem[]>(endpoints.token),
    get<AllocationsData>(endpoints.allocations),
    get<UnlockEvent[]>(endpoints.unlocks),
  ]);

  const token = tokenRes.status === "fulfilled" ? (tokenRes.value.body.data[0] ?? null) : null;
  const allocations = allocRes.status === "fulfilled" ? allocRes.value.body.data : null;
  if (!token && !allocations) return null;

  // Unlock events can be a higher plan tier — treat "not available" separately from "none".
  const unlockEvents =
    unlockRes.status === "fulfilled"
      ? [...unlockRes.value.body.data].sort((a, b) => a.unlockDate.localeCompare(b.unlockDate))
      : null;

  const queryDate =
    (allocRes.status === "fulfilled" && allocRes.value.body.metadata.queryDate) ||
    (tokenRes.status === "fulfilled" && tokenRes.value.body.metadata.queryDate) ||
    now.toISOString();

  return {
    tokenId,
    mode: "live",
    sampleReason: null,
    queryDate,
    token,
    allocations,
    unlockEvents,
    endpoints: Object.values(endpoints),
  };
}

export { TokenomistError };
