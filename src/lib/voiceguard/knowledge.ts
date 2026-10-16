// VoiceGuard's prepared answers. Written for beginners, reviewed for accuracy,
// and education only — never tells anyone what to buy or predicts prices.
// Step 5 (ElevenLabs) will read `paragraphs` aloud, so keep them speakable.

export type Topic = "Getting started" | "Basics" | "Wallets" | "Security" | "Investing" | "Tokenomics";

export type KnowledgeEntry = {
  id: string;
  topic: Topic;
  question: string;
  /** Words or phrases that suggest this question. Phrases score higher. */
  keywords: string[];
  paragraphs: string[];
  bullets?: string[];
  followUps: string[];
};

export const TOPICS: Topic[] = ["Getting started", "Basics", "Wallets", "Security", "Investing", "Tokenomics"];

export const KNOWLEDGE: KnowledgeEntry[] = [
  // ── Getting started ─────────────────────────────────────────────────────
  {
    id: "how-to-buy",
    topic: "Getting started",
    question: "How do I buy crypto safely?",
    keywords: ["buy", "buy crypto", "how to buy", "purchase", "get started", "start investing", "first crypto"],
    paragraphs: [
      "Start with a regulated exchange in your country, verify your identity, and turn on app-based two-factor authentication. Then buy a small amount first to learn how it works.",
      "For long-term savings, many people move their crypto to a wallet they control. The Start safely page walks you through every step, with the trick to watch for at each one.",
    ],
    bullets: ["Type the exchange address yourself — never click links from ads or DMs", "Only use money you could afford to lose"],
    followUps: ["choose-platform", "what-is-wallet", "regular-saving"],
  },
  {
    id: "choose-platform",
    topic: "Getting started",
    question: "How do I know if an exchange is safe?",
    keywords: ["exchange", "platform", "safe exchange", "secure platform", "which exchange", "trust exchange", "binance", "coinbase", "kraken"],
    paragraphs: [
      "I don't name 'safe' exchanges — some that looked safe have collapsed overnight. Instead, check any platform yourself.",
      "Look for a licence from your country's financial regulator, regular proof-of-reserves, strong account security, a long clean track record, and easy withdrawals to your own wallet.",
    ],
    bullets: ["Be wary of platforms promising high fixed interest", "Real support never DMs you first or asks for your seed phrase"],
    followUps: ["how-to-buy", "common-fraud", "seed-phrase"],
  },
  {
    id: "stablecoins",
    topic: "Getting started",
    question: "Are stablecoins a safe place to save?",
    keywords: ["stablecoin", "stablecoins", "usdc", "usdt", "tether", "stable", "yield", "interest"],
    paragraphs: [
      "Stablecoins aim to stay worth one dollar, but they're not bank accounts. They aren't government-insured, and some have lost their peg in the past.",
      "Be very careful with platforms offering high 'interest' on stablecoins — high yield always means high risk.",
    ],
    followUps: ["choose-platform", "regular-saving", "common-fraud"],
  },
  {
    id: "regular-saving",
    topic: "Getting started",
    question: "How can I build savings in crypto carefully?",
    keywords: ["save", "savings", "saving", "build savings", "monthly", "regularly", "secure way", "safely invest"],
    paragraphs: [
      "Many careful savers keep an emergency fund in ordinary savings first, then put a small fixed amount into crypto each month instead of trying to time the market.",
      "Prices move a lot in both directions, so only save what you could leave untouched for years — and keep most of your savings outside crypto. The savings simulator on the Start safely page shows how regular saving has worked over time.",
    ],
    followUps: ["long-term", "volatility", "stablecoins"],
  },

  // ── Basics ──────────────────────────────────────────────────────────────
  {
    id: "what-is-crypto",
    topic: "Basics",
    question: "What is cryptocurrency?",
    keywords: ["cryptocurrency", "crypto", "what is crypto", "digital money", "digital currency"],
    paragraphs: [
      "Cryptocurrency is digital money that isn't issued or controlled by a bank or government. Instead, a network of computers around the world keeps track of who owns what.",
      "That shared record is called a blockchain. Because everyone can check it, you can send value to anyone online without a middleman — but it also means there's usually no one to call if something goes wrong.",
    ],
    followUps: ["what-is-blockchain", "what-is-bitcoin", "what-is-wallet"],
  },
  {
    id: "what-is-bitcoin",
    topic: "Basics",
    question: "What is Bitcoin?",
    keywords: ["bitcoin", "btc", "satoshi"],
    paragraphs: [
      "Bitcoin was the first cryptocurrency, launched in 2009. It was designed as money that no single company or government controls.",
      "Its rules cap the total supply at 21 million coins, which is one reason some people compare it to digital gold. Its price can still swing a lot, up or down.",
    ],
    followUps: ["what-is-blockchain", "volatility", "long-term"],
  },
  {
    id: "what-is-blockchain",
    topic: "Basics",
    question: "What is a blockchain?",
    keywords: ["blockchain", "block chain", "ledger", "how does crypto work", "decentralized"],
    paragraphs: [
      "A blockchain is a shared record book. Every few seconds or minutes, new transactions are grouped into a “block” and added to the end of the chain.",
      "Thousands of computers keep copies and agree on what's valid, so it's extremely hard for anyone to secretly change past records. That's also why transactions can't easily be reversed.",
    ],
    followUps: ["what-is-avalanche", "gas-fees", "what-is-wallet"],
  },
  {
    id: "what-is-avalanche",
    topic: "Basics",
    question: "What is Avalanche?",
    keywords: ["avalanche", "avax", "fuji", "c-chain", "testnet"],
    paragraphs: [
      "Avalanche is a blockchain network built for fast, low-cost transactions. Its native coin is AVAX, which pays the network fees.",
      "Developers practise on Fuji, Avalanche's test network, where the coins are free and have no real value. Sentinel Voice uses Fuji to record a fingerprint of each security report, so anyone can check a report hasn't been changed.",
    ],
    followUps: ["gas-fees", "what-is-blockchain", "how-sentinel-works"],
  },
  {
    id: "gas-fees",
    topic: "Basics",
    question: "What are gas fees?",
    keywords: ["gas", "gas fee", "fees", "transaction fee", "network fee"],
    paragraphs: [
      "A gas fee is a small payment to the network for processing your transaction. It goes to the computers that keep the blockchain running, not to the app you're using.",
      "Fees change with how busy the network is. Even an approval — which doesn't move any tokens — costs gas, because it still changes the blockchain's records.",
    ],
    followUps: ["what-is-approval", "what-is-avalanche"],
  },

  // ── Wallets ─────────────────────────────────────────────────────────────
  {
    id: "what-is-wallet",
    topic: "Wallets",
    question: "What is a crypto wallet?",
    keywords: ["wallet", "metamask", "core wallet", "hot wallet", "cold wallet", "hardware wallet"],
    paragraphs: [
      "A crypto wallet doesn't actually hold your coins — they live on the blockchain. The wallet holds your keys: the secret that proves you own them and lets you approve transactions.",
      "Hot wallets are apps on your phone or browser: convenient, but online. Cold or hardware wallets keep your keys offline, which is safer for larger amounts.",
    ],
    bullets: ["Whoever has your keys controls your crypto", "Your wallet asks you to sign every transaction — read before you sign"],
    followUps: ["seed-phrase", "what-is-approval"],
  },
  {
    id: "seed-phrase",
    topic: "Wallets",
    question: "What is a seed phrase and how do I keep it safe?",
    keywords: ["seed phrase", "recovery phrase", "secret phrase", "private key", "12 words", "24 words", "mnemonic"],
    paragraphs: [
      "Your seed phrase — usually 12 or 24 words — is the master key to your wallet. Anyone who has it can take everything, from anywhere in the world.",
      "No real company, support agent or app will ever ask for it. If someone does, it's fraud.",
    ],
    bullets: [
      "Write it on paper and store it somewhere safe and private",
      "Never type it into a website, chat or form",
      "Never take a screenshot or store it in the cloud",
    ],
    followUps: ["common-fraud", "what-is-wallet"],
  },

  // ── Security ────────────────────────────────────────────────────────────
  {
    id: "what-is-approval",
    topic: "Security",
    question: "What is a token approval?",
    keywords: ["approval", "approve", "allowance", "permission", "spend my tokens", "spender"],
    paragraphs: [
      "An approval gives an app permission to move a certain token from your wallet. Apps like exchanges need it so they can swap tokens for you.",
      "The permission stays in place after you leave the website — until you use it up or cancel it. That's why it matters who you approve, and for how much.",
    ],
    followUps: ["unlimited-approval", "revoke-approval", "how-sentinel-works"],
  },
  {
    id: "unlimited-approval",
    topic: "Security",
    question: "Why is an unlimited approval risky?",
    keywords: ["unlimited", "unlimited approval", "infinite approval", "max approval", "unlimited allowance"],
    paragraphs: [
      "With an unlimited approval, the app can move all of that token from your wallet — today, or any time in the future — without asking again.",
      "If the app is ever hacked, or was fraudulent all along, your whole balance of that token could be taken. A safer habit is to approve only the amount you need right now.",
    ],
    followUps: ["revoke-approval", "airdrop-safety", "what-is-approval"],
  },
  {
    id: "revoke-approval",
    topic: "Security",
    question: "How do I cancel (revoke) an approval?",
    keywords: ["revoke", "approval", "cancel approval", "remove approval", "undo approval", "remove permission"],
    paragraphs: [
      "You can cancel an approval by sending a new approval for that same app with an amount of zero. Some wallets have a permissions screen that does this for you.",
      "Approval-checker tools such as Revoke.cash list the approvals your wallet has given. Revoking costs a small gas fee, and it's a good habit to clean up approvals you no longer use.",
    ],
    followUps: ["unlimited-approval", "gas-fees"],
  },
  {
    id: "common-fraud",
    topic: "Security",
    question: "What are the most common crypto tricks to avoid?",
    keywords: ["fraud", "phishing", "rug pull", "fake", "hack", "stolen", "trick", "tricks", "avoid"],
    paragraphs: ["Most crypto fraud doesn't break the technology — it tricks people into handing over access."],
    bullets: [
      "Fake airdrops or giveaways that ask you to connect your wallet and approve tokens",
      "Look-alike websites and links that copy real apps",
      "Fake “support” accounts asking for your seed phrase",
      "Anyone promising guaranteed or very high returns",
      "Online friends or romantic contacts who steer you toward an investment platform",
    ],
    followUps: ["airdrop-safety", "seed-phrase", "unlimited-approval"],
  },
  {
    id: "airdrop-safety",
    topic: "Security",
    question: "Is a free airdrop safe to claim?",
    keywords: ["airdrop", "fake", "fake airdrop", "free tokens", "giveaway", "claim", "free crypto", "reward"],
    paragraphs: [
      "Some airdrops are real, but “claim your free tokens” is also one of the most common traps. The fake site asks you to approve your tokens, then drains them.",
      "Only use links from a project's official website or verified accounts, and be very wary if claiming something free asks for an approval. That's exactly what Sentinel checks for.",
    ],
    followUps: ["unlimited-approval", "how-sentinel-works", "common-fraud"],
  },
  {
    id: "how-sentinel-works",
    topic: "Security",
    question: "How does Sentinel check a transaction?",
    keywords: ["sentinel", "how does this work", "check transaction", "security check", "how do you check"],
    paragraphs: [
      "Sentinel reads what a transaction would actually do — for example, which token it touches, who gets permission, and how much — and runs it through a fixed set of security rules.",
      "Because the rules are fixed, the same transaction always gets the same answer. I just explain those results in plain language. Sentinel can't guarantee something is safe; it shows you what it checked and what it didn't.",
    ],
    followUps: ["what-is-approval", "what-is-avalanche"],
  },

  // ── Investing (education only) ──────────────────────────────────────────
  {
    id: "volatility",
    topic: "Investing",
    question: "Why do crypto prices move so much?",
    keywords: ["volatility", "volatile", "price", "prices", "pump", "go up", "go down", "swing"],
    paragraphs: [
      "Crypto prices can move by large amounts in days or even hours. Markets are young, trade 24/7, and are driven heavily by news, sentiment and speculation.",
      "Smaller tokens tend to swing even more than Bitcoin. Past moves are no guarantee of what comes next.",
    ],
    followUps: ["long-term", "tokenomics"],
  },
  {
    id: "long-term",
    topic: "Investing",
    question: "How does long-term crypto investing work?",
    keywords: ["invest", "investing", "investment", "long term", "long-term", "hodl", "dca", "dollar cost"],
    paragraphs: [
      "Long-term investing means holding an asset for years rather than trading it day to day. Some people buy a fixed amount on a regular schedule — called dollar-cost averaging — so they don't have to time the market.",
      "Crypto is high-risk. A common principle is to only put in what you could afford to lose entirely, and to understand what you're buying first. I can explain concepts, but I can't tell you what to buy.",
    ],
    followUps: ["volatility", "tokenomics", "common-fraud"],
  },

  // ── Tokenomics ──────────────────────────────────────────────────────────
  {
    id: "tokenomics",
    topic: "Tokenomics",
    question: "What is tokenomics?",
    keywords: ["tokenomics", "token economics", "supply", "circulating supply", "max supply", "market cap", "inflation"],
    paragraphs: [
      "Tokenomics is how a token's supply works: how many exist, how many are in circulation today, who holds them, and how new tokens are released over time.",
      "It matters because more tokens entering the market can put pressure on the price. Comparing circulating supply with total supply is a good first step when learning about a token.",
    ],
    followUps: ["token-unlocks", "volatility"],
  },
  {
    id: "token-unlocks",
    topic: "Tokenomics",
    question: "What are token unlocks?",
    keywords: ["unlock", "unlocks", "vesting", "token unlock", "cliff", "emissions"],
    paragraphs: [
      "Many projects lock up tokens for their team and early investors, then release them on a schedule. Each release is called an unlock.",
      "A large unlock can add a lot of tokens to the market at once. Tokenomics trackers, such as Tokenomist, publish these schedules so you can see what's coming.",
    ],
    followUps: ["tokenomics", "long-term"],
  },
];

export function getEntry(id: string): KnowledgeEntry | undefined {
  return KNOWLEDGE.find((e) => e.id === id);
}
