import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { CarouselRecord } from "@/types/db";

// Carousel history retention window (kept in sync with the cleanup cron).
export const HISTORY_RETENTION_DAYS = 30;

// Lists the logged-in user's saved carousels from the last 30 days (RLS
// restricts to own rows).
export async function listCarousels(limit = 100): Promise<CarouselRecord[]> {
  const supabase = await createClient();
  const since = new Date(
    Date.now() - HISTORY_RETENTION_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();
  const { data, error } = await supabase
    .from("carousels")
    .select("*")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    console.error("[carousels] list failed", error.message);
    return [];
  }
  return (data as CarouselRecord[]) ?? [];
}
