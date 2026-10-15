import { NextResponse } from "next/server";
import { ELEVENLABS_API, elevenLabsConfig, elevenLabsError } from "@/lib/voice/elevenlabs";

const MAX_BYTES = 10 * 1024 * 1024;

/** Speech → text. Multipart body with an `audio` file. Returns { text }. */
export async function POST(req: Request) {
  const cfg = elevenLabsConfig();
  if (!cfg) return NextResponse.json({ error: "ElevenLabs API key is not set" }, { status: 503 });

  const form = await req.formData().catch(() => null);
  const audio = form?.get("audio");
  if (!(audio instanceof Blob) || audio.size === 0) {
    return NextResponse.json({ error: "No audio received" }, { status: 400 });
  }
  if (audio.size > MAX_BYTES) return NextResponse.json({ error: "Recording is too long" }, { status: 413 });

  const out = new FormData();
  out.append("file", audio, audio instanceof File && audio.name ? audio.name : "question.webm");
  out.append("model_id", cfg.sttModel);
  out.append("tag_audio_events", "false");

  const res = await fetch(`${ELEVENLABS_API}/speech-to-text`, {
    method: "POST",
    headers: { "xi-api-key": cfg.key },
    body: out,
  });
  if (!res.ok) return NextResponse.json({ error: await elevenLabsError(res) }, { status: 502 });

  const data = await res.json();
  return NextResponse.json({ text: typeof data?.text === "string" ? data.text.trim() : "" });
}
