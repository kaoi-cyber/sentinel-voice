// Tests the registry contract on a local throwaway chain (no real or test AVAX needed).
// Start one first, e.g. `npx ganache --port 8547 --chain.chainId 43113`, then:
//   RPC_URL=http://127.0.0.1:8547 npm run check:contract
import { createPublicClient, createWalletClient, defineChain, http, type Hex } from "viem";
import { REGISTRY_ABI as abi, REGISTRY_BYTECODE as bytecode } from "../src/lib/avalanche/chain";

const rpc = process.env.RPC_URL ?? "http://127.0.0.1:8547";
const chain = defineChain({
  id: 43113,
  name: "local",
  nativeCurrency: { name: "AVAX", symbol: "AVAX", decimals: 18 },
  rpcUrls: { default: { http: [rpc] } },
});
const pub = createPublicClient({ chain, transport: http(rpc) });

let failed = 0;
const expect = (name: string, ok: boolean, detail = "") => {
  if (!ok) failed++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
};

async function main() {
  const wallet = createWalletClient({ chain, transport: http(rpc) });
  const [account] = await wallet.getAddresses();

  // Estimate gas like a real wallet would (local test nodes default to a fixed, too-small limit).
  const deployGas = await pub.estimateGas({ account, data: bytecode });
  const deployTx = await wallet.deployContract({ abi, bytecode, account, gas: deployGas });
  const deployed = await pub.waitForTransactionReceipt({ hash: deployTx });
  const address = deployed.contractAddress!;
  const code = address ? await pub.getCode({ address }) : undefined;
  expect("deploys", deployed.status === "success" && !!code && code.length > 2, `${address} · status ${deployed.status} · gas ${deployed.gasUsed} · code ${code?.length ?? 0} chars`);
  if (!code || code.length <= 2) process.exit(1);

  const hash = ("0x" + "ab".repeat(32)) as Hex;
  const before = (await pub.readContract({ address, abi, functionName: "verify", args: [hash] })) as [boolean, string, bigint, string];
  expect("unknown hash is not recorded", before[0] === false);

  const recordGas = await pub.estimateContractGas({ address, abi, functionName: "record", args: [hash, "high"], account });
  const tx = await wallet.writeContract({ address, abi, functionName: "record", args: [hash, "high"], account, gas: recordGas });
  const receipt = await pub.waitForTransactionReceipt({ hash: tx });
  expect("record() succeeds", receipt.status === "success", `gas used ${receipt.gasUsed}`);

  const after = (await pub.readContract({ address, abi, functionName: "verify", args: [hash] })) as [boolean, string, bigint, string];
  expect("verify() finds it", after[0] === true && after[3] === "high" && after[1].toLowerCase() === account.toLowerCase());
  expect("timestamp set", after[2] > 0n, new Date(Number(after[2]) * 1000).toISOString());

  const total = await pub.readContract({ address, abi, functionName: "totalRecords" });
  expect("totalRecords = 1", total === 1n);

  for (const [name, args] of [
    ["duplicate hash is rejected", [hash, "low"]],
    ["empty hash is rejected", ["0x" + "00".repeat(32), "low"]],
  ] as const) {
    try {
      await pub.simulateContract({ address, abi, functionName: "record", args, account });
      expect(name, false, "did not revert");
    } catch (e) {
      expect(name, true, (e as Error).message.match(/AlreadyRecorded|EmptyHash/)?.[0] ?? "reverted");
    }
  }
  process.exit(failed ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
