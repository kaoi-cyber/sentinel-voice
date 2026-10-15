import Link from "next/link";

const TABS = [
  { id: "ask", href: "/learn", label: "Ask VoiceGuard" },
  { id: "start", href: "/learn/start", label: "Start safely" },
  { id: "quiz", href: "/quiz", label: "Safety quiz" },
] as const;

export function LearnTabs({ active }: { active: (typeof TABS)[number]["id"] }) {
  return (
    <nav aria-label="VoiceGuard sections" className="inline-flex flex-wrap rounded-xl border border-line bg-surface/60 p-1">
      {TABS.map((t) => (
        <Link
          key={t.id}
          href={t.href}
          aria-current={t.id === active ? "page" : undefined}
          className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${t.id === active ? "bg-blue text-white" : "text-muted hover:text-text"}`}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
