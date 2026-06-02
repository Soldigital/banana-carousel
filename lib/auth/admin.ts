import "server-only";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isOwnerEmail } from "@/lib/config/app";

// Returns the current user iff they are an admin, else null. The owner email is
// always admin (and is auto-promoted in the profiles table on first check).
// Call this in EVERY admin page and admin API route — never trust the client.
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
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();

  return profile?.is_admin ? user : null;
}
