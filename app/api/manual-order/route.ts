import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { ensureAccountForEmail } from "@/lib/auth/account";
import { notifyTelegram, notifyTelegramPhoto } from "@/lib/telegram/notify";
import { PRICE, formatIDR } from "@/lib/config/payment";
import { normalizeEmail } from "@/lib/config/app";

export const runtime = "nodejs";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const MAX_BYTES = 5 * 1024 * 1024;

// Public ("Beli = Daftar"): no login required. Accepts a multipart form with the
// proof image + Nama/Email/WhatsApp, auto-creates the buyer's account, uploads
// the proof via service role, records a pending order, and notifies the admin.
export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const email = normalizeEmail(String(form.get("email") ?? ""));
    const name = String(form.get("name") ?? "").trim() || null;
    const whatsapp = String(form.get("whatsapp") ?? "").trim() || null;
    const file = form.get("proof");

    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "Email tidak valid." }, { status: 400 });
    }
    if (!whatsapp) {
      return NextResponse.json({ error: "Nomor WhatsApp wajib." }, { status: 400 });
    }
    if (!(file instanceof Blob) || file.size === 0) {
      return NextResponse.json(
        { error: "Bukti transfer wajib diupload." },
        { status: 400 },
      );
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "Ukuran gambar maksimal 5MB." }, { status: 400 });
    }
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Bukti harus berupa gambar." }, { status: 400 });
    }

    const admin = createAdminClient();

    // Beli = Daftar: ensure account exists for this email.
    const userId = await ensureAccountForEmail(email, { name, whatsapp });

    // Upload proof via service role (bucket is private; RLS bypassed).
    const ext = (file.type.split("/")[1] || "jpg").replace("jpeg", "jpg");
    const proofPath = `manual/${randomUUID()}.${ext}`;
    const bytes = new Uint8Array(await file.arrayBuffer());
    const { error: upErr } = await admin.storage
      .from("transfer-proofs")
      .upload(proofPath, bytes, { contentType: file.type, upsert: false });
    if (upErr) throw new Error(`upload gagal: ${upErr.message}`);

    const { data: order, error } = await admin
      .from("orders")
      .insert({
        user_id: userId,
        email,
        name,
        whatsapp,
        method: "manual",
        status: "pending",
        amount: PRICE,
        proof_url: proofPath,
      })
      .select("id")
      .single();
    if (error) throw error;

    const orderId = order.id as string;
    const caption =
      `🧾 <b>Transfer manual BARU — perlu approve</b>\n` +
      `Order: <code>${orderId}</code>\n` +
      `Nama: ${name || "-"}\n` +
      `Email: <code>${email}</code>\n` +
      `WA: ${whatsapp}\n` +
      `Nominal: ${formatIDR(PRICE)}`;

    try {
      await notifyTelegramPhoto(bytes, caption);
    } catch {
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
