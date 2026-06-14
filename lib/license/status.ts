import "server-only";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { isOwnerEmail } from "@/lib/config/app";
import type { Tier } from "@/types/db";

export interface EntitlementStatus {
  loggedIn: boolean;
  entitled: boolean;
  owner: boolean;
  isAdmin: boolean;
  banned: boolean;
  email: string | null;
  accessCode: string | null;
  tier: Tier;
  founderNumber: number | null;
  // Phase C: renewal date for pro_annual (null for lifetime/founding/free).
  tierExpiresAt: string | null;
}

const LOGGED_OUT: EntitlementStatus = {
  loggedIn: false,
  entitled: false,
  owner: false,
  isAdmin: false,
  banned: false,
  email: null,
  accessCode: null,
  tier: "free",
  founderNumber: null,
  tierExpiresAt: null,
};

// Resolves the current user's entitlement using the RLS-scoped server client.
// entitled = owner email OR profiles.is_pro.
export async function getEntitlement(): Promise<EntitlementStatus> {
  if (!hasSupabaseEnv()) return LOGGED_OUT;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return LOGGED_OUT;

  // Try the full select (with Phase B tier columns); fall back to the original
  // columns if migration 0010 hasn't been applied yet, so the access gate can
  // never break on deploy/migration ordering.
  let profile:
    | {
        is_pro?: boolean;
        is_admin?: boolean;
        access_code?: string | null;
        banned?: boolean;
        tier?: Tier;
        founder_number?: number | null;
        tier_expires_at?: string | null;
      }
    | null = null;
  const full = await supabase
    .from("profiles")
    .select("is_pro, is_admin, access_code, banned, tier, founder_number, tier_expires_at")
    .eq("id", user.id)
    .maybeSingle();
  if (full.error) {
    const basic = await supabase
      .from("profiles")
      .select("is_pro, is_admin, access_code, banned")
      .eq("id", user.id)
      .maybeSingle();
    profile = basic.data;
  } else {
    profile = full.data;
  }

  const owner = isOwnerEmail(user.email);
  const banned = !!profile?.banned;
  const tier: Tier = profile?.tier ?? (profile?.is_pro ? "lifetime" : "free");
  const expiresAt = profile?.tier_expires_at ?? null;
  // Only pro_annual can lapse; lifetime/founding never expire (notExpired=true).
  const notExpired =
    tier !== "pro_annual" || (!!expiresAt && Date.now() < new Date(expiresAt).getTime());
  return {
    loggedIn: true,
    entitled: !banned && (owner || (!!profile?.is_pro && notExpired)),
    owner,
    isAdmin: owner || !!profile?.is_admin,
    banned,
    email: user.email ?? null,
    accessCode: profile?.access_code ?? null,
    tier,
    founderNumber: profile?.founder_number ?? null,
    tierExpiresAt: expiresAt,
  };
}
