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

  // Persist name / WhatsApp on the profile (best-effort) — FILL ONLY, never
  // overwrite. This helper is reached from UNAUTHENTICATED routes (/api/checkout,
  // /api/manual-order) where the target account is resolved purely from a
  // client-supplied email. Blindly patching would let anyone rewrite any user's
  // name and WhatsApp number through the service-role client — precisely the
  // write that RLS deliberately forbids (profiles has no user UPDATE policy).
  // Writing only into empty columns keeps the "capture buyer details" behaviour
  // for genuinely new buyers while making an established profile immutable from
  // these routes. The order row still records the submitted name/whatsapp
  // verbatim, so nothing is lost for admin review.
  if (userId && (opts.whatsapp || opts.name)) {
    const { data: current } = await admin
      .from("profiles")
      .select("name, whatsapp")
      .eq("id", userId)
      .maybeSingle();

    const patch: { whatsapp?: string; name?: string } = {};
    if (opts.whatsapp && !current?.whatsapp) patch.whatsapp = opts.whatsapp;
    if (opts.name && !current?.name) patch.name = opts.name;

    if (Object.keys(patch).length) {
      await admin.from("profiles").update(patch).eq("id", userId);
    }
  }

  return userId;
}
