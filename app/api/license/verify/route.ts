import { NextResponse } from "next/server";
import { verifyLicense } from "@/lib/license/token";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { token } = await req.json();
    const info = verifyLicense(String(token ?? ""));
    return NextResponse.json({ valid: info.valid, owner: info.owner });
  } catch {
    return NextResponse.json({ valid: false, owner: false }, { status: 200 });
  }
}
