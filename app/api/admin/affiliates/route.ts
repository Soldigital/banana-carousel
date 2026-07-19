import { NextResponse } from "next/server";
import { getSuperAdminUser } from "@/lib/auth/admin";
import { listAffiliatesAdmin, markAffiliatePaid } from "@/lib/data/affiliate";

export const runtime = "nodejs";

export async function GET() {
  const admin = await getSuperAdminUser();
  if (!admin) return NextResponse.json({ error: "Bukan admin." }, { status: 403 });
  return NextResponse.json({ affiliates: await listAffiliatesAdmin() });
}

// POST { affiliateId } — mark an affiliate's unpaid commission as paid out.
export async function POST(req: Request) {
  const admin = await getSuperAdminUser();
  if (!admin) return NextResponse.json({ error: "Bukan admin." }, { status: 403 });
  let id = "";
  try {
    id = String((await req.json())?.affiliateId ?? "");
  } catch {
    return NextResponse.json({ error: "Request tidak valid." }, { status: 400 });
  }
  if (!id) return NextResponse.json({ error: "affiliateId wajib." }, { status: 400 });
  const ok = await markAffiliatePaid(id);
  if (!ok) return NextResponse.json({ error: "Gagal." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
