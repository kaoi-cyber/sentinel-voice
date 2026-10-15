// Official U-Hackathon 2026 sponsors. Text labels only — official logos are not bundled,
// and this list does not claim any integration is complete.
const SPONSORS = ["Avalanche", "ElevenLabs", "U-bot", "Tokenomist", "DTV Group", "U-topia"];

export function Sponsors() {
  return (
    <section className="mx-auto mt-24 max-w-6xl px-4 sm:px-6" aria-labelledby="sponsors-heading">
      <h2
        id="sponsors-heading"
        className="text-center text-xs font-semibold uppercase tracking-[0.25em] text-muted"
      >
        U-Hackathon 2026 sponsors
      </h2>
      <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {SPONSORS.map((name) => (
          <li
            key={name}
            className="flex h-16 items-center justify-center rounded-2xl border border-line bg-surface/60 px-3 text-center font-semibold text-text/85 transition hover:border-gold/50 hover:text-gold"
          >
            {name}
          </li>
        ))}
      </ul>
    </section>
  );
}
