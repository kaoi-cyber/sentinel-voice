import Link from "next/link";
import { BookOpenText, ShieldAlert, Terminal } from "lucide-react";
import { HeroVisual } from "@/components/HeroVisual";
import { ExperienceCard } from "@/components/ExperienceCard";
import { Sponsors } from "@/components/Sponsors";
import { Features } from "@/components/Features";

export default function Home() {
  return (
    <>
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pt-14 sm:px-6 lg:grid-cols-[1.2fr_1fr] lg:pt-20">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-xs font-semibold text-gold">
            AI + Web3 · U-Hackathon 2026
          </span>
          <h1 className="mt-5 text-4xl font-black leading-[1.05] tracking-tight sm:text-6xl">
            HEY, NEW HERE?
            <br />
            <span className="text-gradient">DON&apos;T WORRY, I&apos;VE GOT YOU.</span>
          </h1>
          <p className="mt-5 max-w-lg text-lg text-muted">
            Understand crypto. Explore your future.
            <br />
            Protect every step.
          </p>
        </div>
        <HeroVisual />
      </section>

      <section className="mx-auto mt-14 grid max-w-6xl gap-5 px-4 sm:px-6 md:grid-cols-2">
        <ExperienceCard
          icon={BookOpenText}
          eyebrow="For newcomers"
          title="VOICEGUARD AI"
          description="Your crypto learning and investment research companion."
          topics={["Crypto & Bitcoin", "Wallets", "Volatility", "Tokenomics", "Long-term concepts"]}
          href="/learn"
          cta="Start Learning"
          accent="blue"
        />
        <ExperienceCard
          icon={ShieldAlert}
          eyebrow="For everyone"
          title="SENTINEL AI"
          description="Your security agent for transactions and smart contracts."
          topics={["Transaction analysis", "Token approvals", "Risk indicators", "Security reports"]}
          href="/security"
          cta="Check Security"
          accent="violet"
        />
      </section>

      <div className="mx-auto mt-6 max-w-6xl px-4 sm:px-6">
        <Link
          href="/expert"
          className="glow-card violet flex flex-col items-start justify-between gap-3 rounded-2xl px-6 py-5 sm:flex-row sm:items-center"
        >
          <span className="flex items-center gap-3">
            <Terminal className="text-violet" size={22} />
            <span>
              <span className="font-bold">I&apos;m an Expert</span>
              <span className="block text-sm text-muted">
                Go straight to the technical security dashboard — raw evidence, rule IDs and report hashes.
              </span>
            </span>
          </span>
          <span className="text-sm font-semibold text-violet">Open dashboard →</span>
        </Link>
      </div>

      <Sponsors />
      <Features />
    </>
  );
}
