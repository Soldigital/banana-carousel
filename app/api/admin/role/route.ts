import { NextResponse } from "next/server";
import { getSuperAdminUser } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { isOwnerEmail } from "@/lib/config/app";

export const runtime = "nodejs";

// Assign a staff role. 'supervisor' → operational admin access (is_admin true);
// 'user' → normal (is_admin false). Super admin only. Owners are untouchable.
export async function POST(req: Request) {
  const admin = await getSuperAdminUser();
  if (!admin) return NextResponse.json({ error: "Khusus Super Admin." }, { status: 403 });

  try {
    const { userId, role } = await req.json();
    const id = String(userId ?? "").trim();
    const r = role === "supervisor" ? "supervisor" : "user";
    if (!id) return NextResponse.json({ error: "userId wajib." }, { status: 400 });

    const db = createAdminClient();
    const { data: target } = await db
      .from("profiles")
      .select("email")
      .eq("id", id)
      .maybeSingle();
    if (target && isOwnerEmail(target.email)) {
      return NextResponse.json(
        { error: "Role super admin tidak bisa diubah." },
        { status: 400 },
      );
    }

    await db
      .from("profiles")
      .update({ role: r, is_admin: r === "supervisor" })
      .eq("id", id);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin/role]", err);
    return NextResponse.json({ error: "Gagal menyimpan role." }, { status: 500 });
  }
}
