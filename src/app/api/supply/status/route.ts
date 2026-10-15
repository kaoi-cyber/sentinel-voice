import { NextResponse } from "next/server";
import { LIVE_SUGGESTIONS, liveAccess, SAMPLE_IDS } from "@/lib/tokenomist/client";

export const dynamic = "force-dynamic";

/** Whether live Tokenomist data is available, and which tokens to suggest. */
export async function GET() {
  const access = await liveAccess();
  return NextResponse.json({
    live: access.live,
    reason: access.reason,
    samples: SAMPLE_IDS,
    suggestions: access.live ? LIVE_SUGGESTIONS : [],
  });
}
