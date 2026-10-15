// Server-only ElevenLabs settings. The API key is read from .env.local and never
// sent to the browser — the browser talks to our /api/voice/* routes instead.

export const ELEVENLABS_API = "https://api.elevenlabs.io/v1";

export type ElevenLabsConfig = {
  key: string;
  voiceId: string;
  ttsModel: string;
  sttModel: string;
};

export function elevenLabsConfig(): ElevenLabsConfig | null {
  const key = process.env.ELEVENLABS_API_KEY?.trim();
  if (!key) return null;
  return {
    key,
    voiceId: process.env.ELEVENLABS_VOICE_ID?.trim() || "JBFqnCBsd6RMkjVDRZzb",
    ttsModel: process.env.ELEVENLABS_TTS_MODEL?.trim() || "eleven_flash_v2_5",
    sttModel: process.env.ELEVENLABS_STT_MODEL?.trim() || "scribe_v2",
  };
}

/** Turns an ElevenLabs error response into one readable line (never includes the key). */
export async function elevenLabsError(res: Response): Promise<string> {
  let detail = "";
  try {
    const body = await res.json();
    const d = body?.detail;
    detail = typeof d === "string" ? d : d?.message ?? (Array.isArray(d) ? d.map((x) => x?.msg).join("; ") : "");
  } catch {
    // Non-JSON error body — the status code is enough.
  }
  return `ElevenLabs ${res.status}${detail ? `: ${detail}` : ""}`;
}
