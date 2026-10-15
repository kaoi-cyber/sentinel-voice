import { GraduationCap, ShieldCheck, Rocket, AudioLines } from "lucide-react";

const FEATURES = [
  { icon: GraduationCap, title: "Learn & Grow", text: "Crypto basics, wallets and tokenomics explained in plain language." },
  { icon: ShieldCheck, title: "Stay Protected", text: "Spot risky approvals and suspicious transactions before you sign." },
  { icon: Rocket, title: "Build Your Future", text: "Understand long-term concepts and risk — no hype, no promises." },
  { icon: AudioLines, title: "Talk to Your AI", text: "Ask questions out loud and hear friendly, clear answers." },
];

export function Features() {
  return (
    <section className="mx-auto mt-20 max-w-6xl px-4 sm:px-6" aria-label="Features">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map(({ icon: Icon, title, text }) => (
          <div key={title} className="glow-card rounded-2xl p-5">
            <Icon className="text-gold" size={24} />
            <h3 className="mt-3 font-bold">{title}</h3>
            <p className="mt-1 text-sm text-muted">{text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
