"use client";

// One shared speaker for the whole app, so two "Listen" buttons never talk over each other.
// Tries ElevenLabs first; if that's unavailable, falls back to the browser's built-in voice.
import { useSyncExternalStore } from "react";
import { elevenLabsAvailable } from "./status";
import { STATIC_DEMO } from "@/lib/staticDemo";
import { packedVoiceUrl } from "./voicePack";

export type VoiceEngine = "elevenlabs" | "browser";

export type PlayerState = {
  /** Which button/message is speaking right now. */
  playingKey: string | null;
  loading: boolean;
  engine: VoiceEngine | null;
  /** Why ElevenLabs wasn't used, when we fell back. */
  fallbackReason: string | null;
};

const IDLE: PlayerState = { playingKey: null, loading: false, engine: null, fallbackReason: null };

let state = IDLE;
const listeners = new Set<() => void>();
let audio: HTMLAudioElement | null = null;
let objectUrl: string | null = null;
let token = 0;

function set(patch: Partial<PlayerState>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

function cleanup() {
  audio?.pause();
  audio = null;
  if (objectUrl) URL.revokeObjectURL(objectUrl);
  objectUrl = null;
  if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
}

function browserSpeak(text: string, myToken: number, reason: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    set({ playingKey: null, loading: false, engine: null, fallbackReason: reason });
    return;
  }
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "en-US";
  u.onend = () => myToken === token && set({ playingKey: null, loading: false });
  window.speechSynthesis.speak(u);
  set({ loading: false, engine: "browser", fallbackReason: reason });
}

export const player = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getState: () => state,

  async play(key: string, text: string) {
    cleanup();
    const myToken = ++token;
    set({ playingKey: key, loading: true });
    try {
      if (STATIC_DEMO) {
        // GitHub Pages edition: ElevenLabs audio generated ahead of time for every prepared line.
        const url = await packedVoiceUrl(text);
        if (!url) throw new Error("This line has no pre-generated ElevenLabs audio on the demo site");
        if (myToken !== token) return;
        audio = new Audio(url);
      } else {
        if (!(await elevenLabsAvailable())) throw new Error("ElevenLabs API key is not set");
        if (myToken !== token) return;
        const res = await fetch("/api/voice/speak", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });
        if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? `HTTP ${res.status}`);
        const blob = await res.blob();
        if (myToken !== token) return;
        objectUrl = URL.createObjectURL(blob);
        audio = new Audio(objectUrl);
      }
      audio.onended = () => myToken === token && set({ playingKey: null, loading: false });
      await audio.play();
      set({ loading: false, engine: "elevenlabs", fallbackReason: null });
    } catch (e) {
      if (myToken !== token) return;
      cleanup();
      browserSpeak(text, myToken, e instanceof Error ? e.message : "ElevenLabs unavailable");
    }
  },

  stop() {
    token++;
    cleanup();
    set({ playingKey: null, loading: false });
  },
};

export function usePlayer(): PlayerState {
  return useSyncExternalStore(player.subscribe, player.getState, () => IDLE);
}
