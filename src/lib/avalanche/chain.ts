// Shared Avalanche Fuji settings for both the browser and the server.
import { defineChain, type Abi, type Hex } from "viem";
import artifact from "./registry-artifact.json";

// Same values as viem's built-in `avalancheFuji`, defined here so we don't pull in every chain viem knows.
export const FUJI_CHAIN = defineChain({
  id: 43_113,
  name: "Avalanche Fuji",
  nativeCurrency: { decimals: 18, name: "Avalanche Fuji", symbol: "AVAX" },
  rpcUrls: { default: { http: ["https://api.avax-test.network/ext/bc/C/rpc"] } },
  blockExplorers: { default: { name: "SnowTrace", url: "https://testnet.snowtrace.io" } },
  testnet: true,
});
export const REGISTRY_ABI = artifact.abi as Abi;
export const REGISTRY_BYTECODE = artifact.bytecode as Hex;

const SNOWTRACE = FUJI_CHAIN.blockExplorers.default.url;
const AVAX_EXPLORER = "https://subnets-test.avax.network/c-chain";

export const explorers = {
  tx: (hash: string) => [
    { name: "Snowtrace", url: `${SNOWTRACE}/tx/${hash}` },
    { name: "Avalanche Explorer", url: `${AVAX_EXPLORER}/tx/${hash}` },
  ],
  address: (address: string) => [
    { name: "Snowtrace", url: `${SNOWTRACE}/address/${address}` },
    { name: "Avalanche Explorer", url: `${AVAX_EXPLORER}/address/${address}` },
  ],
};

export type AvalancheConfig = {
  chainId: number;
  registry: Hex | null;
  deployTx: string | null;
  /** Only the local dev server can save a new deployment into the project. */
  canSaveDeployment: boolean;
};

export type OnchainRecord = {
  recorded: boolean;
  submitter: string;
  timestamp: number;
  riskLevel: string;
};

export const isBytes32 = (v: unknown): v is Hex => typeof v === "string" && /^0x[0-9a-fA-F]{64}$/.test(v);
