import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { grantEntitlementByEmail } from "@/lib/license/entitlement";
import { sendLicenseEmail } from "@/lib/email/send-license";
import { notifyTelegram } from "@/lib/telegram/notify";
import type { Order } from "@/types/db";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const admin = await getAdminUser();
    if (!admin) {
      return NextResponse.json({ ok: false, error: "Bukan admin." }, { status: 403 });
    }

    const { orderId } = await req.json();
    const id = String(orderId ?? "").trim();
    if (!id) {
      return NextResponse.json({ ok: false, error: "orderId wajib." }, { status: 400 });
    }

    const db = createAdminClient();
    const { data: order } = await db
      .from("orders")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (!order) {
      return NextResponse.json({ ok: false, error: "Order tidak ditemukan." }, { status: 404 });
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
