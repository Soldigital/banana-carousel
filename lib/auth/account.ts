import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeEmail } from "@/lib/config/app";

// "Beli = Daftar": ensures a passwordless Supabase account exists for an email
// (created confirmed, so the buyer can log in via Magic Link), and stores their
// WhatsApp on the profile. Idempotent — safe to call on every purchase.
// Returns the user's id, or null if it can't be resolved.
export async function ensureAccountForEmail(
  emailRaw: string,
  opts: { name?: string | null; whatsapp?: string | null } = {},
): Promise<string | null> {
  const email = normalizeEmail(emailRaw);
  if (!email) return null;
  const admin = createAdminClient();

  let userId: string | null = null;

  const { data: created, error } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: {
      name: opts.name ?? null,
      whatsapp: opts.whatsapp ?? null,
    },
  });

  if (created?.user) {
    userId = created.user.id;
  } else {
    // Likely already registered — resolve id from the profile (created by the
    // on_auth_user_created trigger when the account first appeared).
    if (error) console.info("[account] createUser skipped:", error.message);
    const { data: profile } = await admin
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();
    userId = profile?.id ?? null;
  }

  // Persist WhatsApp on the profile (best-effort).
  if (opts.whatsapp && userId) {
    await admin
      .from("profiles")
      .update({ whatsapp: opts.whatsapp })
      .eq("id", userId);
  }

  return userId;
}
