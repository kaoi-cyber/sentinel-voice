// A simulated AI payment agent's queue for the demo. Every request is a real, decodable
// signing request; addresses are fictional demo addresses.
import { PERMIT2 } from "@/lib/audit/testpack";
import { encodeCall, MAX_UINT256 } from "@/lib/security/abi";
import { DEMO_WALLET, FUJI, KNOWN } from "@/lib/security/reputation";
import type { Contact, IntentFacts, PaymentIntent } from "./engine";
import precomputed from "./precomputed.json";

// The public GitHub Pages demo carries no attack payloads: the requests below are dropped from
// its build, and the engine uses the facts the full app's detector produced (precomputed.json).
const HIDE = process.env.NEXT_PUBLIC_STATIC_DEMO === "1";
const HIDDEN = { method: "personal_sign" as const, message: "" };

export const CONTACTS: Contact[] = [
  { address: "0x2c4e6a8b0d1f3e5a7c9b1d3f5e7a9c0b2d4f6e81", label: "Bean There Café" },
  { address: "0x8d1f2e3c4b5a69788766554433221100ffeeddcc", label: "Landlord — Apt 4B" },
  { address: KNOWN.savings, label: "My savings wallet" },
];

const usdc = (n: number) => BigInt(Math.round(n * 1_000_000));
const pay = (to: string, amount: number) => ({
  method: "eth_sendTransaction" as const,
  tx: { from: DEMO_WALLET, to: KNOWN.usdc, value: "0", data: encodeCall("transfer", to, usdc(amount)) },
});
// Look-alike of "My savings wallet": same first and last 4 characters.
const POISONED_SAVINGS = "0x3b9f" + "00c0ffee11d0ab22be33ef4455aa66bb" + "8b9c";

const QUEUE: PaymentIntent[] = [
  { id: "coffee", agentNote: "Paying for your usual morning coffee.", request: HIDE ? HIDDEN : pay(CONTACTS[0].address, 4.5) },
  { id: "rent", agentNote: "Monthly rent is due today.", request: HIDE ? HIDDEN : pay(CONTACTS[1].address, 450) },
  { id: "ticket", agentNote: "Buying the concert tickets you asked about from a seller I found.", request: HIDE ? HIDDEN : pay("0x5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f", 85) },
  {
    id: "refund",
    agentNote: "The store says it needs token approval to process your refund.",
    request: HIDE ? HIDDEN : {
      method: "eth_sendTransaction",
      tx: { from: DEMO_WALLET, to: KNOWN.usdc, value: "0", data: encodeCall("approve", KNOWN.unknownSpender, MAX_UINT256) },
    },
  },
  { id: "savings", agentNote: "Moving $200 to your savings wallet, as planned.", request: HIDE ? HIDDEN : pay(POISONED_SAVINGS, 200) },
  {
    id: "checkout",
    agentNote: "Gasless checkout — just sign this message, no fees!",
    request: HIDE ? HIDDEN : {
      method: "eth_signTypedData_v4",
      typedData: {
        domain: { name: "Permit2", chainId: FUJI.chain_id, verifyingContract: PERMIT2 },
        primaryType: "PermitSingle",
        message: {
          details: { token: KNOWN.usdc, amount: ((1n << 160n) - 1n).toString(), expiration: "4102444800", nonce: "0" },
          spender: KNOWN.unknownSpender,
          sigDeadline: "4102444800",
        },
      },
    },
  },
  { id: "laptop", agentNote: "Found a great laptop deal at your café's partner store.", request: HIDE ? HIDDEN : pay(CONTACTS[0].address, 799) },
  { id: "lunch", agentNote: "Lunch order at the café.", request: HIDE ? HIDDEN : pay(CONTACTS[0].address, 12.8) },
];

export const AGENT_QUEUE: PaymentIntent[] = HIDE
  ? QUEUE.map((intent) => ({ ...intent, precomputed: (precomputed as Record<string, IntentFacts>)[intent.id] }))
  : QUEUE;
