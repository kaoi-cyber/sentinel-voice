// Sanity checks for the security engine and VoiceGuard answers: `npm run check:engine`
import { analyze } from "../src/lib/security/engine";
import { SCENARIOS } from "../src/lib/security/scenarios";
import { encodeCall, ZERO_ADDRESS } from "../src/lib/security/abi";
import { KNOWN } from "../src/lib/security/reputation";
import { answerQuestion } from "../src/lib/voiceguard/answer";
import { getEntry, KNOWLEDGE } from "../src/lib/voiceguard/knowledge";

let failed = 0;
function expect(name: string, got: string, want: string) {
  const ok = got === want;
  if (!ok) failed++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}: ${got}${ok ? "" : ` (expected ${want})`}`);
}

for (const s of SCENARIOS) {
  const r = analyze(s.tx, { scenarioId: s.id, sample: true });
  expect(s.id, r.risk_level, s.expected);
  console.log("      rules:", r.findings.map((f) => f.rule_id).join(", "));
}

const base = { chain_id: 43113, from: null, to: KNOWN.usdc, value: "0" };
expect("garbage calldata", analyze({ ...base, data: "0xdeadbeef" }).risk_level, "insufficient");
expect("empty calldata", analyze({ ...base, data: "" }).risk_level, "insufficient");
expect("transfer to zero address", analyze({ ...base, data: encodeCall("transfer", ZERO_ADDRESS, 1n) }).risk_level, "high");
expect("unknown token", analyze({ ...base, to: KNOWN.unknownSpender, data: encodeCall("transfer", KNOWN.savings, 5n) }).risk_level, "unverified");
expect("AVAX attached to transfer", analyze({ ...base, value: "1000000000000000000", data: encodeCall("transfer", KNOWN.savings, 5n) }).risk_level, "medium");
expect("unlimited + unknown spender", analyze({ ...base, data: encodeCall("approve", KNOWN.unknownSpender, 1n << 200n) }).risk_level, "high");

console.log("\nVoiceGuard");
const asks: [string, string][] = [
  ["What is Bitcoin?", "What is Bitcoin?"],
  ["what's a seed phrase", "What is a seed phrase and how do I keep it safe?"],
  ["is this airdrop a scam?", "Is a free airdrop safe to claim?"],
  ["why is unlimited approval bad", "Why is an unlimited approval risky?"],
  ["how do I revoke an approval", "How do I cancel (revoke) an approval?"],
  ["what are token unlocks", "What are token unlocks?"],
  ["Should I buy bitcoin now?", "I can't pick investments for you"],
  ["will solana go up next week", "I can't pick investments for you"],
  ["what's the best coin to invest in", "I can't pick investments for you"],
  ["tell me a joke", "I don't have an answer for that yet"],
];
for (const [q, want] of asks) expect(`"${q}"`, answerQuestion(q).title, want);
const broken = KNOWLEDGE.flatMap((e) => e.followUps.filter((id) => !getEntry(id)).map((id) => `${e.id} -> ${id}`));
expect("all follow-up links exist", broken.join(", ") || "ok", "ok");

process.exit(failed ? 1 : 0);
