import "server-only";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isOwnerEmail } from "@/lib/config/app";

// Returns the current user iff they may access the admin panel: a super admin
// (owner allowlist, auto-promoted) OR a supervisor / is_admin profile.
// Call in every admin page/route — never trust the client.
export async function getAdminUser(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  if (isOwnerEmail(user.email)) {
    const admin = createAdminClient();
    await admin
      .from("profiles")
      .update({ is_admin: true })
      .eq("id", user.id)
      .eq("is_admin", false);
    return user;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin, role")
    .eq("id", user.id)
    .maybeSingle();

  return profile?.is_admin || profile?.role === "supervisor" ? user : null;
}

// Returns the current user iff they are a SUPER admin (owner allowlist).
// Use for sensitive actions (ban, roles, edit user, promo, settings).
export async function getSuperAdminUser(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return isOwnerEmail(user.email) ? user : null;
}
