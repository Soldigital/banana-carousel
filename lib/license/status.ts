import "server-only";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { isOwnerEmail } from "@/lib/config/app";

export interface EntitlementStatus {
  loggedIn: boolean;
  entitled: boolean;
  owner: boolean;
  isAdmin: boolean;
  banned: boolean;
  email: string | null;
  accessCode: string | null;
}

const LOGGED_OUT: EntitlementStatus = {
  loggedIn: false,
  entitled: false,
  owner: false,
  isAdmin: false,
  banned: false,
  email: null,
  accessCode: null,
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

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_pro, is_admin, access_code, banned")
    .eq("id", user.id)
    .maybeSingle();

  const owner = isOwnerEmail(user.email);
  const banned = !!profile?.banned;
  return {
    loggedIn: true,
    entitled: !banned && (owner || !!profile?.is_pro),
    owner,
    isAdmin: owner || !!profile?.is_admin,
    banned,
    email: user.email ?? null,
    accessCode: profile?.access_code ?? null,
  };
}
