import crypto from "crypto";

// Server-only license utilities. NEVER import this from a client component.
// A license is a self-validating HMAC token (no database needed):
//   token = base64url(payloadJSON) + "." + base64url(hmacSHA256(payloadJSON))
// The owner bypass key (OWNER_LICENSE_KEY) is treated as always-valid.

const PLAN = "lifetime";

function secret(): string {
  const s = process.env.LICENSE_SECRET;
  if (!s) throw new Error("LICENSE_SECRET is not set");
  return s;
}

function hmacB64(data: string): string {
  return crypto.createHmac("sha256", secret()).update(data).digest("base64url");
}

function hmacHex(data: string): string {
  return crypto.createHmac("sha256", secret()).update(data).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

export interface LicenseInfo {
  valid: boolean;
  owner: boolean;
  email?: string;
  plan?: string;
}

export function issueLicense(email: string): string {
  const payload = JSON.stringify({ email, plan: PLAN, iat: Date.now() });
  const body = Buffer.from(payload).toString("base64url");
  return `${body}.${hmacB64(body)}`;
}

export function verifyLicense(token: string): LicenseInfo {
  const t = (token || "").trim();
  if (!t) return { valid: false, owner: false };

  // Owner bypass key (constant-time compare; guard length first to avoid throw).
  const ownerKey = process.env.OWNER_LICENSE_KEY;
  if (ownerKey && t.length === ownerKey.length && safeEqual(t, ownerKey)) {
    return { valid: true, owner: true, plan: PLAN };
  }

  const parts = t.split(".");
  if (parts.length !== 2) return { valid: false, owner: false };
  const [body, sig] = parts;
  if (!safeEqual(sig, hmacB64(body))) return { valid: false, owner: false };
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    return { valid: true, owner: false, email: payload.email, plan: payload.plan };
  } catch {
    return { valid: false, owner: false };
  }
}

export type CheckoutPlan = "lifetime" | "annual";

export interface RefInfo {
  email: string;
  plan: CheckoutPlan;
}

// referenceId carries the buyer email (+ plan) through iPaymu (echoed back in
// the webhook + transaction status), signed so it cannot be forged. Hex-encoded
// + a single-char delimiter keeps it strictly alphanumeric for iPaymu.
//   lifetime → `${hexEmail}X${sig}`  (EXACTLY the legacy format — unchanged)
//   annual   → `${hexEmail}A${sig}`  (distinct delimiter + distinct sig domain)
export function signRef(email: string, plan: CheckoutPlan = "lifetime"): string {
  const e = Buffer.from(email).toString("hex");
  if (plan === "annual") {
    return `${e}A${hmacHex("refA:" + e).slice(0, 16)}`;
  }
  return `${e}X${hmacHex("ref:" + e).slice(0, 16)}`;
}

export function verifyRef(ref: string): RefInfo | null {
  const r = ref || "";
  // Try annual ('A') first, then legacy lifetime ('X').
  for (const [delim, plan, domain] of [
    ["A", "annual", "refA:"],
    ["X", "lifetime", "ref:"],
  ] as const) {
    const idx = r.indexOf(delim);
    if (idx < 0) continue;
    const e = r.slice(0, idx);
    const sig = r.slice(idx + 1);
    if (!safeEqual(sig, hmacHex(domain + e).slice(0, 16))) continue;
    try {
      return { email: Buffer.from(e, "hex").toString("utf8"), plan };
    } catch {
      return null;
    }
  }
  return null;
}
