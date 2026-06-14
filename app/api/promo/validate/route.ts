import { NextResponse } from "next/server";
import { validateDiscount } from "@/lib/data/promo";
import { getFoundingStatus } from "@/lib/data/founding";
import { ANNUAL_PRICE } from "@/lib/config/payment";
import { rateLimit, clientIp } from "@/lib/security/ratelimit";

export const runtime = "nodejs";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

// POST /api/promo/validate { code, email, plan } — preview a discount code for
// the checkout dialog. Re-validated server-side at checkout (never trusted).
export async function POST(req: Request) {
  const rl = await rateLimit(`promo:${clientIp(req)}`, { limit: 20, window: "60 s" });
  if (!rl.success) {
    return NextResponse.json({ ok: false, reason: "Terlalu banyak percobaan." }, { status: 429 });
  }
  let code = "";
  let email = "";
  let plan = "lifetime";
  try {
    const b = await req.json();
    code = String(b?.code ?? "");
    email = String(b?.email ?? "").trim().toLowerCase();
    plan = b?.plan === "annual" ? "annual" : "lifetime";
  } catch {
    return NextResponse.json({ ok: false, reason: "Request tidak valid." }, { status: 400 });
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ ok: false, reason: "Masukkan email dulu." });
  }

  const basePrice =
    plan === "annual" ? ANNUAL_PRICE : (await getFoundingStatus()).price;
  const result = await validateDiscount(code, email, basePrice);
  return NextResponse.json({ ...result, basePrice });
}
