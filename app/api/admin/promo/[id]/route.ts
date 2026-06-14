import { NextResponse } from "next/server";
import { getSuperAdminUser } from "@/lib/auth/admin";
import { updatePromoCode, deletePromoCode, type PromoInput } from "@/lib/data/promo";

export const runtime = "nodejs";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await getSuperAdminUser();
  if (!admin) return NextResponse.json({ error: "Bukan admin." }, { status: 403 });
  const { id } = await params;

  let b: Record<string, unknown>;
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ error: "Request tidak valid." }, { status: 400 });
  }
  // Only known fields; toggling `active` is the common case.
  const fields: PromoInput = {};
  if (typeof b.active === "boolean") fields.active = b.active;
  if (typeof b.name === "string") fields.name = b.name;
  if (b.value != null) fields.value = Number(b.value) || 0;
  if ("max_usage" in b)
    fields.max_usage = b.max_usage != null && b.max_usage !== "" ? Number(b.max_usage) : null;
  if (b.per_user_limit != null) fields.per_user_limit = Number(b.per_user_limit) || 1;
  if ("starts_at" in b) fields.starts_at = (b.starts_at as string) || null;
  if ("ends_at" in b) fields.ends_at = (b.ends_at as string) || null;

  const ok = await updatePromoCode(id, fields);
  if (!ok) return NextResponse.json({ error: "Gagal memperbarui." }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await getSuperAdminUser();
  if (!admin) return NextResponse.json({ error: "Bukan admin." }, { status: 403 });
  const { id } = await params;
  const ok = await deletePromoCode(id);
  if (!ok) return NextResponse.json({ error: "Gagal menghapus." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
