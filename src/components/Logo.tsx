import Link from "next/link";

/** Shield with a microphone inside — the Sentinel Voice mark. */
export function LogoMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="logo-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#4f7cff" />
          <stop offset="1" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
      <path
        d="M20 3 6 8.5v10c0 9 6 15.5 14 18.5 8-3 14-9.5 14-18.5v-10L20 3Z"
        fill="url(#logo-grad)"
        opacity="0.18"
        stroke="url(#logo-grad)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <rect x="16.5" y="11" width="7" height="12" rx="3.5" fill="#e8eeff" />
      <path
        d="M13 19.5a7 7 0 0 0 14 0M20 26.5V30"
        fill="none"
        stroke="#e8eeff"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5" aria-label="Sentinel Voice home">
      <LogoMark />
      <span className="text-lg font-bold tracking-tight">
        Sentinel <span className="text-gradient">Voice</span>
      </span>
    </Link>
  );
}
