import { DeployRegistry } from "@/components/avalanche/DeployRegistry";

export const metadata = { title: "Deploy registry — Sentinel Voice" };

// Team tool, not linked from the main navigation.
export default function DeployPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 pt-14 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet">Team setup · Avalanche</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">Deploy the report registry</h1>
      <p className="mt-3 text-muted">
        A one-time step: put the Sentinel report registry contract on the Avalanche Fuji testnet using your own wallet. The
        app never sees your private key — your wallet signs everything.
      </p>
      <div className="glow-card mt-8 rounded-3xl p-6 sm:p-8">
        <DeployRegistry />
      </div>
    </section>
  );
}
