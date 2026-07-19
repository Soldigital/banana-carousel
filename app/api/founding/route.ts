import { NextResponse } from "next/server";
import { getFoundingStatus } from "@/lib/data/founding";

export const runtime = "nodejs";

// Public, cache-light Founding Member counter + current price (drives the
// pricing UI). No auth — exposes only aggregate numbers, no PII.
export async function GET() {
  const status = await getFoundingStatus();
  return NextResponse.json(status, {
    headers: { "Cache-Control": "public, max-age=15, s-maxage=15" },
  });
}
