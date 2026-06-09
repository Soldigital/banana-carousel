import { NextResponse } from "next/server";
import { createPayment } from "@/lib/ipaymu/client";
import { signRef } from "@/lib/license/token";
import { ensureAccountForEmail } from "@/lib/auth/account";
import { PRICE, PRODUCT_NAME } from "@/lib/config/payment";
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
    const { email, name, whatsapp } = await req.json();
    const cleanEmail = String(email ?? "").trim().toLowerCase();
    if (!EMAIL_RE.test(cleanEmail)) {
      return NextResponse.json({ error: "Email tidak valid." }, { status: 400 });
    }

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
    const referenceId = signRef(cleanEmail);

    const { url } = await createPayment({
      product: PRODUCT_NAME,
      price: PRICE,
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
