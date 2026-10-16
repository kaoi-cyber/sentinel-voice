// Writes src/lib/guard/precomputed.json: what Sentinel's detector reads from each simulated agent
// request. The public GitHub Pages demo uses it instead of carrying the requests themselves.
// Run after changing src/lib/guard/scenarios.ts: `npm run guard:precompute` (check:engine verifies it).
import { writeFileSync } from "node:fs";
import path from "node:path";
import { intentFacts } from "../src/lib/guard/engine";
import { AGENT_QUEUE, CONTACTS } from "../src/lib/guard/scenarios";

const facts = Object.fromEntries(AGENT_QUEUE.map((i) => [i.id, intentFacts({ ...i, precomputed: undefined }, CONTACTS)]));
writeFileSync(path.join(__dirname, "..", "src/lib/guard/precomputed.json"), JSON.stringify(facts, null, 2) + "\n");
console.log(`precomputed ${Object.keys(facts).length} intents`);
