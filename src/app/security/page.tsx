import { SentinelChecker } from "@/components/security/SentinelChecker";
import { SecurityTabs } from "@/components/security/SecurityTabs";

export const metadata = { title: "Sentinel AI — Sentinel Voice" };

export default function SecurityPage() {
  return (
    <section className="mx-auto max-w-5xl px-4 pt-14 sm:px-6">
      <SecurityTabs active="transaction" />
      <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-violet">Layer 2 · Sentinel AI</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-5xl">Check before you sign.</h1>
      <p className="mt-3 max-w-2xl text-muted">
        Pick a transaction and Sentinel will tell you what it really does — in plain language. Our checks follow
        fixed rules, so the same transaction always gets the same answer.
      </p>
      <SentinelChecker />
    </section>
  );
}
