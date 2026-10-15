"use client";

// Browser-side wallet actions. The user's own wallet (Core or MetaMask) signs every
// transaction — the app never sees a private key or seed phrase.
import { createPublicClient, createWalletClient, custom, type EIP1193Provider, type Hex } from "viem";
import { FUJI_CHAIN, REGISTRY_ABI, REGISTRY_BYTECODE } from "./chain";

export type Stage = "connecting" | "confirm" | "pending";

type ProviderDetail = { info: { name: string; rdns: string }; provider: EIP1193Provider };

/** Finds the browser wallet, preferring Core when several are installed (EIP-6963). */
function discoverProvider(): Promise<EIP1193Provider | null> {
  return new Promise((resolve) => {
    const found: ProviderDetail[] = [];
    const onAnnounce = (e: Event) => found.push((e as CustomEvent<ProviderDetail>).detail);
    window.addEventListener("eip6963:announceProvider", onAnnounce);
    window.dispatchEvent(new Event("eip6963:requestProvider"));
    setTimeout(() => {
      window.removeEventListener("eip6963:announceProvider", onAnnounce);
      const core = found.find((p) => /core/i.test(p.info.name) || /core/i.test(p.info.rdns));
      const injected = (window as unknown as { ethereum?: EIP1193Provider }).ethereum;
      resolve(core?.provider ?? found[0]?.provider ?? injected ?? null);
    }, 300);
  });
}

async function connectFuji() {
  const provider = await discoverProvider();
  if (!provider) throw new Error("NO_WALLET");
  const wallet = createWalletClient({ chain: FUJI_CHAIN, transport: custom(provider) });
  const [account] = await wallet.requestAddresses();

  if ((await wallet.getChainId()) !== FUJI_CHAIN.id) {
    try {
      await wallet.switchChain({ id: FUJI_CHAIN.id });
    } catch {
      // The wallet doesn't know Fuji yet — add it, then switch.
      await wallet.addChain({ chain: FUJI_CHAIN });
      await wallet.switchChain({ id: FUJI_CHAIN.id });
    }
  }
  const pub = createPublicClient({ chain: FUJI_CHAIN, transport: custom(provider), pollingInterval: 1_000 });
  return { wallet, pub, account };
}

const withBuffer = (gas: bigint) => (gas * 12n) / 10n;

export async function recordReport(registry: Hex, reportHash: Hex, riskLevel: string, onStage: (s: Stage) => void) {
  onStage("connecting");
  const { wallet, pub, account } = await connectFuji();
  const args = [reportHash, riskLevel] as const;
  // Simulating first catches "already recorded" before the wallet pops up.
  await pub.simulateContract({ address: registry, abi: REGISTRY_ABI, functionName: "record", args, account });
  const gas = await pub.estimateContractGas({ address: registry, abi: REGISTRY_ABI, functionName: "record", args, account });

  onStage("confirm");
  const txHash = await wallet.writeContract({
    address: registry,
    abi: REGISTRY_ABI,
    functionName: "record",
    args,
    account,
    gas: withBuffer(gas),
  });
  onStage("pending");
  const receipt = await pub.waitForTransactionReceipt({ hash: txHash });
  if (receipt.status !== "success") throw new Error("The transaction failed on Avalanche Fuji.");
  return { txHash, account };
}

export async function deployRegistry(onStage: (s: Stage) => void) {
  onStage("connecting");
  const { wallet, pub, account } = await connectFuji();
  const gas = await pub.estimateGas({ account, data: REGISTRY_BYTECODE });

  onStage("confirm");
  const txHash = await wallet.deployContract({ abi: REGISTRY_ABI, bytecode: REGISTRY_BYTECODE, account, gas: withBuffer(gas) });
  onStage("pending");
  const receipt = await pub.waitForTransactionReceipt({ hash: txHash });
  if (receipt.status !== "success" || !receipt.contractAddress) throw new Error("The deployment failed on Avalanche Fuji.");
  return { address: receipt.contractAddress, txHash, account };
}

/** Wallet errors in plain language. */
export function friendlyWalletError(e: unknown): string {
  const msg = e instanceof Error ? `${e.message} ${(e as { details?: string }).details ?? ""}` : String(e);
  if (msg.includes("NO_WALLET")) return "No wallet found. Install the Core wallet extension (core.app), then refresh this page.";
  if (/user (rejected|denied|cancel)|rejected the request|4001/i.test(msg)) return "You cancelled the request in your wallet.";
  if (/insufficient funds/i.test(msg)) return "Your wallet doesn't have enough test AVAX. Get some free from the Builder Hub faucet.";
  if (/AlreadyRecorded/.test(msg)) return "This exact report is already recorded on Avalanche.";
  if (/chain|network/i.test(msg) && /switch|unrecognized|unsupported/i.test(msg))
    return "Please switch your wallet to Avalanche Fuji (turn on testnet mode in Core) and try again.";
  return (e as { shortMessage?: string }).shortMessage ?? (e instanceof Error ? e.message.split("\n")[0] : "Something went wrong.");
}
