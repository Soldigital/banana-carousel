import { NextResponse } from "next/server";
import { getSuperAdminUser } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

// Edit a user's profile (Nama & WhatsApp only — email is locked to avoid
// breaking their login identity). Super admin only.
export async function POST(req: Request) {
  const admin = await getSuperAdminUser();
  if (!admin) return NextResponse.json({ error: "Khusus Super Admin." }, { status: 403 });

  try {
    const { userId, name, whatsapp } = await req.json();
    const id = String(userId ?? "").trim();
    if (!id) return NextResponse.json({ error: "userId wajib." }, { status: 400 });

    const cleanName = String(name ?? "").trim() || null;
    const cleanWa = String(whatsapp ?? "").trim() || null;

    const db = createAdminClient();
    await db
      .from("profiles")
      .update({ name: cleanName, whatsapp: cleanWa })
      .eq("id", id);
    await db.auth.admin.updateUserById(id, {
      user_metadata: { name: cleanName, whatsapp: cleanWa },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin/update-user]", err);
    return NextResponse.json({ error: "Gagal menyimpan." }, { status: 500 });
  }
}
