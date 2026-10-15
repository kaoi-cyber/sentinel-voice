# U-bot U-Code prompt — Crypto Safety Quiz

Paste this into u.bot in **U-Code** mode. It builds a small companion app we can link from Sentinel Voice, credited as "Built with U-bot (U-topia)".

---

Build a mobile-friendly single-page web app called "Sentinel Voice — Crypto Safety Quiz".

Style: dark navy background (#060a18), cards in #0d1430, electric blue (#4f7cff) and violet (#8b5cf6) accents, gold (#edb541) highlights, rounded corners, clean sans-serif font.

Behaviour:
- Show one question at a time with 3 answer buttons and a progress bar ("Question 3 of 10").
- After each answer, show whether it was right, plus a one-sentence explanation, then a "Next" button.
- At the end, show the score out of 10, a message ("Crypto Guardian", "Getting there", "Keep learning"), and a "Try again" button.
- No sign-up, no data collection, no external requests.

Questions (correct answer marked *):
1. A support agent DMs you and asks for your 12-word recovery phrase to "fix your account". You… — *Refuse: real support never asks for it / Share it, they're official / Share only the first 6 words. Explanation: Anyone with your recovery phrase controls your wallet; no real company ever asks for it.
2. A site offers a free airdrop if you approve "unlimited USDC". The safest move is… — *Don't approve; free-airdrop approvals are a common drain trick / Approve, it's free / Approve then revoke later. Explanation: Unlimited approvals let the spender take your whole balance, any time.
3. What does an "unlimited token approval" allow? — *The app can move all of that token, now or later / One payment only / Nothing until you click again. Explanation: It lasts until you revoke it.
4. You're asked to sign a "gasless" message to check out. Why be careful? — *Permit signatures can grant spending rights without a transaction / Messages are always harmless / Gasless means free money. Explanation: Permit and Permit2 signatures are a common way wallets get drained.
5. An address in your history matches the first and last characters of your savings wallet. What could it be? — *Address poisoning — check every character / A backup address / A faster route. Explanation: Scammers plant look-alike addresses hoping you copy the wrong one.
6. Best place to type an exchange's website? — *Type it yourself or use the official app / A link from an ad / A link in a DM. Explanation: Cloned exchange sites are a top phishing method.
7. Which 2FA is strongest for an exchange account? — *Authenticator app / SMS code / No 2FA. Explanation: SIM-swap attacks can steal SMS codes.
8. Bitcoin fell about 75% from its 2017 high. What does that teach? — *Crypto can drop sharply; only invest what you can leave untouched / Prices only go up / It means it's a scam. Explanation: Big drops have happened many times.
9. A platform promises a guaranteed 20% monthly return. This is… — *A major red flag / A great deal / Normal for crypto. Explanation: Guaranteed high returns are a classic scam sign.
10. Before signing any wallet request you don't understand, you should… — *Check it with a tool like Sentinel or don't sign / Sign quickly / Ask the website to explain. Explanation: Never sign something you can't read.

Footer: "Educational only — not financial advice. Built with U-bot for Sentinel Voice · U-Hackathon 2026."
