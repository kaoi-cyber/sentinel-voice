import { LogoMark } from "./Logo";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-line/60">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 py-10 text-center sm:px-6">
        <LogoMark className="h-8 w-8" />
        <p className="font-semibold">
          Sentinel Voice — <span className="text-gradient">Build Your Crypto Future. Protect Every Step.</span>
        </p>
        <p className="max-w-xl text-xs text-muted">
          Educational tool built for U-Hackathon 2026. Not financial advice. Security checks are
          informational and cannot guarantee a transaction is safe.
        </p>
      </div>
    </footer>
  );
}
