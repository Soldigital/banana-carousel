import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type RewardType = "commission" | "bonus";
export const COMMISSION_RATES = [0.2, 0.25, 0.3];
export const BONUS_DAYS_PER_REFERRAL = 30;

export interface Affiliate {
  id: string;
  user_id: string;
  code: string;
  reward_type: RewardType;
  commission_rate: number;
  referral_count: number;
  balance: number;
  created_at: string;
}

export interface AffiliateEarning {
  id: string;
  affiliate_id: string;
  buyer_email: string | null;
  order_trx: string | null;
  amount: number;
  paid: boolean;
  created_at: string;
}

type Admin = ReturnType<typeof createAdminClient>;

// --- user-facing (RLS server client) ---
export async function getMyAffiliate(): Promise<Affiliate | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("affiliates")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
  return (data as Affiliate) ?? null;
}

export async function listMyEarnings(userId: string): Promise<AffiliateEarning[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("affiliate_earnings")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);
  void userId;
  return (data as AffiliateEarning[]) ?? [];
}

function slug(email: string): string {
  return (email.split("@")[0] || "ref")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 12) || "ref";
}
function rand(n = 4): string {
  // crypto in node runtime
  return Array.from({ length: n }, () =>
    "abcdefghijklmnopqrstuvwxyz0123456789"[Math.floor(secureUnit() * 36)],
  ).join("");
}
function secureUnit(): number {
  const a = new Uint32Array(1);
  globalThis.crypto.getRandomValues(a);
  return a[0] / 2 ** 32;
}

// Enroll the current user as an affiliate (idempotent — returns existing).
export async function enrollAffiliate(
  userId: string,
  email: string,
): Promise<Affiliate | null> {
  const admin = createAdminClient();
  const existing = await admin
    .from("affiliates")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (existing.data) return existing.data as Affiliate;

  let code = slug(email);
  for (let i = 0; i < 6; i++) {
    const taken = await admin
      .from("affiliates")
      .select("id", { head: true, count: "exact" })
      .eq("code", code);
    if (!taken.count) break;
    code = `${slug(email)}${rand(4)}`;
  }
  const { data, error } = await admin
    .from("affiliates")
    .insert({ user_id: userId, code })
    .select("*")
    .single();
  if (error) {
    console.error("[affiliate] enroll failed", error.message);
    return null;
  }
  return data as Affiliate;
}

export async function setReward(
  userId: string,
  reward_type: RewardType,
  commission_rate: number,
): Promise<boolean> {
  const admin = createAdminClient();
  const rate = COMMISSION_RATES.includes(commission_rate) ? commission_rate : 0.2;
  const { error } = await admin
    .from("affiliates")
    .update({ reward_type, commission_rate: rate })
    .eq("user_id", userId);
  return !error;
}

// --- attribution ---
// At checkout: stash buyer→affiliate (by referral code) unless self-referral.
export async function attributeAtCheckout(
  buyerEmail: string,
  code: string,
): Promise<void> {
  try {
    const admin = createAdminClient();
    const { data: aff } = await admin
      .from("affiliates")
      .select("id, user_id")
      .eq("code", code)
      .maybeSingle();
    if (!aff) return;
    // No self-referral.
    const { data: me } = await admin
      .from("profiles")
      .select("email")
      .eq("id", aff.user_id)
      .maybeSingle();
    if (me?.email && me.email.toLowerCase() === buyerEmail.toLowerCase()) return;
    await admin
      .from("pending_referrals")
      .upsert({ email: buyerEmail, affiliate_id: aff.id }, { onConflict: "email" });
  } catch (e) {
    console.warn("[affiliate] attributeAtCheckout skipped", e);
  }
}

// On the paid grant (new-order path): consume the pending referral, attribute
// the order, and reward the affiliate. Best-effort — never blocks the grant.
export async function applyReferralOnGrant(
  admin: Admin,
  buyerEmail: string,
  orderTrx: string | null,
  orderAmount: number,
): Promise<void> {
  try {
    const { data: pend } = await admin
      .from("pending_referrals")
      .select("affiliate_id")
      .eq("email", buyerEmail)
      .maybeSingle();
    if (!pend) return;
    const affId = pend.affiliate_id as string;

    if (orderTrx) {
      await admin.from("orders").update({ referred_by: affId }).eq("trx_id", orderTrx);
    }
    const { data: aff } = await admin
      .from("affiliates")
      .select("id, user_id, reward_type, commission_rate")
      .eq("id", affId)
      .maybeSingle();
    if (aff) {
      // referral_count / balance are incremented IN THE DATABASE
      // (increment_affiliate_reward, migration 0016). Computing the new value in
      // JS and writing it back lost a commission whenever two conversions for
      // the same affiliate landed concurrently — both read the same old balance
      // and the second write overwrote the first. This is a payout ledger, so
      // the increment has to be atomic.
      if (aff.reward_type === "commission") {
        const amount = Math.round((aff.commission_rate ?? 0) * (orderAmount ?? 0));
        await admin.from("affiliate_earnings").insert({
          affiliate_id: affId,
          buyer_email: buyerEmail,
          order_trx: orderTrx,
          amount,
        });
        await admin.rpc("increment_affiliate_reward", {
          p_affiliate_id: affId,
          p_amount: amount,
        });
      } else {
        // bonus: extend the affiliate's own annual access (+days). Inert for
        // lifetime/founding (they never expire) — counted only.
        const { data: prof } = await admin
          .from("profiles")
          .select("tier, tier_expires_at")
          .eq("id", aff.user_id)
          .maybeSingle();
        if (prof?.tier === "pro_annual") {
          const cur = prof.tier_expires_at
            ? new Date(prof.tier_expires_at).getTime()
            : Date.now();
          const next = new Date(
            Math.max(cur, Date.now()) + BONUS_DAYS_PER_REFERRAL * 86400000,
          ).toISOString();
          await admin.from("profiles").update({ tier_expires_at: next }).eq("id", aff.user_id);
        }
        // Bonus reward: count the referral, no money moves.
        await admin.rpc("increment_affiliate_reward", {
          p_affiliate_id: affId,
          p_amount: 0,
        });
      }
    }
    await admin.from("pending_referrals").delete().eq("email", buyerEmail);
  } catch (e) {
    console.warn("[affiliate] applyReferralOnGrant skipped", e);
  }
}

// --- admin (service-role) ---
export async function listAffiliatesAdmin(): Promise<Affiliate[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("affiliates")
    .select("*")
    .order("balance", { ascending: false });
  return (data as Affiliate[]) ?? [];
}

// Mark all of an affiliate's earnings paid + zero the balance.
export async function markAffiliatePaid(affiliateId: string): Promise<boolean> {
  const admin = createAdminClient();
  await admin
    .from("affiliate_earnings")
    .update({ paid: true })
    .eq("affiliate_id", affiliateId)
    .eq("paid", false);
  const { error } = await admin
    .from("affiliates")
    .update({ balance: 0 })
    .eq("id", affiliateId);
  return !error;
}
