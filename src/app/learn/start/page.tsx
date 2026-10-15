import { LearnTabs } from "@/components/learn/LearnTabs";
import { MarketHistory } from "@/components/learn/MarketHistory";
import { BuyingGuide, PlatformChecklist, SavingsRules } from "@/components/learn/SafeStartGuide";
import { SavingsSimulator } from "@/components/learn/SavingsSimulator";

export const metadata = { title: "Start safely — VoiceGuard AI" };

export default function StartSafelyPage() {
  return (
    <section className="mx-auto max-w-5xl px-4 pt-14 sm:px-6">
      <LearnTabs active="start" />
      <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-blue">Layer 1 · VoiceGuard AI</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-5xl">Start in crypto — safely.</h1>
      <p className="mt-3 max-w-2xl text-muted">
        How to buy, how to judge a platform, what real price history looks like, and how people build savings carefully. Education only —
        we never tell you what to buy.
      </p>

      <Block id="buy" title="How to buy crypto, step by step">
        <BuyingGuide />
      </Block>
      <Block id="platform" title="Is this platform secure? Check it yourself">
        <PlatformChecklist />
      </Block>
      <Block id="history" title="What real price history looks like">
        <MarketHistory />
      </Block>
      <Block id="savings" title="Building savings: what regular saving would have looked like">
        <SavingsSimulator />
      </Block>
      <Block id="rules" title="Six rules for saving in crypto securely">
        <SavingsRules />
      </Block>
    </section>
  );
}

function Block({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="glow-card mt-8 scroll-mt-24 rounded-3xl p-5 sm:p-8">
      <h2 className="mb-4 text-xl font-bold sm:text-2xl">{title}</h2>
      {children}
    </section>
  );
}
