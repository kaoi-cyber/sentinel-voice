import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { canonicalJson } from "@/lib/security/hash";
import { analyzeSupply } from "@/lib/supply/engine";
import { fetchSnapshot, TokenomistError } from "@/lib/tokenomist/client";

export const dynamic = "force-dynamic";

/** GET /api/supply?token=<tokenomist slug> → supply-risk report built from Tokenomist data. */
export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token") ?? "";
  try {
    const snap = await fetchSnapshot(token);
    if (!snap) return NextResponse.json({ error: `Tokenomist has no data for "${token}". Check the token id.` }, { status: 404 });
    // Fingerprint the raw data (not the query time), so identical Tokenomist data → identical hash.
    const dataHash =
      "0x" +
      createHash("sha256")
        .update(canonicalJson({ token: snap.token, allocations: snap.allocations, unlockEvents: snap.unlockEvents }))
        .digest("hex");
    return NextResponse.json({ report: analyzeSupply(snap, { dataHash }), raw: snap });
  } catch (e) {
    const status = e instanceof TokenomistError ? e.status : 500;
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: status === 401 || status === 403 ? 503 : status });
  }
}
