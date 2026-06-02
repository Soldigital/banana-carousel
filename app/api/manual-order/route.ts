import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyTelegram, notifyTelegramPhoto } from "@/lib/telegram/notify";
import { PRICE, formatIDR } from "@/lib/config/payment";
import { normalizeEmail } from "@/lib/config/app";

export const runtime = "nodejs";

// Creates a pending manual-transfer order (auth required) and notifies the
// admin on Telegram with the uploaded proof image.
export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Harus login dulu." }, { status: 401 });
    }

    const { name, whatsapp, proofPath } = await req.json();
    const email = normalizeEmail(user.email);
    const cleanName = String(name ?? "").trim() || null;
    const cleanWa = String(whatsapp ?? "").trim() || null;
    const proof = proofPath ? String(proofPath) : null;

    const admin = createAdminClient();

    // Persist WhatsApp on the profile for future prefill (best-effort).
    if (cleanWa) {
      await admin.from("profiles").update({ whatsapp: cleanWa }).eq("id", user.id);
    }

    const { data: order, error } = await admin
      .from("orders")
      .insert({
        user_id: user.id,
        email,
        name: cleanName,
        whatsapp: cleanWa,
        method: "manual",
        status: "pending",
        amount: PRICE,
        proof_url: proof,
      })
      .select("id")
      .single();
    if (error) throw error;

    const orderId = order.id as string;
    const caption =
      `🧾 <b>Transfer manual BARU — perlu approve</b>\n` +
      `Order: <code>${orderId}</code>\n` +
      `Nama: ${cleanName || "-"}\n` +
      `Email: <code>${email}</code>\n` +
      `WA: ${cleanWa || "-"}\n` +
      `Nominal: ${formatIDR(PRICE)}`;

    // Notify admin (best-effort — never fails the order).
    if (proof) {
      const { data: file } = await admin.storage
        .from("transfer-proofs")
        .download(proof);
      if (file) {
        await notifyTelegramPhoto(await file.arrayBuffer(), caption);
      } else {
        await notifyTelegram(caption);
      }
    } else {
      await notifyTelegram(caption);
    }

    return NextResponse.json({ orderId });
  } catch (err) {
    console.error("[manual-order]", err);
    return NextResponse.json(
      { error: "Gagal mengirim pesanan. Coba lagi." },
      { status: 500 },
    );
  }
}
