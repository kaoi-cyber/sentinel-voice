import { PaymentGuard } from "@/components/guard/PaymentGuard";
import { SecurityTabs } from "@/components/security/SecurityTabs";

export const metadata = { title: "Agent Payment Guard — Sentinel Voice" };

export default function GuardPage() {
  return (
    <section className="mx-auto max-w-6xl px-4 pt-14 sm:px-6">
      <SecurityTabs active="guard" />
      <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-violet">Layer 2 · Sentinel AI · Agentic payments</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-5xl">Your AI agent pays. Sentinel checks first.</h1>
      <p className="mt-3 max-w-3xl text-muted">
        AI agents that pay for you are coming — and so is fraud designed to trick them. Set your guardrails once; Sentinel checks every payment
        the agent proposes and Allows it, asks you, or Blocks it, with the reason. The agent&apos;s words never override a rule.
      </p>
      <p className="mt-4 inline-flex flex-wrap items-center gap-2 rounded-xl border border-violet/40 bg-violet/10 px-4 py-2 text-sm">
        <span className="font-semibold text-violet">Designed for U-topia</span>
        <span className="text-muted">— U-Pay payments and U-Bot agentic payments. The agent here is simulated; live integration is pending U-topia developer access.</span>
      </p>
      <PaymentGuard />
    </section>
  );
}
