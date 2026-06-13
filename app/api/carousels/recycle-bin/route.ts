import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { listRecycleBin } from "@/lib/data/carousels";

export const runtime = "nodejs";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

// GET /api/carousels/recycle-bin?cursor= — soft-deleted carousels (newest first).
export async function GET(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const page = await listRecycleBin(user.id, {
    cursor: url.searchParams.get("cursor"),
  });
  return NextResponse.json(page);
}
