import { Bot, Building2, FileCheck2, Radar, ShieldCheck } from "lucide-react";
import { WalletAudit } from "@/components/business/WalletAudit";

export const metadata = { title: "Sentinel for Wallets — Sentinel Voice" };

const ROADMAP = [
  {
    icon: FileCheck2,
    stage: "Today · Hackathon MVP",
    title: "Drainer Readiness Audit",
    text: "A test pack of real drainer techniques that wallet teams replay through their own wallet, a security-controls review, a prioritised fix list, and an audit certificate sealed on Avalanche.",
  },
  {
    icon: Radar,
    stage: "Next",
    title: "Automated test harness",
    text: "An SDK and test-dApp that fire the test pack at a wallet build automatically in CI and read its responses — so every release is re-checked, not just once a year.",
  },
  {
    icon: Bot,
    stage: "Future",
    title: "AI-assisted penetration testing",
    text: "AI agents that generate new attack variants from fresh drainer campaigns, probe a wallet's signing flows in a sandbox, and explain each finding with a reproducible proof — always under a signed scope and the wallet company's written authorisation.",
  },
  {
    icon: ShieldCheck,
    stage: "Vision",
    title: "Continuous trust score",
    text: "Each audited release gets a fresh on-chain attestation, so users can check that their wallet is tested against today's attacks — not last year's.",
  },
];

export default function BusinessPage() {
  return (
    <section className="mx-auto max-w-5xl px-4 pt-14 sm:px-6">
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-violet">
        <Building2 size={14} /> Sentinel for Wallets · B2B
      </p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-5xl">Stop the drain before your users lose funds.</h1>
      <p className="mt-3 max-w-2xl text-muted">
        Most wallet drains don&apos;t break cryptography — they trick users into signing something their wallet didn&apos;t explain.
        Sentinel tests whether your wallet catches the techniques drainers actually use, and tells you exactly what to fix.
      </p>

      <WalletAudit />

      <section className="mt-20">
        <h2 className="text-2xl font-extrabold tracking-tight">Roadmap: from audit to AI-assisted penetration testing</h2>
        <p className="mt-2 max-w-2xl text-muted">
          Today&apos;s audit is a structured self-assessment. The same test pack and report format are the foundation for automated and
          AI-driven testing — every stage keeps the rules transparent and the results verifiable.
        </p>
        <ol className="mt-6 grid gap-4 sm:grid-cols-2">
          {ROADMAP.map(({ icon: Icon, stage, title, text }) => (
            <li key={title} className="glow-card rounded-2xl p-5">
              <Icon className="text-gold" size={22} />
              <p className="mt-3 text-xs font-semibold uppercase tracking-[0.15em] text-violet">{stage}</p>
              <p className="mt-1 font-bold">{title}</p>
              <p className="mt-1 text-sm text-muted">{text}</p>
            </li>
          ))}
        </ol>
      </section>
    </section>
  );
}
