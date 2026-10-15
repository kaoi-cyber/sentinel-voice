# Sentinel Voice

AI-powered crypto education + security app for U-Hackathon 2026 (Bangkok, Oct 15–16, 24h build). The owner is a coding beginner — explain decisions simply.

## Commands
- `npm run dev` — dev server on http://localhost:3000
- `npm run build` / `npm run lint` / `npx tsc --noEmit`

## Stack
Next.js 15 (App Router, `src/`), TypeScript, Tailwind v4 (theme tokens in `src/app/globals.css`), lucide-react. No backend or wallet connection yet.

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
