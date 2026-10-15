import { NextResponse } from "next/server";
import { elevenLabsConfig } from "@/lib/voice/elevenlabs";

export const dynamic = "force-dynamic";

/** Tells the browser whether ElevenLabs is configured — without revealing the key. */
export function GET() {
  return NextResponse.json({ elevenlabs: elevenLabsConfig() !== null });
}
