// Turns a question (or a Sentinel report) into a VoiceGuard reply.
// Deterministic: prepared answers only, so nothing unreviewed is said on stage.
import { RISK_COPY, describeAction, explainFinding, sortFindings } from "@/lib/security/explain";
import type { SecurityReport } from "@/lib/security/types";
import { getEntry, KNOWLEDGE, type KnowledgeEntry } from "./knowledge";

export type GuideReply = {
  kind: "knowledge" | "sentinel" | "guardrail" | "fallback";
  title: string;
  paragraphs: string[];
  bullets?: string[];
  followUps: string[];
};

// Requests for picks or predictions get a clear, friendly boundary.
const ADVICE_PATTERNS = [
  /\bshould i (buy|sell|invest|hold)\b/,
  /\bwhat (coin|token|crypto)s? should\b/,
  /\bwhich (coin|token|crypto)s?\b.*\b(buy|invest)\b/,
  /\b(best|top) (coin|token|crypto|investment)s?\b/,
  /\b(price prediction|predict|will .* (go up|go down|moon|pump|crash))\b/,
  /\bguaranteed?\b/,
  /\bget rich\b/,
];

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s-]/g, " ").replace(/\s+/g, " ").trim();
}

function score(entry: KnowledgeEntry, q: string, words: Set<string>): number {
  let s = 0;
  for (const k of entry.keywords) {
    if (k.includes(" ") || k.includes("-")) {
      if (q.includes(k)) s += 3;
    } else if (words.has(k)) {
      s += 1;
    }
  }
  if (normalize(entry.question) === q) s += 10;
  return s;
}

export const GREETING: GuideReply = {
  kind: "knowledge",
  title: "Hey, I'm VoiceGuard.",
  paragraphs: [
    "New to crypto? Don't worry, I've got you. Ask me a question, pick a topic, or ask me to explain one of Sentinel's security checks.",
    "I teach how things work — I won't tell you what to buy.",
  ],
  followUps: ["what-is-crypto", "what-is-wallet", "what-is-approval"],
};

export function fromEntry(entry: KnowledgeEntry): GuideReply {
  return {
    kind: "knowledge",
    title: entry.question,
    paragraphs: entry.paragraphs,
    bullets: entry.bullets,
    followUps: entry.followUps,
  };
}

export function answerQuestion(text: string): GuideReply {
  const q = normalize(text);

  if (ADVICE_PATTERNS.some((p) => p.test(q))) {
    return {
      kind: "guardrail",
      title: "I can't pick investments for you",
      paragraphs: [
        "I'm not able to tell you what to buy or sell, or predict prices — nobody can do that reliably, and anyone who promises returns is a red flag.",
        "What I can do is help you understand how things work, so you can make your own informed decisions.",
      ],
      followUps: ["long-term", "volatility", "common-scams"],
    };
  }

  const words = new Set(q.split(" "));
  const best = KNOWLEDGE.map((e) => ({ e, s: score(e, q, words) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)[0];

  if (best) return fromEntry(best.e);

  return {
    kind: "fallback",
    title: "I don't have an answer for that yet",
    paragraphs: [
      "I'm still learning, and I only answer questions I've been carefully prepared for — I'd rather say “I don't know” than guess about your money.",
      "Here are some things I can help with:",
    ],
    followUps: ["what-is-crypto", "what-is-approval", "common-scams"],
  };
}

/** Explains a Sentinel report the way a friend would. */
export function explainReport(report: SecurityReport): GuideReply {
  const action = describeAction(report);
  return {
    kind: "sentinel",
    title: `Sentinel says: ${RISK_COPY[report.risk_level].label}`,
    paragraphs: [
      `${RISK_COPY[report.risk_level].headline} This transaction ${action[0].toLowerCase()}${action.slice(1)}`,
      ...sortFindings(report.findings)
        .filter((f) => f.severity !== "info")
        .map((f) => explainFinding(f, report)),
      `What to do: ${report.recommended_action}`,
    ],
    followUps: report.decoded.kind === "approve" ? ["what-is-approval", "revoke-approval"] : ["common-scams"],
  };
}

export function followUpQuestion(id: string): string {
  return getEntry(id)?.question ?? id;
}
