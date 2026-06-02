import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { CarouselRecord } from "@/types/db";

// Lists the logged-in user's saved carousels (RLS restricts to own rows).
export async function listCarousels(limit = 100): Promise<CarouselRecord[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("carousels")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    console.error("[carousels] list failed", error.message);
    return [];
  }
  return (data as CarouselRecord[]) ?? [];
}
