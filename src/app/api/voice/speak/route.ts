import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { ELEVENLABS_API, elevenLabsConfig, elevenLabsError } from "@/lib/voice/elevenlabs";
import { rateLimited } from "@/lib/rateLimit";

// Keeps a single request from burning through ElevenLabs credits.
const MAX_CHARS = 2500;

let fallbackVoiceId: string | null = null;

// Generated audio is saved here (git-ignored) so repeating an answer costs no credits
// and still plays if the internet drops during the demo.
// On Vercel only /tmp is writable (and per-instance); locally the cache lives in the project.
const CACHE_DIR = process.env.VERCEL ? "/tmp/voice-cache" : path.join(process.cwd(), ".voice-cache");
const AUDIO_HEADERS = { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" };

async function firstAvailableVoice(key: string): Promise<string | null> {
  const res = await fetch(`${ELEVENLABS_API}/voices`, { headers: { "xi-api-key": key } });
  if (!res.ok) return null;
  const data = await res.json().catch(() => null);
  return data?.voices?.[0]?.voice_id ?? null;
}

/** Text → speech. Body: { text }. Returns audio/mpeg. */
export async function POST(req: Request) {
  const cfg = elevenLabsConfig();
  if (!cfg) return NextResponse.json({ error: "ElevenLabs API key is not set" }, { status: 503 });

  const body = await req.json().catch(() => null);
  const text = typeof body?.text === "string" ? body.text.trim() : "";
  if (!text) return NextResponse.json({ error: "No text to speak" }, { status: 400 });
  if (text.length > MAX_CHARS) return NextResponse.json({ error: "Text is too long" }, { status: 413 });

  const tts = (voiceId: string) =>
    fetch(`${ELEVENLABS_API}/text-to-speech/${encodeURIComponent(voiceId)}?output_format=mp3_44100_128`, {
      method: "POST",
      headers: { "xi-api-key": cfg.key, "Content-Type": "application/json", Accept: "audio/mpeg" },
      body: JSON.stringify({ text, model_id: cfg.ttsModel }),
    });

  const voiceId = fallbackVoiceId ?? cfg.voiceId;
  const cacheFile = path.join(CACHE_DIR, createHash("sha256").update(`${voiceId}|${cfg.ttsModel}|${text}`).digest("hex") + ".mp3");
  const cached = await readFile(cacheFile).catch(() => null);
  if (cached) return new Response(new Uint8Array(cached), { headers: AUDIO_HEADERS });

  if (rateLimited(req, "tts", 30, 10 * 60_000))
    return NextResponse.json({ error: "Voice limit reached — try again in a few minutes" }, { status: 429 });

  let res = await tts(voiceId);
  // The default voice may not exist on every account — retry once with the account's first voice.
  if (res.status === 404 && !fallbackVoiceId) {
    fallbackVoiceId = await firstAvailableVoice(cfg.key);
    if (fallbackVoiceId) res = await tts(fallbackVoiceId);
  }
  if (!res.ok) return NextResponse.json({ error: await elevenLabsError(res) }, { status: 502 });

  const audio = new Uint8Array(await res.arrayBuffer());
  // Only cache under the voice that was actually used.
  if (voiceId === (fallbackVoiceId ?? cfg.voiceId)) {
    await mkdir(CACHE_DIR, { recursive: true })
      .then(() => writeFile(cacheFile, audio))
      .catch(() => undefined);
  }
  return new Response(audio, { headers: AUDIO_HEADERS });
}
