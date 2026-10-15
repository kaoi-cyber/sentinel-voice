// Server-side Avalanche helpers: where the registry lives, and read-only Fuji access.
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createPublicClient, http, isAddress, type Hex } from "viem";
import { FUJI_CHAIN } from "./chain";
import bundledDeployment from "../../../deployments/fuji.json";

export type Deployment = {
  chainId: number;
  address: Hex;
  txHash: Hex | null;
  deployedAt: string;
  deployer: string | null;
  compiler: string;
};

const FILE = path.join(process.cwd(), "deployments", "fuji.json");

// AVALANCHE_RPC_URL lets tests point at a local chain; normally the public Fuji RPC is used.
export const fujiClient = createPublicClient({ chain: FUJI_CHAIN, transport: http(process.env.AVALANCHE_RPC_URL || undefined) });

/** The deployed registry: `REPORT_REGISTRY_ADDRESS` env var wins, else deployments/fuji.json. */
export async function readDeployment(): Promise<Deployment | null> {
  const fromEnv = process.env.REPORT_REGISTRY_ADDRESS?.trim();
  if (fromEnv && isAddress(fromEnv)) {
    return { chainId: FUJI_CHAIN.id, address: fromEnv, txHash: null, deployedAt: "", deployer: null, compiler: "" };
  }
  try {
    // Local dev: read the file, so a fresh deploy from /deploy shows up without a rebuild.
    const d = JSON.parse(await readFile(FILE, "utf8")) as Deployment;
    if (d && isAddress(d.address)) return d;
  } catch {
    // Hosted builds can't read project files at runtime — fall through to the bundled copy.
  }
  const b = bundledDeployment as Deployment;
  return b && isAddress(b.address) ? b : null;
}

export async function saveDeployment(d: Deployment): Promise<void> {
  await mkdir(path.dirname(FILE), { recursive: true });
  await writeFile(FILE, JSON.stringify(d, null, 2) + "\n");
}
