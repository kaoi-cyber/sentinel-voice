import { NextResponse } from "next/server";
import { ELEVENLABS_API, elevenLabsConfig, elevenLabsError } from "@/lib/voice/elevenlabs";

// Keeps a single request from burning through ElevenLabs credits.
const MAX_CHARS = 2500;

let fallbackVoiceId: string | null = null;

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

  let res = await tts(fallbackVoiceId ?? cfg.voiceId);
  // The default voice may not exist on every account — retry once with the account's first voice.
  if (res.status === 404 && !fallbackVoiceId) {
    fallbackVoiceId = await firstAvailableVoice(cfg.key);
    if (fallbackVoiceId) res = await tts(fallbackVoiceId);
  }
  if (!res.ok || !res.body) return NextResponse.json({ error: await elevenLabsError(res) }, { status: 502 });

  return new Response(res.body, { headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" } });
}
