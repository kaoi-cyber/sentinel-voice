import { NextResponse } from "next/server";
import { getAddress, isAddress, isHash } from "viem";
import { FUJI_CHAIN, REGISTRY_BYTECODE } from "@/lib/avalanche/chain";
import { fujiClient, saveDeployment } from "@/lib/avalanche/server";
import artifact from "@/lib/avalanche/registry-artifact.json";

/**
 * Saves a freshly deployed registry into deployments/fuji.json (dev server only).
 * Checks on Fuji that the transaction really created our contract before saving.
 */
export async function POST(req: Request) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Saving deployments is only allowed on the local dev server" }, { status: 403 });
  }
  const body = await req.json().catch(() => null);
  const address = body?.address;
  const txHash = body?.txHash;
  if (!isAddress(address) || !isHash(txHash)) {
    return NextResponse.json({ error: "address and txHash are required" }, { status: 400 });
  }

  try {
    const [tx, receipt] = await Promise.all([
      fujiClient.getTransaction({ hash: txHash }),
      fujiClient.getTransactionReceipt({ hash: txHash }),
    ]);
    const createdOurContract =
      receipt.status === "success" &&
      receipt.contractAddress?.toLowerCase() === address.toLowerCase() &&
      tx.input.toLowerCase().startsWith(REGISTRY_BYTECODE.toLowerCase());
    if (!createdOurContract) {
      return NextResponse.json({ error: "That transaction didn't deploy the Sentinel registry on Fuji" }, { status: 422 });
    }

    const deployment = {
      chainId: FUJI_CHAIN.id,
      address: getAddress(address),
      txHash,
      deployedAt: new Date().toISOString(),
      deployer: tx.from,
      compiler: artifact.compiler,
    };
    await saveDeployment(deployment);
    return NextResponse.json(deployment);
  } catch (e) {
    const message = e instanceof Error ? e.message.split("\n")[0] : "unknown error";
    return NextResponse.json({ error: `Couldn't confirm the deployment on Fuji: ${message}` }, { status: 502 });
  }
}
