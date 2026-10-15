"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ScanSearch, SendHorizontal, ShieldCheck } from "lucide-react";
import { LogoMark } from "@/components/Logo";
import { analyze } from "@/lib/security/engine";
import { getScenario, SCENARIOS } from "@/lib/security/scenarios";
import { answerQuestion, explainReport, followUpQuestion, fromEntry, type GuideReply } from "@/lib/voiceguard/answer";
import { getEntry, KNOWLEDGE, TOPICS } from "@/lib/voiceguard/knowledge";

type Message = { id: number; role: "user"; text: string } | { id: number; role: "guide"; reply: GuideReply };

const GREETING: GuideReply = {
  kind: "knowledge",
  title: "Hey, I'm VoiceGuard.",
  paragraphs: [
    "New to crypto? Don't worry, I've got you. Ask me a question, pick a topic, or ask me to explain one of Sentinel's security checks.",
    "I teach how things work — I won't tell you what to buy.",
  ],
  followUps: ["what-is-crypto", "what-is-wallet", "what-is-approval"],
};

function scenarioMessages(id: string | null): Message[] {
  const scenario = getScenario(id);
  if (!scenario) return [];
  const report = analyze(scenario.tx, { scenarioId: scenario.id, sample: true });
  return [
    { id: 1, role: "user", text: `Can you explain the “${scenario.title}” check?` },
    { id: 2, role: "guide", reply: explainReport(report) },
  ];
}

export function VoiceGuardChat() {
  const params = useSearchParams();
  const [messages, setMessages] = useState<Message[]>(() => [
    { id: 0, role: "guide", reply: GREETING },
    ...scenarioMessages(params.get("explain")),
  ]);
  const [draft, setDraft] = useState("");
  const threadRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(100);

  useEffect(() => {
    const el = threadRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  function push(userText: string, reply: GuideReply) {
    const id = nextId.current;
    nextId.current += 2;
    setMessages((m) => [...m, { id, role: "user", text: userText }, { id: id + 1, role: "guide", reply }]);
  }

  function askText(text: string) {
    const t = text.trim();
    if (!t) return;
    push(t, answerQuestion(t));
    setDraft("");
  }

  function askEntry(id: string) {
    const entry = getEntry(id);
    if (entry) push(entry.question, fromEntry(entry));
  }

  function explainScenario(id: string) {
    const [user, guide] = scenarioMessages(id);
    if (user?.role === "user" && guide?.role === "guide") push(user.text, guide.reply);
  }

  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_20rem]">
      <div className="glow-card flex flex-col rounded-3xl">
        <div ref={threadRef} className="h-[28rem] space-y-5 overflow-y-auto p-5 sm:h-[34rem] sm:p-6" aria-live="polite">
          {messages.map((m) =>
            m.role === "user" ? (
              <div key={m.id} className="flex justify-end">
                <p className="max-w-[85%] rounded-2xl rounded-br-md bg-blue px-4 py-2.5 text-white">{m.text}</p>
              </div>
            ) : (
              <GuideBubble key={m.id} reply={m.reply} onFollowUp={askEntry} />
            ),
          )}
        </div>

        <form
          className="flex gap-2 border-t border-line/60 p-3 sm:p-4"
          onSubmit={(e) => {
            e.preventDefault();
            askText(draft);
          }}
        >
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Ask about crypto, wallets, scams…"
            aria-label="Your question"
            className="min-w-0 flex-1 rounded-xl border border-line bg-ink/70 px-4 py-3 text-text outline-none placeholder:text-muted focus:border-blue"
          />
          <button
            type="submit"
            disabled={!draft.trim()}
            className="inline-flex items-center gap-2 rounded-xl bg-blue px-4 font-semibold text-white transition hover:bg-blue/85 disabled:opacity-40"
          >
            <SendHorizontal size={18} />
            <span className="hidden sm:inline">Ask</span>
          </button>
        </form>
      </div>

      <aside className="space-y-6">
        <section className="glow-card violet rounded-2xl p-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <ScanSearch size={16} className="text-violet" /> Explain a Sentinel check
          </h2>
          <div className="mt-3 space-y-2">
            {SCENARIOS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => explainScenario(s.id)}
                className="block w-full rounded-xl border border-line bg-ink/40 px-3 py-2 text-left text-sm text-muted transition hover:border-violet/60 hover:text-text"
              >
                {s.title}
              </button>
            ))}
          </div>
        </section>

        <section className="glow-card rounded-2xl p-4">
          <h2 className="text-sm font-semibold">Topics</h2>
          <div className="mt-2 max-h-[22rem] space-y-4 overflow-y-auto pr-1">
            {TOPICS.map((topic) => (
              <div key={topic}>
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gold">{topic}</p>
                <ul className="mt-1.5 space-y-1">
                  {KNOWLEDGE.filter((e) => e.topic === topic).map((e) => (
                    <li key={e.id}>
                      <button
                        type="button"
                        onClick={() => askEntry(e.id)}
                        className="text-left text-sm text-muted transition hover:text-text"
                      >
                        {e.question}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      </aside>
    </div>
  );
}

function GuideBubble({ reply, onFollowUp }: { reply: GuideReply; onFollowUp: (id: string) => void }) {
  return (
    <div className="flex gap-3">
      <LogoMark className="h-8 w-8 shrink-0" />
      <div className="max-w-[90%] rounded-2xl rounded-tl-md border border-line bg-surface-2/80 px-4 py-3">
        {reply.kind === "sentinel" && (
          <span className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-violet/40 bg-violet/10 px-2.5 py-0.5 text-xs text-violet">
            <ShieldCheck size={12} /> Based on Sentinel&apos;s findings · sample transaction
          </span>
        )}
        {reply.kind === "guardrail" && (
          <span className="mb-2 inline-block rounded-full border border-gold/40 bg-gold/10 px-2.5 py-0.5 text-xs text-gold">
            Education only — not financial advice
          </span>
        )}
        <p className="font-semibold">{reply.title}</p>
        {reply.paragraphs.map((p) => (
          <p key={p} className="mt-2 text-text/90">
            {p}
          </p>
        ))}
        {reply.bullets && (
          <ul className="mt-2 space-y-1">
            {reply.bullets.map((b) => (
              <li key={b} className="flex gap-2 text-text/90">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue" />
                {b}
              </li>
            ))}
          </ul>
        )}
        {reply.followUps.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {reply.followUps.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => onFollowUp(id)}
                className="rounded-full border border-blue/40 px-3 py-1 text-xs text-blue transition hover:bg-blue/10"
              >
                {followUpQuestion(id)}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
