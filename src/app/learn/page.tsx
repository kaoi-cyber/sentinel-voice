import { Suspense } from "react";
import { VoiceGuardChat } from "@/components/voiceguard/VoiceGuardChat";

export const metadata = { title: "VoiceGuard AI — Sentinel Voice" };

export default function LearnPage() {
  return (
    <section className="mx-auto max-w-6xl px-4 pt-14 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue">Layer 1 · VoiceGuard AI</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-5xl">Learn crypto without feeling lost.</h1>
      <p className="mt-3 max-w-2xl text-muted">
        Friendly, plain-language answers about crypto, wallets and staying safe. Education only — not financial
        advice.
      </p>
      <Suspense>
        <VoiceGuardChat />
      </Suspense>
    </section>
  );
}
