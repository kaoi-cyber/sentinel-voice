# Sentinel Voice — project log

A record of how the project was built during U-Hackathon 2026 (FLOW Summit, Bangkok, 15–16 Oct 2026), the decisions taken and why. Written with Claude Code.

## Links
- Live demo (browsing edition): https://kaoi-cyber.github.io/sentinel-voice/
- Code: https://github.com/kaoi-cyber/sentinel-voice — release v1.0.0
- Demo video: https://www.youtube.com/watch?v=tWUdH5AgPv4
- Avalanche Fuji registry: `0x896786725815499db333b2E34d26987Cfb2F4aa0`
- Submission kit: `docs/SUBMISSION.md` · brand assets: `docs/brand/`

## Timeline
| When | What was built |
| --- | --- |
| 15 Oct | Plan from earlier ChatGPT chats; Next.js app; landing page (hackathon palette: navy, blue, violet, gold) |
| 15 Oct | Security engine + shared report format; Sentinel beginner and expert views |
| 15 Oct | VoiceGuard prepared answers + investment-advice guardrail |
| 15 Oct | ElevenLabs voice (speech in/out, cache, browser fallback); key in `.env.local` only |
| 15 Oct | Avalanche registry contract, tested on a local chain, deployed to Fuji with the user's Core wallet; record + verify + tamper test |
| 16 Oct | Tokenomist supply-risk check (v5 API; key returned 403 → labelled sample tokens) |
| 16 Oct | Sentinel for Wallets (drainer test pack, controls, grade); VoiceGuard "Start safely" (buying guide, platform checklist, real Binance price history, saving simulator) |
| 16 Oct | Agent Payment Guard (designed for U-topia); quiz generated with U-bot; background images; spoken home greeting |
| 16 Oct | GitHub repo + release, demo video/GIF, GitHub Pages edition with pre-generated ElevenLabs voice pack |
| 16 Oct | Wording rules applied; drainer payloads removed from the public build; logo v2, cover, screenshots; submitted before 14:00 |

## Key decisions and why
- **Rules decide, AI explains.** Verdicts come from deterministic, tested rules so nothing is invented; every finding cites its rule, value and source.
- **Prepared answers instead of a live LLM** for VoiceGuard: reliable on stage, no wrong confident answers about money.
- **No coin picks, no named "safe" exchanges** — education and a checklist instead.
- **Wording rules (from the owner):** describe deceptive schemes only as fraud, tricks or fakes; never show crypto price falls or crash figures.
- **Keys never leave the server; the user's wallet signs every on-chain action.**
- **Two editions:** the full app runs locally (`npm run dev`) and is used for presenting; the GitHub Pages edition is for browsing. Core's security check (Blockaid) flagged the public address because the app demonstrated drainer patterns, so the public build leaves those payloads out and the Payment Guard there uses precomputed detector facts (tested to match).
- **Honest status for sponsors:** Avalanche and ElevenLabs live; U-bot used to build the quiz and Payment Guard designed for U-topia (API pending); Tokenomist coded, sample data until API access; DTV Group unconfirmed.

## Documents
- Presentation defence guide and "Explained Simply" guide (Claude Docs).
- Pitch deck (Slides artifact) — share it before presenting from another device.
- `CLAUDE.md` — technical notes for future Claude Code sessions.

## Open items
- Report the Core/Blockaid false positive for `kaoi-cyber.github.io`.
- Ask Tokenomist to enable API access; ask U-topia about a U-Pay / U-Bot API; confirm DTV Group's role.

## Full conversation
- The whole build conversation (15–26 Oct 2026) is the Claude Code session **"Sentinel Voice"**, in the "Sentinel Voice" sidebar group of the Claude desktop app.
- A private copy is saved at `archive/sentinel-voice-conversation-2026-10-26.zip` (on this computer only; git-ignored, never pushed).
