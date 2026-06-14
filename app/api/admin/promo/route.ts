import { NextResponse } from "next/server";
import { getSuperAdminUser } from "@/lib/auth/admin";
import { listPromoCodes, createPromoCode, type PromoType } from "@/lib/data/promo";

export const runtime = "nodejs";

const TYPES: PromoType[] = ["fixed", "percentage", "trial", "upgrade"];

export async function GET() {
  const admin = await getSuperAdminUser();
  if (!admin) return NextResponse.json({ error: "Bukan admin." }, { status: 403 });
  return NextResponse.json({ codes: await listPromoCodes() });
}

export async function POST(req: Request) {
  const admin = await getSuperAdminUser();
  if (!admin) return NextResponse.json({ error: "Bukan admin." }, { status: 403 });

  let b: Record<string, unknown>;
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ error: "Request tidak valid." }, { status: 400 });
  }
  const code = String(b.code ?? "").trim().toUpperCase();
  const type = b.type as PromoType;
  if (!code || !TYPES.includes(type)) {
    return NextResponse.json({ error: "Kode & tipe wajib." }, { status: 400 });
  }
  const created = await createPromoCode(
    {
      code,
      type,
      name: typeof b.name === "string" ? b.name : null,
      value: Number(b.value) || 0,
      starts_at: (b.starts_at as string) || null,
      ends_at: (b.ends_at as string) || null,
      max_usage: b.max_usage != null && b.max_usage !== "" ? Number(b.max_usage) : null,
      per_user_limit: Number(b.per_user_limit) || 1,
      active: b.active !== false,
    },
    admin.id,
  );
  if (!created) {
    return NextResponse.json({ error: "Gagal menyimpan (kode mungkin sudah ada)." }, { status: 400 });
  }
  return NextResponse.json({ promo: created });
}
