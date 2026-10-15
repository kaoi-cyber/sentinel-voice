"use client";

import { LogoMark } from "./Logo";
import { player, usePlayer } from "@/lib/voice/player";
import { VoiceEngineTag } from "./voice/ListenButton";

const BARS = [0.5, 0.8, 1, 0.7, 0.9, 0.6, 1, 0.75, 0.55];

export const GREETING_ID = "hero-greeting";
export const GREETING_TEXT =
  "Hey, new here? Don't worry, I've got you. Understand crypto, explore your future, and protect every step.";

/** Pulsing shield with a "voice" waveform. Tap it and VoiceGuard says hello (ElevenLabs). */
export function HeroVisual() {
  const p = usePlayer();
  const speaking = p.playingKey === GREETING_ID;

  return (
    <div className="relative mx-auto flex aspect-square w-full max-w-[22rem] items-center justify-center">
      <div className="pulse-ring absolute inset-6 rounded-full border border-blue/40" />
      <div className="pulse-ring delay absolute inset-6 rounded-full border border-violet/40" />
      <div className="absolute inset-12 rounded-full bg-gradient-to-br from-blue/25 to-violet/25 blur-2xl" />
      <button
        type="button"
        onClick={() => (speaking ? player.stop() : player.play(GREETING_ID, GREETING_TEXT))}
        aria-label={speaking ? "Stop VoiceGuard" : "Hear VoiceGuard say hello"}
        className={`relative flex flex-col items-center gap-5 rounded-[2rem] border bg-surface/80 px-10 py-9 transition hover:scale-[1.02] ${
          speaking ? "border-violet shadow-[0_0_80px_-10px_rgb(139_92_246/0.8)]" : "border-line shadow-[0_0_60px_-15px_rgb(79_124_255/0.6)]"
        }`}
      >
        <LogoMark className="h-24 w-24" />
        <div className="flex h-8 items-center gap-1.5" aria-hidden="true">
          {BARS.map((h, i) => (
            <span
              key={i}
              className="wave-bar w-1.5 rounded-full bg-gradient-to-t from-blue to-violet"
              style={{ height: `${h * 100}%`, animationDelay: `${i * 0.11}s`, animationDuration: speaking ? "0.5s" : undefined }}
            />
          ))}
        </div>
        <span
          className={`rounded-full border px-3 py-1 text-xs font-medium ${
            speaking ? "border-violet/50 bg-violet/15 text-violet" : "border-safe/40 bg-safe/10 text-safe"
          }`}
        >
          {speaking ? (p.loading ? "● Warming up…" : "● Speaking — tap to stop") : "● Guardian online · tap to hear me"}
        </span>
        {speaking && !p.loading && p.engine && <VoiceEngineTag engine={p.engine} reason={p.fallbackReason} />}
      </button>
    </div>
  );
}
