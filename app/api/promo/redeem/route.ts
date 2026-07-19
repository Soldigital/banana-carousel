import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateRedeem } from "@/lib/data/promo";
import { grantEntitlementByEmail } from "@/lib/license/entitlement";
import { ensureAccountForEmail } from "@/lib/auth/account";
import { normalizeEmail } from "@/lib/config/app";
import { rateLimit, clientIp } from "@/lib/security/ratelimit";

export const runtime = "nodejs";

// POST /api/promo/redeem { code } — redeem a TRIAL or UPGRADE code for free
// access (no payment). Trial → pro_annual for N days; upgrade → lifetime.
// The grant inserts an amount:0 promo order = the usage record (per-user limit
// enforced in validateRedeem).
export async function POST(req: Request) {
  const rl = await rateLimit(`redeem:${clientIp(req)}`, { limit: 10, window: "60 s" });
  if (!rl.success) {
    return NextResponse.json({ error: "Terlalu banyak percobaan." }, { status: 429 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) {
    return NextResponse.json({ error: "Silakan login dulu." }, { status: 401 });
  }
  const email = normalizeEmail(user.email);

  let code = "";
  try {
    code = String((await req.json())?.code ?? "").trim();
  } catch {
    return NextResponse.json({ error: "Request tidak valid." }, { status: 400 });
  }

  const v = await validateRedeem(code, email);
  if (!v.ok) {
    return NextResponse.json({ error: v.reason || "Kode tidak valid." }, { status: 400 });
  }

  try {
    await ensureAccountForEmail(email);
    if (v.type === "trial") {
      await grantEntitlementByEmail(email, {
        method: "promo",
        plan: "annual",
        trialDays: Math.max(1, Math.round(v.value ?? 0)),
        promoCode: code.toUpperCase(),
        amount: 0,
      });
    } else {
      // upgrade → lifetime free grant
      await grantEntitlementByEmail(email, {
        method: "promo",
        plan: "lifetime",
        promoCode: code.toUpperCase(),
        amount: 0,
      });
    }
    return NextResponse.json({ ok: true, type: v.type });
  } catch (err) {
    console.error("[promo/redeem]", err);
    return NextResponse.json({ error: "Gagal klaim kode." }, { status: 500 });
  }
}
