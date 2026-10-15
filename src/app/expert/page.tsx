import { Suspense } from "react";
import { ExpertWorkspace } from "@/components/security/ExpertWorkspace";

export const metadata = { title: "Expert Dashboard — Sentinel Voice" };

export default function ExpertPage() {
  return (
    <section className="mx-auto max-w-6xl px-4 pt-14 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet">Expert workspace</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-5xl">Give me evidence, not just a warning.</h1>
      <p className="mt-3 max-w-2xl text-muted">
        Decoded calldata, rule IDs, evidence and a fingerprinted JSON report — the same findings the beginner view
        explains in plain language.
      </p>
      <Suspense>
        <ExpertWorkspace />
      </Suspense>
    </section>
  );
}
