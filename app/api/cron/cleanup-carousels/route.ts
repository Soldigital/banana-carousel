import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { RECYCLE_BIN_RETENTION_DAYS } from "@/lib/data/carousels";

export const runtime = "nodejs";

// Daily Vercel Cron job. Active history is now kept indefinitely; this job only
// PERMANENTLY removes carousels that have sat in the Recycle Bin (soft-deleted)
// longer than the retention window — implementing the "auto permanent delete
// after 30 days" rule. It never touches active rows (deleted_at IS NULL), so no
// in-use history is ever lost. Vercel Cron sends `Authorization: Bearer
// <CRON_SECRET>` when CRON_SECRET is set in env.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const cutoff = new Date(
      Date.now() - RECYCLE_BIN_RETENTION_DAYS * 24 * 60 * 60 * 1000,
    ).toISOString();

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("carousels")
      .delete()
      .not("deleted_at", "is", null)
      .lt("deleted_at", cutoff)
      .select("id");
    if (error) throw error;

    const deleted = data?.length ?? 0;
    console.info(
      `[cron] cleanup-carousels: permanently removed ${deleted} from recycle bin (deleted before ${cutoff})`,
    );
    return NextResponse.json({ ok: true, deleted, cutoff });
  } catch (err) {
    console.error("[cron] cleanup-carousels", err);
    return NextResponse.json({ ok: false, error: "cleanup failed" }, { status: 500 });
  }
}
