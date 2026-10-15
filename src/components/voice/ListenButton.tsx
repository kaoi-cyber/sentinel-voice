"use client";

import { useEffect } from "react";
import { Loader2, Square, Volume2 } from "lucide-react";
import { player, usePlayer } from "@/lib/voice/player";

type Props = { id: string; text: string; label?: string; className?: string };

export function ListenButton({ id, text, label = "Listen", className = "" }: Props) {
  const p = usePlayer();
  const active = p.playingKey === id;

  // Stop talking if this button disappears (e.g. the user navigates away).
  useEffect(
    () => () => {
      if (player.getState().playingKey === id) player.stop();
    },
    [id],
  );

  return (
    <span className={`inline-flex flex-wrap items-center gap-2 ${className}`}>
      <button
        type="button"
        onClick={() => (active ? player.stop() : player.play(id, text))}
        aria-label={active ? "Stop speaking" : label}
        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition ${
          active ? "border-violet bg-violet/20 text-text" : "border-line text-muted hover:border-violet/60 hover:text-text"
        }`}
      >
        {active && p.loading ? <Loader2 size={13} className="animate-spin" /> : active ? <Square size={12} /> : <Volume2 size={13} />}
        {active ? (p.loading ? "Preparing voice…" : "Stop") : label}
      </button>
      {active && !p.loading && p.engine && <VoiceEngineTag engine={p.engine} reason={p.fallbackReason} />}
    </span>
  );
}

export function VoiceEngineTag({ engine, reason }: { engine: "elevenlabs" | "browser"; reason?: string | null }) {
  return engine === "elevenlabs" ? (
    <span className="text-[11px] text-safe">Voice by ElevenLabs</span>
  ) : (
    <span className="text-[11px] text-muted" title={reason ?? undefined}>
      Browser voice (fallback)
    </span>
  );
}
