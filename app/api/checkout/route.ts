import { NextResponse } from "next/server";
import { createPayment } from "@/lib/ipaymu/client";
import { signRef } from "@/lib/license/token";
import { ensureAccountForEmail } from "@/lib/auth/account";
import {
  PRICE,
  PRODUCT_NAME,
  ANNUAL_PRICE,
  ANNUAL_PRODUCT_NAME,
} from "@/lib/config/payment";
import { getFoundingStatus } from "@/lib/data/founding";
import { validateDiscount } from "@/lib/data/promo";
import { USE_PRICING_V2 } from "@/lib/config/flags";
import { rateLimit, clientIp } from "@/lib/security/ratelimit";

export const runtime = "nodejs";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export async function POST(req: Request) {
  const rl = await rateLimit(`checkout:${clientIp(req)}`, {
    limit: 10,
    window: "60 s",
  });
  if (!rl.success) {
    return NextResponse.json(
      { error: "Terlalu banyak percobaan. Coba lagi sebentar." },
      { status: 429 },
    );
  }
  try {
    const body = await req.json();
    const { email, name, whatsapp } = body;
    const cleanEmail = String(email ?? "").trim().toLowerCase();
    if (!EMAIL_RE.test(cleanEmail)) {
      return NextResponse.json({ error: "Email tidak valid." }, { status: 400 });
    }
    // Annual is only offered when pricing v2 is on; otherwise always lifetime.
    const plan: "lifetime" | "annual" =
      USE_PRICING_V2 && body?.plan === "annual" ? "annual" : "lifetime";

    // Beli = Daftar: create the buyer's account now (best-effort) so name/
    // WhatsApp are captured and they can log in via Magic Link later.
    try {
      await ensureAccountForEmail(cleanEmail, {
        name: String(name ?? "").trim() || null,
        whatsapp: String(whatsapp ?? "").trim() || null,
      });
    } catch (e) {
      console.error("[checkout] ensureAccount failed (non-fatal)", e);
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;

    // V2: price is computed server-side (never trusted from the client). Annual
    // = fixed yearly price; lifetime = live Founding/Lifetime price. Flag off =
    // legacy flat price.
    let price = PRICE;
    let product = PRODUCT_NAME;
    if (USE_PRICING_V2) {
      if (plan === "annual") {
        price = ANNUAL_PRICE;
        product = ANNUAL_PRODUCT_NAME;
      } else {
        const f = await getFoundingStatus();
        price = f.price;
        product = f.productName;
      }
    }

    // Promo discount (fixed/percentage) — re-validated server-side, applied to
    // the price, and stamped onto the order at payment via the signed ref.
    let appliedCode: string | null = null;
    const rawCode =
      USE_PRICING_V2 && typeof body?.code === "string"
        ? body.code.trim().toUpperCase()
        : "";
    if (rawCode) {
      const v = await validateDiscount(rawCode, cleanEmail, price);
      if (v.ok && typeof v.discountedPrice === "number") {
        price = v.discountedPrice;
        appliedCode = rawCode;
      }
    }

    const referenceId = signRef(cleanEmail, plan, appliedCode);

    const { url } = await createPayment({
      product,
      price,
      referenceId,
      buyerName: String(name ?? "").trim() || cleanEmail.split("@")[0],
      buyerEmail: cleanEmail,
      buyerPhone: String(whatsapp ?? "").trim() || undefined,
      returnUrl: `${appUrl}/activate`,
      notifyUrl: `${appUrl}/api/ipaymu/notify`,
      cancelUrl: `${appUrl}/?canceled=1`,
    });

    return NextResponse.json({ url });
  } catch (err) {
    console.error("[checkout]", err);
    return NextResponse.json(
      { error: "Gagal memulai pembayaran. Coba lagi sebentar." },
      { status: 500 },
    );
  }
}
