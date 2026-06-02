import { NextResponse } from "next/server";
import { getEntitlement } from "@/lib/license/status";

export const runtime = "nodejs";

export async function GET() {
  try {
    const status = await getEntitlement();
    return NextResponse.json(status);
  } catch (err) {
    console.error("[license/status]", err);
    return NextResponse.json(
      { loggedIn: false, entitled: false, owner: false, isAdmin: false },
      { status: 200 },
    );
  }
}
