// The step-by-step buying guide (shown on /learn/start and read aloud by VoiceGuard).
export const STEPS = [
  {
    title: "Learn the basics first",
    text: "Understand what you're buying and that prices can fall a lot. Start with an amount you could lose without it hurting your life.",
    scam: "Anyone promising guaranteed or fast returns is a red flag.",
  },
  {
    title: "Choose a regulated platform",
    text: "Use an exchange that is licensed or registered where you live. Check it with the platform checklist below before sending any money.",
    scam: "Type the address yourself or use the official app — never click exchange links from ads, DMs or emails.",
  },
  {
    title: "Verify your identity and secure the account",
    text: "Regulated platforms ask for ID (KYC). Then turn on an authenticator-app 2FA (not SMS), a strong unique password, and withdrawal-address allow-listing.",
    scam: "Real support staff never ask for your password, 2FA codes or seed phrase.",
  },
  {
    title: "Make a small first purchase",
    text: "Buy a small amount first to learn the process and fees. Avoid instant-buy with a credit card — fees are often highest there.",
    scam: "Ignore 'trading groups' and 'mentors' who tell you what to buy.",
  },
  {
    title: "Consider your own wallet for savings",
    text: "Money left on an exchange depends on that company. For long-term savings, many people move to a wallet they control — ideally a hardware wallet.",
    scam: "Write your seed phrase on paper. Never type it into a website or share it with anyone.",
  },
  {
    title: "Check before you sign",
    text: "Before approving anything in your wallet, run it through Sentinel. Never sign something you don't understand.",
    scam: "'Claim your free airdrop' sites are one of the most common ways wallets get drained.",
  },
];

export function buyingGuideSpeech(): string {
  return STEPS.map((s, i) => `Step ${i + 1}: ${s.title}. ${s.text} Watch out: ${s.scam}`).join(" ");
}
