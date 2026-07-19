import "server-only";
import { createClient } from "@/lib/supabase/server";
import type {
  CarouselRecord,
  CarouselSummary,
  CarouselStatus,
} from "@/types/db";

// How long a soft-deleted carousel stays in the Recycle Bin before the daily
// cron permanently removes it. Active history is kept indefinitely.
export const RECYCLE_BIN_RETENTION_DAYS = 30;

// Default page size for the virtualized history list.
export const HISTORY_PAGE_SIZE = 30;

export type HistorySort = "newest" | "oldest" | "most_used";

export interface SearchCarouselsOptions {
  q?: string;
  dateFrom?: string; // ISO
  dateTo?: string; // ISO
  stylePresetId?: string;
  status?: CarouselStatus;
  sort?: HistorySort;
  cursor?: string | null; // opaque, from a previous page
  limit?: number;
}

export interface CarouselPage {
  rows: CarouselSummary[];
  nextCursor: string | null;
}

// --- cursor helpers (opaque base64 of the keyset position) -------------------
interface Cursor {
  created_at: string;
  reuse_count: number;
}
function encodeCursor(row: CarouselSummary): string {
  const c: Cursor = { created_at: row.created_at, reuse_count: row.reuse_count };
  return Buffer.from(JSON.stringify(c)).toString("base64url");
}
function decodeCursor(s: string | null | undefined): Cursor | null {
  if (!s) return null;
  try {
    return JSON.parse(Buffer.from(s, "base64url").toString("utf8")) as Cursor;
  } catch {
    return null;
  }
}
// Escape ILIKE wildcards so user input is treated literally.
function escapeLike(s: string): string {
  return s.replace(/([\\%_])/g, "\\$1");
}

// ---------------------------------------------------------------------------
// Back-compat: full active records, newest first. Used by the existing
// dashboard grid (flag off). Now filters out soft-deleted rows and no longer
// caps by age (history is retained indefinitely). RLS restricts to own rows.
// ---------------------------------------------------------------------------
export async function listCarousels(limit = 100): Promise<CarouselRecord[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("carousels")
    .select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (!error) return (data as CarouselRecord[]) ?? [];

  // Resilience: if migration 0007 hasn't been applied yet the `deleted_at`
  // column won't exist and the filter above errors. Fall back to the original
  // newest-first query so the dashboard history never blanks out during the
  // deploy→migration window.
  const fallback = await supabase
    .from("carousels")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (fallback.error) {
    console.error("[carousels] list failed", fallback.error.message);
    return [];
  }
  return (fallback.data as CarouselRecord[]) ?? [];
}

// ---------------------------------------------------------------------------
// History v2: paginated search/filter/sort over the lightweight carousel_list
// view (no heavy input/output jsonb). userId is passed for explicit, index-
// friendly scoping (RLS also enforces ownership).
// ---------------------------------------------------------------------------
export async function searchCarousels(
  userId: string,
  opts: SearchCarouselsOptions = {},
): Promise<CarouselPage> {
  const supabase = await createClient();
  const limit = Math.min(Math.max(opts.limit ?? HISTORY_PAGE_SIZE, 1), 100);
  const sort: HistorySort = opts.sort ?? "newest";
  const cursor = decodeCursor(opts.cursor);

  let query = supabase
    .from("carousel_list")
    .select("*")
    .eq("user_id", userId)
    .is("deleted_at", null);

  if (opts.q?.trim()) {
    query = query.ilike("search_text", `%${escapeLike(opts.q.trim().toLowerCase())}%`);
  }
  if (opts.dateFrom) query = query.gte("created_at", opts.dateFrom);
  if (opts.dateTo) query = query.lte("created_at", opts.dateTo);
  if (opts.stylePresetId) query = query.eq("style_preset_id", opts.stylePresetId);
  if (opts.status) query = query.eq("status", opts.status);

  if (sort === "oldest") {
    query = query.order("created_at", { ascending: true }).order("id", { ascending: true });
    if (cursor) query = query.gt("created_at", cursor.created_at);
  } else if (sort === "most_used") {
    query = query
      .order("reuse_count", { ascending: false })
      .order("created_at", { ascending: false });
    if (cursor) {
      query = query.or(
        `reuse_count.lt.${cursor.reuse_count},and(reuse_count.eq.${cursor.reuse_count},created_at.lt.${cursor.created_at})`,
      );
    }
  } else {
    query = query.order("created_at", { ascending: false }).order("id", { ascending: false });
    if (cursor) query = query.lt("created_at", cursor.created_at);
  }

  const { data, error } = await query.limit(limit + 1);
  if (error) {
    console.error("[carousels] search failed", error.message);
    return { rows: [], nextCursor: null };
  }
  const all = (data as CarouselSummary[]) ?? [];
  const rows = all.slice(0, limit);
  const nextCursor =
    all.length > limit && rows.length > 0 ? encodeCursor(rows[rows.length - 1]) : null;
  return { rows, nextCursor };
}

// Recycle bin: soft-deleted rows, most-recently-deleted first.
export async function listRecycleBin(
  userId: string,
  opts: { cursor?: string | null; limit?: number } = {},
): Promise<CarouselPage> {
  const supabase = await createClient();
  const limit = Math.min(Math.max(opts.limit ?? HISTORY_PAGE_SIZE, 1), 100);
  const cursor = decodeCursor(opts.cursor);

  let query = supabase
    .from("carousel_list")
    .select("*")
    .eq("user_id", userId)
    .not("deleted_at", "is", null)
    .order("deleted_at", { ascending: false });
  if (cursor) query = query.lt("deleted_at", cursor.created_at);

  const { data, error } = await query.limit(limit + 1);
  if (error) {
    console.error("[carousels] recycle-bin failed", error.message);
    return { rows: [], nextCursor: null };
  }
  const all = (data as CarouselSummary[]) ?? [];
  const rows = all.slice(0, limit);
  const last = rows[rows.length - 1];
  const nextCursor =
    all.length > limit && last?.deleted_at
      ? Buffer.from(
          JSON.stringify({ created_at: last.deleted_at, reuse_count: 0 }),
        ).toString("base64url")
      : null;
  return { rows, nextCursor };
}

// Full record (with input/output) for opening a carousel into the generator.
export async function getCarouselById(
  userId: string,
  id: string,
): Promise<CarouselRecord | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("carousels")
    .select("*")
    .eq("user_id", userId)
    .eq("id", id)
    .maybeSingle();
  if (error) {
    console.error("[carousels] getById failed", error.message);
    return null;
  }
  return (data as CarouselRecord) ?? null;
}

// --- mutations (RLS scopes to owner; userId for explicit safety) -------------
export async function softDeleteCarousel(userId: string, id: string): Promise<boolean> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("carousels")
    .update({ deleted_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("id", id)
    .is("deleted_at", null);
  if (error) {
    console.error("[carousels] softDelete failed", error.message);
    return false;
  }
  return true;
}

export async function restoreCarousel(userId: string, id: string): Promise<boolean> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("carousels")
    .update({ deleted_at: null })
    .eq("user_id", userId)
    .eq("id", id);
  if (error) {
    console.error("[carousels] restore failed", error.message);
    return false;
  }
  return true;
}

export async function permanentDeleteCarousel(userId: string, id: string): Promise<boolean> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("carousels")
    .delete()
    .eq("user_id", userId)
    .eq("id", id);
  if (error) {
    console.error("[carousels] permanentDelete failed", error.message);
    return false;
  }
  return true;
}

export async function emptyRecycleBin(userId: string): Promise<boolean> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("carousels")
    .delete()
    .eq("user_id", userId)
    .not("deleted_at", "is", null);
  if (error) {
    console.error("[carousels] emptyRecycleBin failed", error.message);
    return false;
  }
  return true;
}

// Bump the reuse counter (drives the "Most Used" sort). Read-modify-write is
// fine here — it runs only when a user opens a carousel and a tiny race on the
// counter is harmless. RLS scopes to the owner.
export async function incrementReuse(userId: string, id: string): Promise<void> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("carousels")
    .select("reuse_count")
    .eq("user_id", userId)
    .eq("id", id)
    .maybeSingle();
  const current = (data?.reuse_count as number | undefined) ?? 0;
  await supabase
    .from("carousels")
    .update({ reuse_count: current + 1 })
    .eq("user_id", userId)
    .eq("id", id);
}
