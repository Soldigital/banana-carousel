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
  code: string | null; // promo code, if one was applied at checkout
}

// referenceId carries the buyer email (+ plan + optional promo code) through
// iPaymu (echoed back in the webhook), signed so it cannot be forged. Hex
// segments + uppercase-letter delimiters keep it strictly alphanumeric (hex is
// lowercase, so X/A/C never collide with the data).
//   lifetime, no code → `${hexEmail}X${sig}`   (EXACTLY the legacy format)
//   annual,   no code → `${hexEmail}A${sig}`
//   with a promo code → `${hexEmail}${X|A}${hexCode}C${sig}`
export function signRef(
  email: string,
  plan: CheckoutPlan = "lifetime",
  code?: string | null,
): string {
  const e = Buffer.from(email).toString("hex");
  const delim = plan === "annual" ? "A" : "X";
  if (code) {
    const c = Buffer.from(code).toString("hex");
    const sig = hmacHex(`refC:${e}:${plan}:${c}`).slice(0, 16);
    return `${e}${delim}${c}C${sig}`;
  }
  // No code: byte-identical to the pre-promo format.
  return plan === "annual"
    ? `${e}A${hmacHex("refA:" + e).slice(0, 16)}`
    : `${e}X${hmacHex("ref:" + e).slice(0, 16)}`;
}

export function verifyRef(ref: string): RefInfo | null {
  const r = ref || "";
  const ix = r.indexOf("X");
  const ia = r.indexOf("A");
  if (ix < 0 && ia < 0) return null;
  let idx: number;
  let plan: CheckoutPlan;
  let domain: string;
  if (ia >= 0 && (ix < 0 || ia < ix)) {
    idx = ia;
    plan = "annual";
    domain = "refA:";
  } else {
    idx = ix;
    plan = "lifetime";
    domain = "ref:";
  }
  const e = r.slice(0, idx);
  const rest = r.slice(idx + 1);
  const cIdx = rest.indexOf("C");
  try {
    if (cIdx >= 0) {
      const c = rest.slice(0, cIdx);
      const sig = rest.slice(cIdx + 1);
      if (!safeEqual(sig, hmacHex(`refC:${e}:${plan}:${c}`).slice(0, 16))) return null;
      return {
        email: Buffer.from(e, "hex").toString("utf8"),
        plan,
        code: Buffer.from(c, "hex").toString("utf8"),
      };
    }
    if (!safeEqual(rest, hmacHex(domain + e).slice(0, 16))) return null;
    return { email: Buffer.from(e, "hex").toString("utf8"), plan, code: null };
  } catch {
    return null;
  }
}
