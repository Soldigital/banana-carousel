import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";

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
    const { error } = await db
      .from("orders")
      .update({ status: "rejected", approved_by: admin.id, approved_at: new Date().toISOString() })
      .eq("id", id)
      .eq("status", "pending");
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin/reject]", err);
    return NextResponse.json(
      { ok: false, error: "Gagal menolak order." },
      { status: 500 },
    );
  }
}
