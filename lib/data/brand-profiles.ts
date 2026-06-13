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
    | "secondary_color"
    | "target_audience"
    | "tone_of_voice"
    | "default_language"
    | "default_slide_count"
    | "username_position"
    | "username_size"
    | "username_style"
  >
>;

// Spec: max 3 brand profiles per user. Enforced on create only — existing
// profiles beyond this are never touched.
export const MAX_BRAND_PROFILES = 3;

const STR_FIELDS = [
  "name",
  "website",
  "instagram_username",
  "account_name",
  "cta_style",
  "brand_color",
  "default_style_preset_id",
  "logo_path",
  "secondary_color",
  "target_audience",
  "tone_of_voice",
  "default_language",
  "username_position",
  "username_size",
  "username_style",
] as const;

// Keep only known fields, trimmed; empty string => null. default_slide_count is
// an integer clamped to a sane carousel range.
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
  const dsc = b.default_slide_count;
  if (dsc === null || (typeof dsc === "string" && dsc.trim() === "")) {
    out.default_slide_count = null;
  } else if (dsc != null) {
    const n = Math.trunc(Number(dsc));
    if (Number.isFinite(n)) out.default_slide_count = Math.min(Math.max(n, 3), 10);
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

export async function getBrandProfile(
  userId: string,
  id: string,
): Promise<BrandProfile | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("brand_profiles")
    .select("*")
    .eq("user_id", userId)
    .eq("id", id)
    .maybeSingle();
  if (error) {
    console.error("[brand-profiles] get failed", error.message);
    return null;
  }
  return (data as BrandProfile) ?? null;
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
