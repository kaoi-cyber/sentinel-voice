"use client";

import { useState } from "react";
import { CheckCircle2, Circle } from "lucide-react";
import { ListenButton } from "@/components/voice/ListenButton";
import { STEPS, buyingGuideSpeech } from "@/lib/learn/guide";


const CHECKLIST = [
  { id: "license", text: "Licensed or registered with the financial regulator in my country (I checked the regulator's own website)" },
  { id: "reserves", text: "Publishes regular proof-of-reserves, ideally checked by an independent firm" },
  { id: "cold", text: "Keeps most customer funds in cold storage and explains its security publicly" },
  { id: "2fa", text: "Supports authenticator-app 2FA and withdrawal-address allow-listing" },
  { id: "history", text: "Has a long track record, and handled any past hacks openly and reimbursed users" },
  { id: "withdraw", text: "Lets me withdraw to my own wallet at any time, with clear fees" },
  { id: "support", text: "Has real support channels — and warns that it never DMs first or asks for seed phrases" },
  { id: "no-yield", text: "Doesn't promise unusually high fixed 'interest' on deposits" },
];

const SAVINGS_RULES = [
  { title: "Emergency fund first", text: "Keep several months of expenses in ordinary savings before putting money into crypto." },
  { title: "Only what you can leave alone", text: "Prices move a lot in both directions. Only save money you won't need for years." },
  { title: "Small and regular", text: "Saving a fixed small amount every month spreads out your buying price instead of betting on timing." },
  { title: "Don't put everything in one place", text: "Spread risk across assets — and keep most of your savings outside crypto." },
  { title: "Own your keys for the long term", text: "Exchanges can freeze, fail or be hacked. A wallet you control removes that company risk." },
  { title: "Stablecoins aren't savings accounts", text: "They aim to track a currency, but can lose their peg and aren't bank-insured. 'High yield' on them carries real risk." },
];

export function BuyingGuide() {
  const speech = buyingGuideSpeech();
  return (
    <div>
      <ListenButton id="buying-guide" text={speech} label="Read the guide to me" />
      <ol className="mt-4 space-y-3">
        {STEPS.map((s, i) => (
          <li key={s.title} className="flex gap-4 rounded-2xl border border-line bg-ink/30 p-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue/20 font-bold text-blue">{i + 1}</span>
            <div>
              <p className="font-semibold">{s.title}</p>
              <p className="mt-1 text-sm text-text/90">{s.text}</p>
              <p className="mt-2 text-sm text-gold">⚠ {s.warning}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function PlatformChecklist() {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const n = Object.values(checked).filter(Boolean).length;
  const verdict =
    n === CHECKLIST.length
      ? { text: "Passes every check — still start small.", cls: "text-safe" }
      : n >= 6
        ? { text: "Mostly good — find out why the unchecked items are missing before depositing.", cls: "text-gold" }
        : { text: "Too many unknowns — keep looking, or ask questions before trusting it with money.", cls: "text-danger" };

  return (
    <div>
      <p className="text-sm text-muted">
        We don&apos;t list &quot;safe exchanges&quot; — platforms that looked safe have collapsed overnight. Instead, check any platform yourself:
      </p>
      <ul className="mt-4 space-y-2">
        {CHECKLIST.map((c) => (
          <li key={c.id}>
            <button
              type="button"
              onClick={() => setChecked({ ...checked, [c.id]: !checked[c.id] })}
              aria-pressed={!!checked[c.id]}
              className="flex w-full items-start gap-3 rounded-xl border border-line bg-ink/30 p-3 text-left text-sm transition hover:border-blue/50"
            >
              {checked[c.id] ? <CheckCircle2 size={18} className="shrink-0 text-safe" /> : <Circle size={18} className="shrink-0 text-muted" />}
              {c.text}
            </button>
          </li>
        ))}
      </ul>
      <p className={`mt-4 font-semibold ${verdict.cls}`}>
        {n}/{CHECKLIST.length} — {verdict.text}
      </p>
    </div>
  );
}

export function SavingsRules() {
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {SAVINGS_RULES.map((r) => (
        <li key={r.title} className="rounded-2xl border border-line bg-ink/30 p-4">
          <p className="font-semibold">{r.title}</p>
          <p className="mt-1 text-sm text-muted">{r.text}</p>
        </li>
      ))}
    </ul>
  );
}
