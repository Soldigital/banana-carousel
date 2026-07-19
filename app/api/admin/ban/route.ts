import { NextResponse } from "next/server";
import { getSuperAdminUser } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { isOwnerEmail } from "@/lib/config/app";

export const runtime = "nodejs";

// Soft-ban / unban a user: sets profiles.banned (entitlement = !banned && is_pro)
// and blocks/unblocks login via Supabase auth ban_duration. Reversible.
export async function POST(req: Request) {
  const admin = await getSuperAdminUser();
  if (!admin) return NextResponse.json({ error: "Bukan admin." }, { status: 403 });

  try {
    const { userId, banned } = await req.json();
    const id = String(userId ?? "").trim();
    if (!id) return NextResponse.json({ error: "userId wajib." }, { status: 400 });

    const db = createAdminClient();
    const { data: target } = await db
      .from("profiles")
      .select("email")
      .eq("id", id)
      .maybeSingle();
    if (target && isOwnerEmail(target.email)) {
      return NextResponse.json(
        { error: "Tidak bisa mem-ban super admin." },
        { status: 400 },
      );
    }

    await db.from("profiles").update({ banned: !!banned }).eq("id", id);
    await db.auth.admin.updateUserById(id, {
      ban_duration: banned ? "876000h" : "none",
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin/ban]", err);
    return NextResponse.json({ error: "Gagal memproses." }, { status: 500 });
  }
}
