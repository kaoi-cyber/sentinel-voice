// Generates ElevenLabs audio for every prepared voice line into public/voice/, so the static
// GitHub Pages edition plays the real ElevenLabs voice without exposing an API key.
// Reuses audio already cached by the local app (free). Run: `npm run voice:pack` (add --dry to just count).
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { analyze } from "../src/lib/security/engine";
import { SCENARIOS } from "../src/lib/security/scenarios";
import { analyzeSupply } from "../src/lib/supply/engine";
import { supplySpeech } from "../src/lib/supply/explain";
import { SAMPLES, sampleSnapshot } from "../src/lib/tokenomist/samples";
import { buyingGuideSpeech } from "../src/lib/learn/guide";
import { GREETING_TEXT } from "../src/lib/voice/greeting";
import { expertSummary, replyToSpeech } from "../src/lib/voice/scripts";
import { voiceKey } from "../src/lib/voice/voicePack";
import { answerQuestion, explainReport, fromEntry, GREETING } from "../src/lib/voiceguard/answer";
import { KNOWLEDGE } from "../src/lib/voiceguard/knowledge";

const root = path.join(__dirname, "..");
const OUT = path.join(root, "public", "voice");
const dry = process.argv.includes("--dry");

function env(name: string): string | undefined {
  const line = readFileSync(path.join(root, ".env.local"), "utf8").split("\n").find((l) => l.startsWith(name + "="));
  return line?.slice(name.length + 1).trim() || undefined;
}

function texts(): string[] {
  const t = [GREETING_TEXT, replyToSpeech(GREETING), buyingGuideSpeech()];
  for (const e of KNOWLEDGE) t.push(replyToSpeech(fromEntry(e)));
  t.push(replyToSpeech(answerQuestion("should I buy bitcoin")), replyToSpeech(answerQuestion("tell me a joke")));
  for (const s of SCENARIOS) {
    const r = analyze(s.tx, { scenarioId: s.id, sample: true });
    t.push(replyToSpeech(explainReport(r)), expertSummary(r));
  }
  for (const id of Object.keys(SAMPLES)) t.push(supplySpeech(analyzeSupply(sampleSnapshot(id, "sample", new Date())!, { dataHash: "0x" })));
  return [...new Set(t)];
}

async function main() {
  const key = env("ELEVENLABS_API_KEY");
  const voiceId = env("ELEVENLABS_VOICE_ID") || "JBFqnCBsd6RMkjVDRZzb";
  const model = env("ELEVENLABS_TTS_MODEL") || "eleven_flash_v2_5";
  mkdirSync(OUT, { recursive: true });

  const all = texts();
  const keys: string[] = [];
  let reused = 0;
  let toGenerate = 0;
  let chars = 0;
  for (const text of all) {
    const k = await voiceKey(text);
    keys.push(k);
    const file = path.join(OUT, `${k}.mp3`);
    if (existsSync(file)) continue;
    const cached = path.join(root, ".voice-cache", createHash("sha256").update(`${voiceId}|${model}|${text}`).digest("hex") + ".mp3");
    if (existsSync(cached)) {
      if (!dry) writeFileSync(file, readFileSync(cached));
      reused++;
      continue;
    }
    toGenerate++;
    chars += text.length;
    if (dry) continue;
    if (!key) throw new Error("ELEVENLABS_API_KEY missing in .env.local");
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`, {
      method: "POST",
      headers: { "xi-api-key": key, "Content-Type": "application/json", Accept: "audio/mpeg" },
      body: JSON.stringify({ text, model_id: model }),
    });
    if (!res.ok) throw new Error(`ElevenLabs ${res.status}: ${(await res.text()).slice(0, 200)}`);
    writeFileSync(file, new Uint8Array(await res.arrayBuffer()));
    console.log(`generated ${k} (${text.length} chars): ${text.slice(0, 60)}…`);
  }
  console.log(`${all.length} lines · ${reused} reused from local cache · ${toGenerate} ${dry ? "to generate" : "generated"} (${chars} characters)`);
  if (!dry) {
    writeFileSync(path.join(OUT, "manifest.json"), JSON.stringify({ voice: voiceId, model, generated_at: new Date().toISOString(), keys }, null, 2) + "\n");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
