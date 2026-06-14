import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { issueLicense, type CheckoutPlan } from "@/lib/license/token";
import { normalizeEmail } from "@/lib/config/app";
import { captureError } from "@/lib/observability/sentry";
import { ANNUAL_DAYS } from "@/lib/config/payment";
import type { OrderMethod } from "@/types/db";

// Server-side entitlement, keyed by EMAIL so it survives the "paid before
// signup" ordering. Reuses issueLicense() as the access code ("Kode Akses").
// Uses the service-role client (bypasses RLS) — only ever called from server
// route handlers / the iPaymu webhook.

interface GrantOpts {
  method: OrderMethod;
  trxId?: string | null;
  orderId?: string | null; // manual: the existing pending order to approve
  amount?: number;
  name?: string | null;
  whatsapp?: string | null;
  approvedBy?: string | null;
  plan?: CheckoutPlan; // 'lifetime' (default) | 'annual'
}

export interface GrantResult {
  token: string;
  duplicate: boolean; // already processed (idempotent no-op)
}

// Grants lifetime access. Idempotent for iPaymu (via trx_id) and for already
// approved manual orders.
export async function grantEntitlementByEmail(
  emailRaw: string,
  opts: GrantOpts,
): Promise<GrantResult> {
  const email = normalizeEmail(emailRaw);
  const admin = createAdminClient();
  const now = new Date().toISOString();

  // 1) Record / update the order (audit trail).
  if (opts.orderId) {
    // Manual approval path. Skip if already approved (idempotent).
    const { data: existing } = await admin
      .from("orders")
      .select("status, access_code")
      .eq("id", opts.orderId)
      .maybeSingle();
    if (existing?.status === "approved" && existing.access_code) {
      await setProfilePro(admin, email, existing.access_code);
      return { token: existing.access_code, duplicate: true };
    }
    const token = issueLicense(email);
    const { error: updErr } = await admin
      .from("orders")
      .update({
        status: "approved",
        access_code: token,
        approved_at: now,
        approved_by: opts.approvedBy ?? null,
      })
      .eq("id", opts.orderId);
    // Surface a failed approval to the admin route instead of reporting success.
    if (updErr) throw updErr;
    await setProfilePro(admin, email, token);
    return { token, duplicate: false };
  }

  // iPaymu path: dedupe by trx_id.
  if (opts.method === "ipaymu" && opts.trxId) {
    const { data: existing } = await admin
      .from("orders")
      .select("access_code")
      .eq("trx_id", opts.trxId)
      .maybeSingle();
    if (existing?.access_code) {
      await setProfilePro(admin, email, existing.access_code, opts.plan ?? "lifetime");
      return { token: existing.access_code, duplicate: true };
    }
  }

  const token = issueLicense(email);
  // CRITICAL: this order row is the only durable record of the purchase —
  // reconcileOnLogin() relies on it to grant access if setProfilePro misses.
  // If the insert fails we must NOT report success (the iPaymu webhook re-queries
  // + the caller can alert), otherwise the buyer pays with no recoverable record.
  const { error: insErr } = await admin.from("orders").insert({
    email,
    name: opts.name ?? null,
    whatsapp: opts.whatsapp ?? null,
    method: opts.method,
    status: "paid",
    amount: opts.amount ?? 0,
    trx_id: opts.trxId ?? null,
    access_code: token,
    approved_at: now,
  });
  if (insErr) throw insErr;
  const plan = opts.plan ?? "lifetime";
  await setProfilePro(admin, email, token, plan);
  if (plan === "annual") await extendAnnual(admin, email);
  return { token, duplicate: false };
}

// Set is_pro on the matching profile (if the account already exists). When the
// account is created later, reconcileOnLogin() picks it up.
async function setProfilePro(
  admin: ReturnType<typeof createAdminClient>,
  email: string,
  token: string,
  plan: CheckoutPlan = "lifetime",
): Promise<void> {
  // Best-effort: if the account doesn't exist yet (paid-before-signup) this
  // updates 0 rows, and reconcileOnLogin() flips is_pro on first dashboard load.
  // A genuine DB error, though, must not be swallowed silently.
  const { error } = await admin
    .from("profiles")
    .update({ is_pro: true, access_code: token })
    .eq("email", email);
  if (error) {
    console.error("[entitlement] setProfilePro failed", email, error.message);
    void captureError(error, { scope: "setProfilePro", email });
    return;
  }
  if (plan === "annual") {
    // Label only; the +365d expiry extension happens once per payment in the
    // grant's non-duplicate path (extendAnnual). Never assign a Founding slot
    // to an annual subscriber.
    await admin.from("profiles").update({ tier: "pro_annual" }).eq("email", email);
  } else {
    await assignTier(admin, email);
  }
}

// Extend a Pro Annual subscription by ANNUAL_DAYS from max(now, current expiry).
// Called exactly once per successful payment (the grant's deduped new path), so
// webhook retries can't double-extend. Best-effort; never throws.
async function extendAnnual(
  admin: ReturnType<typeof createAdminClient>,
  email: string,
): Promise<void> {
  try {
    const { data } = await admin
      .from("profiles")
      .select("tier_expires_at")
      .eq("email", email)
      .maybeSingle();
    const now = Date.now();
    const cur = data?.tier_expires_at ? new Date(data.tier_expires_at).getTime() : 0;
    const base = Math.max(now, cur);
    const next = new Date(base + ANNUAL_DAYS * 24 * 60 * 60 * 1000).toISOString();
    await admin
      .from("profiles")
      .update({ tier: "pro_annual", tier_expires_at: next })
      .eq("email", email);
  } catch (e) {
    console.warn("[entitlement] extendAnnual skipped", e);
  }
}

// Assign a paid tier label (Phase B). Atomically claims a Founding slot (1..100)
// via the DB function; if full, labels the buyer 'lifetime'. Idempotent and
// fully best-effort — never blocks the grant (is_pro already set above). No-ops
// gracefully if migration 0010 hasn't been applied.
async function assignTier(
  admin: ReturnType<typeof createAdminClient>,
  email: string,
): Promise<void> {
  try {
    const { data: num, error } = await admin.rpc("claim_founding_number", {
      p_email: email,
    });
    if (error) return; // function missing (pre-migration) — skip silently
    if (num == null) {
      // Slots full → label as lifetime, but never downgrade an existing founder.
      await admin
        .from("profiles")
        .update({ tier: "lifetime" })
        .eq("email", email)
        .neq("tier", "founding");
    }
  } catch {
    /* best-effort */
  }
}

// Called on dashboard load: links orphan orders to the account and flips
// is_pro if a paid/approved order exists for this email. Returns true if pro.
export async function reconcileOnLogin(
  userId: string,
  emailRaw: string,
): Promise<boolean> {
  const email = normalizeEmail(emailRaw);
  const admin = createAdminClient();

  // Attach any orders made before the account existed.
  await admin
    .from("orders")
    .update({ user_id: userId })
    .eq("email", email)
    .is("user_id", null);

  const { data: paid } = await admin
    .from("orders")
    .select("access_code, status, created_at")
    .eq("email", email)
    .in("status", ["paid", "approved"])
    .order("created_at", { ascending: false })
    .limit(1);

  if (paid && paid.length) {
    await admin
      .from("profiles")
      .update({ is_pro: true, access_code: paid[0].access_code })
      .eq("id", userId);
    return true;
  }
  return false;
}
