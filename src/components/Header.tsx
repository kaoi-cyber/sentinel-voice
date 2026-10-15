"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, Terminal } from "lucide-react";
import { Logo } from "./Logo";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/learn", label: "Learn" },
  { href: "/security", label: "Security" },
  { href: "/business", label: "For Wallets" },
  { href: "/about", label: "About" },
];

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-line/60 bg-ink/75 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Logo />

        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-lg px-3 py-2 text-sm transition-colors ${
                pathname === item.href ? "text-text" : "text-muted hover:text-text"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ExpertButton className="hidden sm:inline-flex" />
          <button
            type="button"
            className="rounded-lg p-2 text-muted hover:text-text md:hidden"
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-line/60 px-4 pb-4 md:hidden" aria-label="Mobile">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-3 text-muted hover:text-text"
            >
              {item.label}
            </Link>
          ))}
          <ExpertButton className="mt-2 flex w-full justify-center" onClick={() => setOpen(false)} />
        </nav>
      )}
    </header>
  );
}

function ExpertButton({ className = "", onClick }: { className?: string; onClick?: () => void }) {
  return (
    <Link
      href="/expert"
      onClick={onClick}
      className={`items-center gap-2 rounded-xl border border-violet/50 bg-violet/10 px-4 py-2 text-sm font-semibold text-text transition hover:bg-violet/25 ${className}`}
    >
      <Terminal size={16} />
      I&apos;m an Expert
    </Link>
  );
}
