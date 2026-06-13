import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { BrandProfile } from "@/types/db";

// Editable fields of a brand profile (everything except ids/timestamps).
export type BrandProfileInput = Partial<
  Pick<
    BrandProfile,
    | "name"
    | "website"
    | "instagram_username"
    | "account_name"
    | "cta_style"
    | "brand_color"
    | "default_style_preset_id"
    | "logo_path"
  >
>;

export const MAX_BRAND_PROFILES = 20;

const STR_FIELDS = [
  "name",
  "website",
  "instagram_username",
  "account_name",
  "cta_style",
  "brand_color",
  "default_style_preset_id",
  "logo_path",
] as const;

// Keep only known string fields, trimmed; empty string => null.
export function sanitizeBrandInput(body: unknown): BrandProfileInput {
  const out: BrandProfileInput = {};
  if (!body || typeof body !== "object") return out;
  const b = body as Record<string, unknown>;
  for (const k of STR_FIELDS) {
    if (typeof b[k] === "string") {
      const v = (b[k] as string).trim().slice(0, 500);
      (out as Record<string, string | null>)[k] = v === "" ? null : v;
    } else if (b[k] === null) {
      (out as Record<string, string | null>)[k] = null;
    }
  }
  return out;
}

export async function listBrandProfiles(userId: string): Promise<BrandProfile[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("brand_profiles")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) {
    console.error("[brand-profiles] list failed", error.message);
    return [];
  }
  return (data as BrandProfile[]) ?? [];
}

export async function countBrandProfiles(userId: string): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("brand_profiles")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);
  return count ?? 0;
}

export async function createBrandProfile(
  userId: string,
  fields: BrandProfileInput,
): Promise<BrandProfile | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("brand_profiles")
    .insert({ ...fields, user_id: userId })
    .select("*")
    .single();
  if (error) {
    console.error("[brand-profiles] create failed", error.message);
    return null;
  }
  return data as BrandProfile;
}

export async function updateBrandProfile(
  userId: string,
  id: string,
  fields: BrandProfileInput,
): Promise<BrandProfile | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("brand_profiles")
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("id", id)
    .select("*")
    .single();
  if (error) {
    console.error("[brand-profiles] update failed", error.message);
    return null;
  }
  return data as BrandProfile;
}

export async function deleteBrandProfile(userId: string, id: string): Promise<boolean> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("brand_profiles")
    .delete()
    .eq("user_id", userId)
    .eq("id", id);
  if (error) {
    console.error("[brand-profiles] delete failed", error.message);
    return false;
  }
  return true;
}
