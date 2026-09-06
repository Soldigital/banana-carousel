import { NextResponse } from "next/server";
import { getSuperAdminUser } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { grantEntitlementByEmail } from "@/lib/license/entitlement";
import { sendLicenseEmail } from "@/lib/email/send-license";
import { notifyTelegram } from "@/lib/telegram/notify";
import type { Order } from "@/types/db";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const admin = await getSuperAdminUser();
    if (!admin) {
      return NextResponse.json({ ok: false, error: "Bukan admin." }, { status: 403 });
    }

    const { orderId } = await req.json();
    const id = String(orderId ?? "").trim();
    if (!id) {
      return NextResponse.json({ ok: false, error: "orderId wajib." }, { status: 400 });
    }

    const db = createAdminClient();
    // Only a PENDING order may be approved. Without this filter an order that
    // was deliberately rejected could be approved afterwards, re-granting
    // access that was denied on purpose. Mirrors the reject route.
    const { data: order } = await db
      .from("orders")
      .select("*")
      .eq("id", id)
      .eq("status", "pending")
      .maybeSingle();
    if (!order) {
      return NextResponse.json(
        { ok: false, error: "Order tidak ditemukan atau sudah diproses." },
        { status: 404 },
      );
    }

    const o = order as Order;
    // Grant entitlement (idempotent — skips if already approved).
    const { token, duplicate } = await grantEntitlementByEmail(o.email, {
      method: "manual",
      orderId: o.id,
      approvedBy: admin.id,
    });

    if (!duplicate) {
      await sendLicenseEmail(o.email, token);
      await notifyTelegram(
        `✅ <b>Transfer manual DISETUJUI</b>\n` +
          `Email: <code>${o.email}</code>\n` +
          `Order: <code>${o.id}</code>`,
      );
    }

    return NextResponse.json({ ok: true, duplicate });
  } catch (err) {
    console.error("[admin/approve]", err);
    return NextResponse.json(
      { ok: false, error: "Gagal menyetujui order." },
      { status: 500 },
    );
  }
}
