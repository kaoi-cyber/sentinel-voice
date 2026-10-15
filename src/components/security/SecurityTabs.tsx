import Link from "next/link";

const TABS = [
  { id: "transaction", href: "/security", label: "Transaction check" },
  { id: "supply", href: "/supply", label: "Token supply risk" },
] as const;

export function SecurityTabs({ active }: { active: (typeof TABS)[number]["id"] }) {
  return (
    <nav aria-label="Sentinel checks" className="inline-flex rounded-xl border border-line bg-surface/60 p-1">
      {TABS.map((t) => (
        <Link
          key={t.id}
          href={t.href}
          aria-current={t.id === active ? "page" : undefined}
          className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
            t.id === active ? "bg-violet text-white" : "text-muted hover:text-text"
          }`}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
