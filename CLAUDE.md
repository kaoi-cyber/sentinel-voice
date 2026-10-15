# Sentinel Voice

AI-powered crypto education + security app for U-Hackathon 2026 (Bangkok, Oct 15–16, 24h build). The owner is a coding beginner — explain decisions simply.

## Commands
- `npm run dev` — dev server on http://localhost:3000
- `npm run build` / `npm run lint` / `npm run typecheck`
- `npm run check:engine` — sanity checks for the security engine and VoiceGuard answer matching (all must PASS)

## Stack
Next.js 15 (App Router, `src/`), TypeScript, Tailwind v4 (theme tokens in `src/app/globals.css`), lucide-react. No backend or wallet connection yet.

## Security engine
- `src/lib/security/`: `types.ts` (shared report format — see `docs/report-schema.md`), `engine.ts` (rules → findings → risk level), `abi.ts` (ERC-20 transfer/approve calldata), `reputation.ts` (fictional DEMO data), `scenarios.ts` (3 samples), `explain.ts` (beginner wording), `hash.ts` (SHA-256 report fingerprint).
- UI: `src/components/security/` — `SentinelChecker` (/security, beginner) and `ExpertWorkspace` (/expert, evidence + JSON + paste-your-own).

## VoiceGuard
- `src/lib/voiceguard/knowledge.ts`: prepared, reviewed Q&A (no live LLM — chosen for demo reliability). `answer.ts`: keyword matching, investment-advice guardrail, fallback, and `explainReport()` for Sentinel results.
- UI: `src/components/voiceguard/VoiceGuardChat.tsx` on `/learn`; `/learn?explain=<scenario-id>` opens with that explanation.

## Voice (ElevenLabs)
- Key lives only in `.env.local` (git-ignored; template in `.env.example`). Never ask the user to paste keys in chat.
- Server routes: `src/app/api/voice/{status,speak,transcribe}` → ElevenLabs TTS (`eleven_multilingual_v2`) and STT (`scribe_v2`). Speak retries with the account's first voice if the default voice 404s.
- Client: `src/lib/voice/player.ts` (single shared speaker, falls back to browser speechSynthesis), `useVoiceInput.ts` (MediaRecorder → transcribe; falls back to Web Speech API), `scripts.ts` (spoken text). `ListenButton` shows "Voice by ElevenLabs" only when ElevenLabs actually played.

## Product
- One shared deterministic security engine; AI only *explains* its findings, never invents verdicts.
- Layer 1 **VoiceGuard AI** (`/learn`): beginner education — crypto, wallets, volatility, tokenomics, scams; voice.
- Layer 2 **Sentinel AI** (`/security`) + expert dashboard (`/expert`): transaction/approval checks, rule IDs, evidence, report hash on Avalanche Fuji.
- Demo scenarios: ordinary transfer, unlimited token approval, unknown spender. Label mocks as samples.
- Never give investment advice or promise profits.

## Sponsors (exactly six)
Avalanche (Fuji report-hash registry), ElevenLabs (voice), U-bot (AI assistant), Tokenomist (tokenomics API), DTV Group and U-topia (roles unconfirmed). ChainShield AI is NOT a sponsor — don't list it. Never claim an integration is done until it is.

## Design
U-Hackathon palette: deep navy `ink`, electric `blue`, `violet`, `gold` highlight.
