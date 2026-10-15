// Quick sanity check for the security engine: `npx tsx scripts/check-engine.ts`
import { analyze } from "../src/lib/security/engine";
import { SCENARIOS } from "../src/lib/security/scenarios";
import { encodeCall, ZERO_ADDRESS } from "../src/lib/security/abi";
import { KNOWN } from "../src/lib/security/reputation";

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

process.exit(failed ? 1 : 0);
