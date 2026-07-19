import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { searchCarousels, type HistorySort } from "@/lib/data/carousels";
import type { CarouselStatus } from "@/types/db";

export const runtime = "nodejs";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

const SORTS: HistorySort[] = ["newest", "oldest", "most_used"];
const STATUSES: CarouselStatus[] = ["success", "failed", "draft"];

// GET /api/carousels?q=&dateFrom=&dateTo=&style=&status=&sort=&cursor=&limit=
// Paginated, filtered, sorted history summaries (no heavy output jsonb).
export async function GET(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const sortParam = url.searchParams.get("sort") as HistorySort | null;
  const statusParam = url.searchParams.get("status") as CarouselStatus | null;

  const page = await searchCarousels(user.id, {
    q: url.searchParams.get("q") ?? undefined,
    dateFrom: url.searchParams.get("dateFrom") ?? undefined,
    dateTo: url.searchParams.get("dateTo") ?? undefined,
    stylePresetId: url.searchParams.get("style") ?? undefined,
    status: statusParam && STATUSES.includes(statusParam) ? statusParam : undefined,
    sort: sortParam && SORTS.includes(sortParam) ? sortParam : "newest",
    cursor: url.searchParams.get("cursor"),
  });

  return NextResponse.json(page);
}
