import { NextResponse } from "next/server";
import { getSuperAdminUser } from "@/lib/auth/admin";
import { setSetting } from "@/lib/data/settings";

export const runtime = "nodejs";

interface RawStep {
  title?: unknown;
  body?: unknown;
}

export async function POST(req: Request) {
  const admin = await getSuperAdminUser();
  if (!admin) return NextResponse.json({ error: "Bukan admin." }, { status: 403 });

  try {
    const { youtubeId, steps } = await req.json();
    const cleanSteps = Array.isArray(steps)
      ? (steps as RawStep[])
          .map((s) => ({
            title: String(s.title ?? "").trim(),
            body: String(s.body ?? "").trim(),
          }))
          .filter((s) => s.title || s.body)
      : [];
    await setSetting("tutorial", {
      youtubeId: String(youtubeId ?? "").trim(),
      steps: cleanSteps,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin/tutorial]", err);
    return NextResponse.json({ error: "Gagal menyimpan." }, { status: 500 });
  }
}
