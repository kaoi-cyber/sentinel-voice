"use client";

import { FlaskConical } from "lucide-react";
import { SCENARIOS } from "@/lib/security/scenarios";

type Props = {
  selected: string | null;
  onSelect: (id: string) => void;
  extra?: { id: string; title: string; story: string };
};

export function ScenarioPicker({ selected, onSelect, extra }: Props) {
  const items = extra ? [...SCENARIOS, extra] : SCENARIOS;
  return (
    <div>
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted">
        <FlaskConical size={14} /> Sample transactions
      </p>
      <div role="radiogroup" aria-label="Choose a transaction" className={`mt-3 grid gap-3 sm:grid-cols-2 ${extra ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}>
        {items.map((s) => {
          const active = s.id === selected;
          return (
            <button
              key={s.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onSelect(s.id)}
              className={`rounded-2xl border p-4 text-left transition ${
                active
                  ? "border-blue bg-blue/10 shadow-[0_0_30px_-10px_rgb(79_124_255/0.7)]"
                  : "border-line bg-surface/60 hover:border-blue/50"
              }`}
            >
              <span className="font-semibold">{s.title}</span>
              <span className="mt-1 block text-sm text-muted">{s.story}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
