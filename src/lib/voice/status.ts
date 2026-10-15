"use client";

import { useEffect, useState } from "react";

export type VoiceStatus = { loaded: boolean; elevenlabs: boolean };

let request: Promise<boolean> | null = null;

/** Cached check: does the server have an ElevenLabs key? */
export function elevenLabsAvailable(): Promise<boolean> {
  request ??= fetch("/api/voice/status")
    .then((r) => r.json())
    .then((d) => d?.elevenlabs === true)
    .catch(() => false);
  return request;
}

/** Whether the server has an ElevenLabs key. Fetched once per page load. */
export function useVoiceStatus(): VoiceStatus {
  const [status, setStatus] = useState<VoiceStatus>({ loaded: false, elevenlabs: false });
  useEffect(() => {
    let live = true;
    elevenLabsAvailable().then((elevenlabs) => live && setStatus({ loaded: true, elevenlabs }));
    return () => {
      live = false;
    };
  }, []);
  return status;
}
