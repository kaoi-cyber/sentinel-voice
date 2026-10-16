// Pre-generated ElevenLabs audio for every prepared voice line (scripts/build-voice-pack.ts).
// Lets the static GitHub Pages edition play the real ElevenLabs voice without exposing a key.
import { asset } from "@/lib/staticDemo";

/** Stable file name for a line of text: first 16 hex chars of its SHA-256. */
export async function voiceKey(text: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("").slice(0, 16);
}

let manifest: Promise<Set<string>> | null = null;

/** URL of the pre-generated MP3 for this text, or null if it wasn't generated. */
export async function packedVoiceUrl(text: string): Promise<string | null> {
  manifest ??= fetch(asset("/voice/manifest.json"))
    .then((r) => (r.ok ? r.json() : { keys: [] }))
    .then((m: { keys: string[] }) => new Set(m.keys))
    .catch(() => new Set<string>());
  const key = await voiceKey(text);
  return (await manifest).has(key) ? asset(`/voice/${key}.mp3`) : null;
}
