import { NextResponse } from "next/server";
import { FUJI_CHAIN, type AvalancheConfig } from "@/lib/avalanche/chain";
import { readDeployment } from "@/lib/avalanche/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const d = await readDeployment();
  const config: AvalancheConfig = {
    chainId: FUJI_CHAIN.id,
    registry: d?.address ?? null,
    deployTx: d?.txHash ?? null,
    canSaveDeployment: process.env.NODE_ENV === "development",
  };
  return NextResponse.json(config);
}
