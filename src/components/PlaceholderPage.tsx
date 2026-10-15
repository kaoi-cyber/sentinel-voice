import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowLeft } from "lucide-react";

type Props = {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  intro: string;
  coming: string[];
};

export function PlaceholderPage({ icon: Icon, eyebrow, title, intro, coming }: Props) {
  return (
    <section className="mx-auto max-w-3xl px-4 pt-16 sm:px-6">
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted hover:text-text">
        <ArrowLeft size={16} /> Back home
      </Link>
      <div className="glow-card mt-6 rounded-3xl p-8">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue/15 text-blue">
          <Icon size={24} />
        </span>
        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-muted">{eyebrow}</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h1>
        <p className="mt-3 text-muted">{intro}</p>

        <h2 className="mt-8 text-sm font-semibold text-gold">Coming next</h2>
        <ul className="mt-3 space-y-2">
          {coming.map((item) => (
            <li key={item} className="flex gap-3 text-sm text-text/90">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
