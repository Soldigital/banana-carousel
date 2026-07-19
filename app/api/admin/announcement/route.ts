import { NextResponse } from "next/server";
import { getSuperAdminUser } from "@/lib/auth/admin";
import { setSetting } from "@/lib/data/settings";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const admin = await getSuperAdminUser();
  if (!admin) return NextResponse.json({ error: "Bukan admin." }, { status: 403 });

  try {
    const { title, message, active } = await req.json();
    await setSetting("announcement", {
      title: String(title ?? "").trim(),
      message: String(message ?? "").trim(),
      active: !!active,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin/announcement]", err);
    return NextResponse.json({ error: "Gagal menyimpan." }, { status: 500 });
  }
}
