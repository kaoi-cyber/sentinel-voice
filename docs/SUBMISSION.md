# U-Hackathon 2026 — Submission kit

Copy each block into the matching field of the team1 submission form.
Deadline: **Fri 16 Oct 2026, 14:00 Bangkok time (ICT).**

## Project name
Sentinel Voice

## Track
Web3 (Track 02) — the product is deployed on-chain: our report registry contract on Avalanche Fuji.

## Tagline (one line)
The safety layer for people entering crypto: learn by voice, check before you sign, and prove every report on Avalanche.

## Short description (max 280 characters — this one is 255)
Sentinel Voice is a safety layer for people entering crypto. VoiceGuard teaches by voice (ElevenLabs). Sentinel checks transactions, token risk and AI-agent payments before you sign, and tests wallets against drainers. Every report is sealed on Avalanche.

## Full description
**Problem.** Newcomers lose money because they sign things they don't understand — unlimited approvals, gasless "permit" signatures, look-alike addresses — and fraud has made many people distrust crypto altogether.

**Solution.** One deterministic security engine with four experiences:
- **VoiceGuard AI (education):** ask by voice or text; answers spoken with ElevenLabs; a step-by-step buying guide, a platform security checklist, real price history since 2017, a regular-saving simulator and a safety quiz built with U-bot. It never recommends coins.
- **Sentinel AI (protection):** decodes a transaction and explains it in plain language for beginners, with rule IDs, exact values and sources for experts. A token supply-risk check uses Tokenomist unlock and allocation data.
- **Agent Payment Guard (designed for U-topia agentic payments):** the user sets guardrails; every payment an AI agent proposes is allowed, sent to the user, or blocked, with the reason. The agent's words never override a rule.
- **Sentinel for Wallets (B2B):** a drainer-readiness audit — 7 real drainer techniques sent to a real wallet plus 10 security controls — producing a grade and a prioritised fix list.

**Trust.** Fixed rules decide every verdict; the AI only explains. Every finding cites its rule, value and source; missing data is never treated as safe; sample data is labelled. Each report's SHA-256 fingerprint can be recorded on Avalanche Fuji, and anyone can verify it — change one word and verification fails.

## Links
- **Live demo:** https://kaoi-cyber.github.io/sentinel-voice/
- **Source code:** https://github.com/kaoi-cyber/sentinel-voice
- **Release + demo video (52 s):** https://github.com/kaoi-cyber/sentinel-voice/releases/tag/v1.0.0
- **Smart contract (Avalanche Fuji):** `0x896786725815499db333b2E34d26987Cfb2F4aa0` — https://testnet.snowtrace.io/address/0x896786725815499db333b2E34d26987Cfb2F4aa0
- **Pitch deck:** [paste the deck's share link here]

## Sponsor and partner integrations
| Sponsor | How we use it | Status |
| --- | --- | --- |
| Avalanche | `SentinelReportRegistry` on Fuji stores report fingerprints; record with your own wallet, verify from any browser | Live |
| ElevenLabs | Speech-to-text (Scribe v2) and text-to-speech (Flash v2.5) for VoiceGuard | Live |
| U-topia / U-bot | Safety quiz generated with U-bot's U-Code; Agent Payment Guard designed for U-Pay / U-Bot agentic payments | Built with U-bot; payments API pending |
| Tokenomist | v5 unlock-events and allocations API for supply-risk signals | Code complete; labelled sample data until API access is enabled |

## U-Bot integration (5% of judging)
We used U-bot's U-Code mode to generate the Crypto Safety Quiz (live at /quiz, credited "Built with U-bot"), then reviewed it and integrated it into the product. The Agent Payment Guard is designed as the safety layer for U-topia's U-Bot agentic payments: it checks every payment an agent proposes against the user's guardrails before anything is signed.

## Tech stack
Next.js 15, React 19, TypeScript, Tailwind CSS · deterministic rule engines in TypeScript · viem + Core wallet (EIP-6963) · Solidity 0.8 on Avalanche Fuji · ElevenLabs API · Tokenomist API v5 · Binance public market data · GitHub Pages (static demo edition) · 69 automated engine tests + 8 contract tests.

## How judges can try it
1. Open the live demo on any device (phone works).
2. Home → tap the guardian to hear VoiceGuard (ElevenLabs).
3. Security → the swap-site approval opens as High risk; click through to the expert evidence.
4. For Wallets → `/business/?demo=1` shows a full audit report.
5. Recording on Avalanche needs a desktop browser with Core or MetaMask on Fuji; verifying a report works anywhere.

## Built during the hackathon
All code was written during the 24-hour build window (15–16 Oct 2026); planning and research happened beforehand. AI coding tools were used, which the rules allow.

## Team
[Names and roles of 1–4 team members]
