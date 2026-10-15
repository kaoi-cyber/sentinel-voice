import { LogoMark } from "./Logo";

const BARS = [0.5, 0.8, 1, 0.7, 0.9, 0.6, 1, 0.75, 0.55];

/** Pulsing shield with a live "voice" waveform beneath it. */
export function HeroVisual() {
  return (
    <div className="relative mx-auto flex aspect-square w-full max-w-[22rem] items-center justify-center">
      <div className="pulse-ring absolute inset-6 rounded-full border border-blue/40" />
      <div className="pulse-ring delay absolute inset-6 rounded-full border border-violet/40" />
      <div className="absolute inset-12 rounded-full bg-gradient-to-br from-blue/25 to-violet/25 blur-2xl" />
      <div className="relative flex flex-col items-center gap-5 rounded-[2rem] border border-line bg-surface/80 px-10 py-9 shadow-[0_0_60px_-15px_rgb(79_124_255/0.6)]">
        <LogoMark className="h-24 w-24" />
        <div className="flex h-8 items-center gap-1.5" aria-hidden="true">
          {BARS.map((h, i) => (
            <span
              key={i}
              className="wave-bar w-1.5 rounded-full bg-gradient-to-t from-blue to-violet"
              style={{ height: `${h * 100}%`, animationDelay: `${i * 0.11}s` }}
            />
          ))}
        </div>
        <span className="rounded-full border border-safe/40 bg-safe/10 px-3 py-1 text-xs font-medium text-safe">
          ● Guardian online
        </span>
      </div>
    </div>
  );
}
