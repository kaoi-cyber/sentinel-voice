# Sentinel Voice

AI-powered crypto education + security app for U-Hackathon 2026 (Bangkok, Oct 15–16, 24h build). The owner is a coding beginner — explain decisions simply.

## Commands
- `npm run dev` — dev server on http://localhost:3000
- `npm run build` / `npm run lint` / `npm run typecheck`
- `npm run check:engine` — sanity checks for the security engine and VoiceGuard answer matching (all must PASS)
- `npm run compile:contract` — recompile `contracts/SentinelReportRegistry.sol` → `src/lib/avalanche/registry-artifact.json`
- `npm run check:contract` — contract tests on a local chain (start one first: `npx ganache@7.9.2 --port 8547 --chain.chainId 43113`)

## Stack
Next.js 15 (App Router, `src/`), TypeScript, Tailwind v4 (theme tokens in `src/app/globals.css`), lucide-react, viem (wallet/chain), solc (dev, contract compile).

## Security engine
- `src/lib/security/`: `types.ts` (shared report format — see `docs/report-schema.md`), `engine.ts` (rules → findings → risk level), `abi.ts` (ERC-20 transfer/approve calldata), `reputation.ts` (fictional DEMO data), `scenarios.ts` (3 samples), `explain.ts` (beginner wording), `hash.ts` (SHA-256 report fingerprint).
- UI: `src/components/security/` — `SentinelChecker` (/security, beginner) and `ExpertWorkspace` (/expert, evidence + JSON + paste-your-own).

## VoiceGuard
- `src/lib/voiceguard/knowledge.ts`: prepared, reviewed Q&A (no live LLM — chosen for demo reliability). `answer.ts`: keyword matching, investment-advice guardrail, fallback, and `explainReport()` for Sentinel results.
- UI: `src/components/voiceguard/VoiceGuardChat.tsx` on `/learn`; `/learn?explain=<scenario-id>` opens with that explanation.

## Voice (ElevenLabs)
- Key lives only in `.env.local` (git-ignored; template in `.env.example`). Never ask the user to paste keys in chat.
- Server routes: `src/app/api/voice/{status,speak,transcribe}` → ElevenLabs TTS (`eleven_flash_v2_5`, cached on disk in `.voice-cache/`) and STT (`scribe_v2`). Speak retries with the account's first voice if the default voice 404s.
- Client: `src/lib/voice/player.ts` (single shared speaker, falls back to browser speechSynthesis), `useVoiceInput.ts` (MediaRecorder → transcribe; falls back to Web Speech API), `scripts.ts` (spoken text). `ListenButton` shows "Voice by ElevenLabs" only when ElevenLabs actually played.

## Avalanche (Fuji report registry)
- Contract `contracts/SentinelReportRegistry.sol`: `record(bytes32 hash, string riskLevel)` (rejects duplicates/empty), `verify(bytes32)`. Stores only hash + risk level. Compiled with evmVersion "paris".
- The user's own wallet (Core/MetaMask, EIP-6963) signs deploy + record in the browser (`src/lib/avalanche/wallet.ts`). Never handle private keys.
- `/deploy` (team page, not in nav) deploys once; dev server saves `deployments/fuji.json` after checking the tx on-chain. `REPORT_REGISTRY_ADDRESS` env overrides it.
- API: `/api/avalanche/{config,verify,deployment}`; `AVALANCHE_RPC_URL` env points the server at a local test chain.
- Expert view: `RecordOnAvalanche` + `VerifyReport` (paste JSON → recompute SHA-256 → check registry; detects edits). Reports carry `generated_at`, so every analysis has a unique hash.
- Explorers: Snowtrace testnet + subnets-test.avax.network/c-chain.

## Supply risk (Tokenomist)
- `/supply` (tab next to `/security`; `?token=<id>` auto-runs). Server-only key `TOKENOMIST_API_KEY` in `.env.local`, header `x-api-key`, base `https://api.tokenomist.ai`, v5 endpoints: token/list, allocations/{id}, unlock/events/{id}.
- `src/lib/tokenomist/client.ts`: disk cache `.tokenomist-cache/` (6h), live-access check; falls back to FICTIONAL sample tokens (`samples.ts`: sample-nova high-risk, sample-steady low) — always labelled, never mixed with live data. As of 2026-10-16 the user's key returns 403 "not authorized" on every endpoint (account API access not enabled — ask the Tokenomist mentor).
- `src/lib/supply/engine.ts`: deterministic rules + THRESHOLDS (unlock ≤30d & ≥5% mcap = high, insider-heavy unlock, low float <30%, insider concentration ≥40%, TBD ≥20%). Missing/stale/AI-listed/inconsistent data → unverified/insufficient, never "safe". Every finding cites `source_fields`. Report schema `supply-1.0` with `data_source.data_hash` (SHA-256 of raw Tokenomist data); recordable/verifiable on Avalanche like transaction reports.
- Holder chart colors validated with the dataviz validator against the navy surface.

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
