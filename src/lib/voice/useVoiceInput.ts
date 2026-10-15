"use client";

// Microphone → text. Records audio and sends it to ElevenLabs Speech-to-Text via our
// server. Without an ElevenLabs key, uses the browser's own speech recognition (Chrome/Edge).
import { useRef, useState } from "react";
import { player } from "./player";
import { useVoiceStatus } from "./status";

export type InputState = "idle" | "recording" | "transcribing";

const MAX_RECORDING_MS = 15_000;

// The Web Speech API isn't in TypeScript's DOM types yet.
type BrowserRecognition = {
  lang: string;
  interimResults: boolean;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
};
type RecognitionCtor = new () => BrowserRecognition;

function browserRecognition(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function useVoiceInput(onTranscript: (text: string) => void) {
  const status = useVoiceStatus();
  const [state, setState] = useState<InputState>("idle");
  const [error, setError] = useState<string | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const recognition = useRef<BrowserRecognition | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function startElevenLabs() {
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setError("Microphone access was blocked. Allow it in your browser's address bar and try again.");
      return;
    }
    const chunks: Blob[] = [];
    const mr = new MediaRecorder(stream);
    recorder.current = mr;
    mr.ondataavailable = (e) => e.data.size > 0 && chunks.push(e.data);
    mr.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop());
      setState("transcribing");
      try {
        const type = mr.mimeType || "audio/webm";
        const ext = type.includes("mp4") ? "m4a" : type.includes("ogg") ? "ogg" : "webm";
        const form = new FormData();
        form.append("audio", new Blob(chunks, { type }), `question.${ext}`);
        const res = await fetch("/api/voice/transcribe", { method: "POST", body: form });
        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error(data?.error ?? `HTTP ${res.status}`);
        if (data?.text) onTranscript(data.text);
        else setError("I didn't catch that — try again, a little closer to the mic.");
      } catch (e) {
        setError(`Couldn't transcribe: ${e instanceof Error ? e.message : "unknown error"}`);
      } finally {
        setState("idle");
      }
    };
    mr.start();
    setState("recording");
    timer.current = setTimeout(() => mr.state === "recording" && mr.stop(), MAX_RECORDING_MS);
  }

  function startBrowser() {
    const Ctor = browserRecognition();
    if (!Ctor) {
      setError("Voice input needs the ElevenLabs key, or the Chrome/Edge browser.");
      return;
    }
    const r = new Ctor();
    recognition.current = r;
    r.lang = "en-US";
    r.interimResults = false;
    r.onresult = (e) => {
      const text = e.results[0]?.[0]?.transcript?.trim();
      if (text) onTranscript(text);
    };
    r.onerror = (e) => setError(e.error === "not-allowed" ? "Microphone access was blocked." : `Voice input error: ${e.error}`);
    r.onend = () => setState("idle");
    r.start();
    setState("recording");
  }

  function toggle() {
    if (state === "transcribing") return;
    if (state === "recording") {
      if (timer.current) clearTimeout(timer.current);
      if (recorder.current?.state === "recording") recorder.current.stop();
      recognition.current?.stop();
      return;
    }
    setError(null);
    player.stop();
    if (status.elevenlabs) void startElevenLabs();
    else startBrowser();
  }

  return { state, error, toggle, engine: status.elevenlabs ? "elevenlabs" : "browser", ready: status.loaded } as const;
}
