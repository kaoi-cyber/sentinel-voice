"use client";

// Browser-side wallet actions. The user's own wallet (Core or MetaMask) signs every
// transaction — the app never sees a private key or seed phrase.
import { createPublicClient, createWalletClient, custom, type EIP1193Provider, type Hex } from "viem";
import { FUJI_CHAIN, REGISTRY_ABI, REGISTRY_BYTECODE } from "./chain";

export type Stage = "connecting" | "confirm" | "pending";

type ProviderDetail = { info: { name: string; rdns: string }; provider: EIP1193Provider };

/**
 * Finds the browser wallet, preferring Core when several are installed.
 * Checks the EIP-6963 announcements, Core's own `window.avalanche`, then `window.ethereum`.
 */
function discoverProvider(): Promise<EIP1193Provider | null> {
  return new Promise((resolve) => {
    const found: ProviderDetail[] = [];
    const onAnnounce = (e: Event) => found.push((e as CustomEvent<ProviderDetail>).detail);
    window.addEventListener("eip6963:announceProvider", onAnnounce);
    window.dispatchEvent(new Event("eip6963:requestProvider"));
    setTimeout(() => {
      window.removeEventListener("eip6963:announceProvider", onAnnounce);
      const w = window as unknown as { avalanche?: EIP1193Provider; ethereum?: EIP1193Provider };
      const core = found.find((p) => /core/i.test(p.info.name) || /core|avax|avalanche/i.test(p.info.rdns));
      resolve(core?.provider ?? w.avalanche ?? found[0]?.provider ?? w.ethereum ?? null);
    }, 500);
  });
}

/** Names of the wallets this browser exposes — shown when connecting fails. */
export function detectedWallets(): Promise<string[]> {
  return new Promise((resolve) => {
    const names: string[] = [];
    const onAnnounce = (e: Event) => names.push((e as CustomEvent<ProviderDetail>).detail.info.name);
    window.addEventListener("eip6963:announceProvider", onAnnounce);
    window.dispatchEvent(new Event("eip6963:requestProvider"));
    setTimeout(() => {
      window.removeEventListener("eip6963:announceProvider", onAnnounce);
      const w = window as unknown as { avalanche?: unknown; ethereum?: unknown };
      if (w.avalanche && !names.some((n) => /core/i.test(n))) names.push("window.avalanche");
      if (w.ethereum && names.length === 0) names.push("window.ethereum");
      resolve(names);
    }, 500);
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

export type TestOutcome = "rejected" | "signed" | "error";

/**
 * Sends one Drainer Test Pack request to the connected wallet so the team can see how its UI
 * reacts. The user is told to REJECT; we only report whether it was rejected or signed.
 * Requests target fictional addresses on the Fuji testnet.
 */
export async function sendTestRequest(
  req: { method: "eth_sendTransaction"; tx: { to: string; value: string; data: string } } | { method: "eth_signTypedData_v4"; typedData: Record<string, unknown> } | { method: "eth_sign"; hash: string } | { method: "personal_sign"; message: string },
): Promise<{ outcome: TestOutcome; detail: string }> {
  const provider = await discoverProvider();
  if (!provider) throw new Error("NO_WALLET");
  const { account } = await connectFuji();
  const call = (method: string, params: unknown[]) =>
    (provider.request as (a: { method: string; params: unknown[] }) => Promise<unknown>)({ method, params });
  try {
    switch (req.method) {
      case "eth_sendTransaction":
        await call("eth_sendTransaction", [{ from: account, to: req.tx.to, value: "0x" + BigInt(req.tx.value).toString(16), data: req.tx.data }]);
        break;
      case "eth_signTypedData_v4":
      {
        // Make the permit look like it's for the connected account, as a real drainer would.
        const message = { ...(req.typedData.message as Record<string, unknown>) };
        if ("owner" in message) message.owner = account;
        await call("eth_signTypedData_v4", [account, JSON.stringify({ ...req.typedData, message })]);
      }
        break;
      case "eth_sign":
        await call("eth_sign", [account, req.hash]);
        break;
      case "personal_sign":
        await call("personal_sign", ["0x" + Array.from(new TextEncoder().encode(req.message), (b) => b.toString(16).padStart(2, "0")).join(""), account]);
        break;
    }
    return { outcome: "signed", detail: "The wallet let it through and it was signed." };
  } catch (e) {
    const msg = friendlyWalletError(e);
    if (/cancelled/.test(msg)) return { outcome: "rejected", detail: "You rejected it in the wallet." };
    return { outcome: "error", detail: msg };
  }
}

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
  if (msg.includes("NO_WALLET"))
    return "No wallet found in this browser. Open this page in the browser where your Core extension is installed (Chrome, Edge or Brave) and refresh. The Claude app's built-in browser and Safari can't use wallet extensions.";
  if (/user (rejected|denied|cancel)|rejected the request|4001/i.test(msg)) return "You cancelled the request in your wallet.";
  if (/insufficient funds/i.test(msg)) return "Your wallet doesn't have enough test AVAX. Get some free from the Builder Hub faucet.";
  if (/AlreadyRecorded/.test(msg)) return "This exact report is already recorded on Avalanche.";
  if (/chain|network/i.test(msg) && /switch|unrecognized|unsupported/i.test(msg))
    return "Please switch your wallet to Avalanche Fuji (turn on testnet mode in Core) and try again.";
  return (e as { shortMessage?: string }).shortMessage ?? (e instanceof Error ? e.message.split("\n")[0] : "Something went wrong.");
}
