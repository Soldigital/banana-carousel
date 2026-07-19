import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export type PromoType = "fixed" | "percentage" | "trial" | "upgrade";

export interface PromoCode {
  id: string;
  code: string;
  name: string | null;
  type: PromoType;
  value: number;
  starts_at: string | null;
  ends_at: string | null;
  max_usage: number | null;
  per_user_limit: number;
  active: boolean;
  created_at: string;
}

export interface PromoInput {
  code?: string;
  name?: string | null;
  type?: PromoType;
  value?: number;
  starts_at?: string | null;
  ends_at?: string | null;
  max_usage?: number | null;
  per_user_limit?: number;
  active?: boolean;
}

const MIN_PRICE = 10000; // never discount below Rp10.000

type Admin = ReturnType<typeof createAdminClient>;

async function usage(admin: Admin, code: string, email?: string) {
  const totalQ = await admin
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("promo_code", code);
  let mine = 0;
  if (email) {
    const mineQ = await admin
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("promo_code", code)
      .eq("email", email);
    mine = mineQ.count ?? 0;
  }
  return { total: totalQ.count ?? 0, mine };
}

interface BaseValidation {
  ok: boolean;
  reason?: string;
  promo?: PromoCode;
}
async function validateBase(code: string, email: string): Promise<BaseValidation> {
  const c = (code ?? "").trim().toUpperCase();
  if (!c) return { ok: false, reason: "Kode kosong." };
  const admin = createAdminClient();
  const { data: promo } = await admin
    .from("promo_codes")
    .select("*")
    .eq("code", c)
    .maybeSingle();
  if (!promo || !promo.active) return { ok: false, reason: "Kode tidak valid." };
  const now = Date.now();
  if (promo.starts_at && now < new Date(promo.starts_at).getTime())
    return { ok: false, reason: "Kode belum berlaku." };
  if (promo.ends_at && now > new Date(promo.ends_at).getTime())
    return { ok: false, reason: "Kode sudah kedaluwarsa." };
  const { total, mine } = await usage(admin, c, email);
  if (promo.max_usage != null && total >= promo.max_usage)
    return { ok: false, reason: "Kuota kode sudah habis." };
  if (mine >= (promo.per_user_limit ?? 1))
    return { ok: false, reason: "Anda sudah memakai kode ini." };
  return { ok: true, promo: promo as PromoCode };
}

export interface DiscountResult {
  ok: boolean;
  reason?: string;
  discountedPrice?: number;
  type?: PromoType;
  label?: string;
}
// For checkout (fixed/percentage only).
export async function validateDiscount(
  code: string,
  email: string,
  basePrice: number,
): Promise<DiscountResult> {
  const b = await validateBase(code, email);
  if (!b.ok || !b.promo) return { ok: false, reason: b.reason };
  const p = b.promo;
  if (p.type !== "fixed" && p.type !== "percentage")
    return { ok: false, reason: "Kode ini bukan kode diskon." };
  const raw =
    p.type === "fixed" ? basePrice - p.value : basePrice * (1 - p.value / 100);
  const discountedPrice = Math.max(MIN_PRICE, Math.round(raw));
  return { ok: true, discountedPrice, type: p.type, label: p.name ?? p.code };
}

export interface RedeemResult {
  ok: boolean;
  reason?: string;
  type?: PromoType;
  value?: number;
}
// For free redemption (trial/upgrade only).
export async function validateRedeem(
  code: string,
  email: string,
): Promise<RedeemResult> {
  const b = await validateBase(code, email);
  if (!b.ok || !b.promo) return { ok: false, reason: b.reason };
  const p = b.promo;
  if (p.type !== "trial" && p.type !== "upgrade")
    return { ok: false, reason: "Kode ini untuk diskon, bukan klaim akses." };
  return { ok: true, type: p.type, value: p.value };
}

// --- admin CRUD ---
export async function listPromoCodes(): Promise<(PromoCode & { used: number })[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("promo_codes")
    .select("*")
    .order("created_at", { ascending: false });
  const codes = (data as PromoCode[]) ?? [];
  return Promise.all(
    codes.map(async (c) => ({ ...c, used: (await usage(admin, c.code)).total })),
  );
}

export async function createPromoCode(
  fields: PromoInput,
  createdBy: string,
): Promise<PromoCode | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("promo_codes")
    .insert({ ...normalize(fields), created_by: createdBy })
    .select("*")
    .single();
  if (error) {
    console.error("[promo] create failed", error.message);
    return null;
  }
  return data as PromoCode;
}

export async function updatePromoCode(
  id: string,
  fields: PromoInput,
): Promise<boolean> {
  const admin = createAdminClient();
  const { error } = await admin
    .from("promo_codes")
    .update(normalize(fields))
    .eq("id", id);
  if (error) console.error("[promo] update failed", error.message);
  return !error;
}

export async function deletePromoCode(id: string): Promise<boolean> {
  const admin = createAdminClient();
  const { error } = await admin.from("promo_codes").delete().eq("id", id);
  return !error;
}

function normalize(f: PromoInput): PromoInput {
  const out: PromoInput = { ...f };
  if (typeof out.code === "string") out.code = out.code.trim().toUpperCase();
  return out;
}
