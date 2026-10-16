import { STATIC_DEMO } from "@/lib/staticDemo";

/** Shown only on the GitHub Pages edition, so visitors know what differs from the full app. */
export function DemoEditionBanner() {
  if (!STATIC_DEMO) return null;
  return (
    <div className="border-b border-violet/30 bg-violet/10 px-4 py-2 text-center text-xs text-text/90">
      <span className="font-semibold text-violet">Online demo edition — for browsing.</span> Voice answers use pre-generated ElevenLabs audio.
      The full version (live ElevenLabs voice input, sending drainer tests to your own wallet, recording on Avalanche) runs locally with{" "}
      <code className="font-mono">npm run dev</code> — some wallets warn on this public address because the app demonstrates drainer
      patterns.{" "}
      <a href="https://github.com/kaoi-cyber/sentinel-voice" className="font-semibold text-blue underline" target="_blank" rel="noopener noreferrer">
        Source on GitHub
      </a>
    </div>
  );
}
