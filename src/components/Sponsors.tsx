import Link from "next/link";

// Official U-Hackathon 2026 sponsors and what each one does in Sentinel Voice.
// Status is stated honestly: never claim an integration that isn't working.
const SPONSORS: { name: string; role: string; status: string; tone: "live" | "sample" | "tbc"; href?: string }[] = [
  { name: "Avalanche", role: "Seals every report's fingerprint on Fuji", status: "Live", tone: "live", href: "/expert" },
  { name: "ElevenLabs", role: "VoiceGuard's voice: speech in and out", status: "Live", tone: "live", href: "/learn" },
  { name: "U-topia · U-bot", role: "Agent Payment Guard + quiz built with U-bot", status: "Built with", tone: "live", href: "/guard" },
  { name: "Tokenomist", role: "Unlock and holder data for supply risk", status: "Sample data", tone: "sample", href: "/supply" },
  { name: "DTV Group", role: "Role to be confirmed with the sponsor", status: "TBC", tone: "tbc" },
];

const TONE = {
  live: "border-safe/40 text-safe",
  sample: "border-gold/40 text-gold",
  tbc: "border-line text-muted",
};

export function Sponsors() {
  return (
    <section className="mx-auto mt-24 max-w-6xl px-4 sm:px-6" aria-labelledby="sponsors-heading">
      <h2 id="sponsors-heading" className="text-center text-xs font-semibold uppercase tracking-[0.25em] text-muted">
        U-Hackathon 2026 sponsors — and what they power
      </h2>
      <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {SPONSORS.map((s) => {
          const body = (
            <>
              <span className={`inline-block whitespace-nowrap rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${TONE[s.tone]}`}>
                {s.status}
              </span>
              <span className="mt-2 block font-bold text-text">{s.name}</span>
              <span className="mt-1.5 block text-sm text-muted">{s.role}</span>
            </>
          );
          return (
            <li key={s.name}>
              {s.href ? (
                <Link href={s.href} className="glow-card block h-full rounded-2xl p-4">
                  {body}
                </Link>
              ) : (
                <div className="block h-full rounded-2xl border border-line bg-surface/60 p-4">{body}</div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
