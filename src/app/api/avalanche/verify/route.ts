import { NextResponse } from "next/server";
import { isBytes32, REGISTRY_ABI, type OnchainRecord } from "@/lib/avalanche/chain";
import { fujiClient, readDeployment } from "@/lib/avalanche/server";

export const dynamic = "force-dynamic";

/** Looks up a report fingerprint in the Fuji registry. Read-only — no wallet needed. */
export async function GET(req: Request) {
  const hash = new URL(req.url).searchParams.get("hash");
  if (!isBytes32(hash)) return NextResponse.json({ error: "hash must be 0x + 64 hex characters" }, { status: 400 });

  const d = await readDeployment();
  if (!d) return NextResponse.json({ error: "Registry not deployed yet" }, { status: 409 });

  try {
    const [recorded, submitter, timestamp, riskLevel] = (await fujiClient.readContract({
      address: d.address,
      abi: REGISTRY_ABI,
      functionName: "verify",
      args: [hash],
    })) as [boolean, string, bigint, string];
    const record: OnchainRecord = { recorded, submitter, timestamp: Number(timestamp), riskLevel };
    return NextResponse.json({ registry: d.address, ...record });
  } catch (e) {
    const message = e instanceof Error ? e.message.split("\n")[0] : "unknown error";
    return NextResponse.json({ error: `Couldn't reach Avalanche Fuji: ${message}` }, { status: 502 });
  }
}
