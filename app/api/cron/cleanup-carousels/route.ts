import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { HISTORY_RETENTION_DAYS } from "@/lib/data/carousels";

export const runtime = "nodejs";

// Daily Vercel Cron job: deletes carousel history older than the retention
// window to keep the database light. Vercel Cron automatically sends
// `Authorization: Bearer <CRON_SECRET>` when CRON_SECRET is set in env.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const cutoff = new Date(
      Date.now() - HISTORY_RETENTION_DAYS * 24 * 60 * 60 * 1000,
    ).toISOString();

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("carousels")
      .delete()
      .lt("created_at", cutoff)
      .select("id");
    if (error) throw error;

    const deleted = data?.length ?? 0;
    console.info(`[cron] cleanup-carousels: deleted ${deleted} (< ${cutoff})`);
    return NextResponse.json({ ok: true, deleted, cutoff });
  } catch (err) {
    console.error("[cron] cleanup-carousels", err);
    return NextResponse.json({ ok: false, error: "cleanup failed" }, { status: 500 });
  }
}
