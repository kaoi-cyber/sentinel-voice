import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";

type Props = {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  description: string;
  topics: string[];
  href: string;
  cta: string;
  accent: "blue" | "violet";
};

export function ExperienceCard({ icon: Icon, eyebrow, title, description, topics, href, cta, accent }: Props) {
  const isBlue = accent === "blue";
  return (
    <div className={`glow-card ${isBlue ? "" : "violet"} flex flex-col rounded-3xl p-6 sm:p-8`}>
      <div className="flex items-center gap-3">
        <span
          className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
            isBlue ? "bg-blue/15 text-blue" : "bg-violet/15 text-violet"
          }`}
        >
          <Icon size={24} />
        </span>
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">{eyebrow}</span>
      </div>

      <h2 className="mt-5 text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h2>
      <p className="mt-2 text-muted">{description}</p>

      <ul className="mt-5 flex flex-wrap gap-2">
        {topics.map((t) => (
          <li key={t} className="rounded-full border border-line bg-ink/40 px-3 py-1 text-xs text-muted">
            {t}
          </li>
        ))}
      </ul>

      <Link
        href={href}
        className={`mt-8 inline-flex items-center justify-center gap-2 self-start rounded-xl px-5 py-3 font-semibold text-white transition ${
          isBlue ? "bg-blue hover:bg-blue/85" : "bg-violet hover:bg-violet/85"
        }`}
      >
        {cta}
        <ArrowRight size={18} />
      </Link>
    </div>
  );
}
