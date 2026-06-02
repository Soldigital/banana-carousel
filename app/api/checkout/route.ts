import { NextResponse } from "next/server";
import { createPayment } from "@/lib/ipaymu/client";
import { signRef } from "@/lib/license/token";
import { PRICE, PRODUCT_NAME } from "@/lib/config/payment";

export const runtime = "nodejs";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export async function POST(req: Request) {
  try {
    const { email, name, whatsapp } = await req.json();
    const cleanEmail = String(email ?? "").trim().toLowerCase();
    if (!EMAIL_RE.test(cleanEmail)) {
      return NextResponse.json({ error: "Email tidak valid." }, { status: 400 });
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
