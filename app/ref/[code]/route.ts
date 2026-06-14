import { NextResponse } from "next/server";

export const runtime = "nodejs";

// /ref/<code> — drops a 30-day referral cookie then sends the visitor to the
// landing page. Attribution is finalized on a paid purchase (checkout → grant).
export async function GET(
  req: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const clean = (code || "").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 32);
  const origin = new URL(req.url).origin;
  const res = NextResponse.redirect(`${origin}/?via=${encodeURIComponent(clean)}#pricing`);
  if (clean) {
    res.cookies.set("ref", clean, {
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
      sameSite: "lax",
    });
  }
  return res;
}
