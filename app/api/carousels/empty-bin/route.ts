import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { emptyRecycleBin } from "@/lib/data/carousels";

export const runtime = "nodejs";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

// POST /api/carousels/empty-bin — permanently delete all of the user's
// soft-deleted carousels.
export async function POST() {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ok = await emptyRecycleBin(user.id);
  if (!ok) {
    return NextResponse.json({ error: "Gagal mengosongkan." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
