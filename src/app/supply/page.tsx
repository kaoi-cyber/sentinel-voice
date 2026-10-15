import { SecurityTabs } from "@/components/security/SecurityTabs";
import { SupplyRiskChecker } from "@/components/supply/SupplyRiskChecker";

export const metadata = { title: "Token Supply Risk — Sentinel Voice" };

export default function SupplyPage() {
  return (
    <section className="mx-auto max-w-5xl px-4 pt-14 sm:px-6">
      <SecurityTabs active="supply" />
      <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-violet">Layer 2 · Sentinel AI · Powered by Tokenomist data</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-5xl">Spot supply pressure early.</h1>
      <p className="mt-3 max-w-2xl text-muted">
        Big token unlocks and insider-heavy allocations can add selling pressure. Sentinel checks a token&apos;s unlock schedule and
        holders with fixed rules — every finding shows the exact Tokenomist number behind it. A risk signal, never a price prediction.
      </p>
      <SupplyRiskChecker />
    </section>
  );
}
