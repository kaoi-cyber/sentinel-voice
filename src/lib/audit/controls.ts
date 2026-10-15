// Security controls a wallet company is asked about. Each maps to a real drain vector
// and a concrete fix. Answers are self-reported — the report says so.

export type ControlAnswer = "yes" | "partial" | "no";

export type Control = {
  id: string;
  area: "Signing safety" | "Phishing defence" | "Key management" | "Security process";
  question: string;
  weight: 1 | 2 | 3;
  risk: string;
  fix: string;
};

export const CONTROLS: Control[] = [
  {
    id: "tx-simulation",
    area: "Signing safety",
    question: "Do you simulate transactions and show balance changes before the user signs?",
    weight: 3,
    risk: "Users approve transactions without seeing what will leave their wallet.",
    fix: "Run a pre-sign simulation and show 'You send / You receive / Permissions granted' in plain language.",
  },
  {
    id: "typed-data-decoding",
    area: "Signing safety",
    question: "Do you decode Permit / Permit2 / typed-data signatures into human-readable approvals?",
    weight: 3,
    risk: "Gasless signature phishing is invisible when typed data is shown as raw JSON.",
    fix: "Decode EIP-2612 and Permit2 messages; display token, amount, spender and expiry as an approval.",
  },
  {
    id: "eth-sign-blocked",
    area: "Signing safety",
    question: "Is eth_sign (blind hash signing) disabled by default?",
    weight: 3,
    risk: "A blind hash can authorise any transaction without the user seeing it.",
    fix: "Disable eth_sign by default; allow only behind an advanced setting with a severe warning.",
  },
  {
    id: "approval-caps",
    area: "Signing safety",
    question: "Do you let users edit approval amounts and warn on unlimited approvals?",
    weight: 2,
    risk: "Unlimited allowances turn one compromised dApp into a full balance drain.",
    fix: "Default to exact amounts, highlight 'unlimited', and offer an inline spending-cap editor.",
  },
  {
    id: "approval-manager",
    area: "Signing safety",
    question: "Can users view and revoke existing approvals inside the wallet?",
    weight: 2,
    risk: "Forgotten approvals stay exploitable for years.",
    fix: "Add an approvals manager listing active allowances with one-tap revoke.",
  },
  {
    id: "phishing-blocklist",
    area: "Phishing defence",
    question: "Do you block or warn on known phishing / drainer domains and contracts?",
    weight: 3,
    risk: "Users connect to cloned sites that run drainer kits.",
    fix: "Integrate continuously updated phishing-domain and malicious-contract feeds; block on match.",
  },
  {
    id: "address-poisoning",
    area: "Phishing defence",
    question: "Do you detect look-alike recipient addresses (address poisoning)?",
    weight: 2,
    risk: "Users copy a poisoned address from their history and send funds to the attacker.",
    fix: "Compare recipients against the address book and history; warn on near-matches; hide zero-value spam transfers.",
  },
  {
    id: "seed-handling",
    area: "Key management",
    question: "Are seed phrases encrypted at rest, never sent to your servers, and protected from screenshots/clipboard?",
    weight: 3,
    risk: "Leaked seed phrases cannot be revoked — the wallet is lost permanently.",
    fix: "Keep keys device-only in secure enclave/keystore; block screenshots on seed screens; never log or sync seeds.",
  },
  {
    id: "hardware-support",
    area: "Key management",
    question: "Do you support hardware wallets for high-value accounts?",
    weight: 1,
    risk: "High-value users have no option to keep keys offline.",
    fix: "Support major hardware wallets and suggest them above a balance threshold.",
  },
  {
    id: "audits-bounty",
    area: "Security process",
    question: "Do you have recent third-party security audits and a public bug bounty?",
    weight: 2,
    risk: "Vulnerabilities are found by attackers before defenders.",
    fix: "Commission audits for each major release and run a public bug-bounty programme with clear scope.",
  },
];
