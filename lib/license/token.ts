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

// referenceId carries the buyer email through iPaymu (echoed back in the
// webhook + transaction status), signed so it cannot be forged. Hex-encoded +
// "X" delimiter keeps it strictly alphanumeric for iPaymu's referenceId field.
export function signRef(email: string): string {
  const e = Buffer.from(email).toString("hex");
  return `${e}X${hmacHex("ref:" + e).slice(0, 16)}`;
}

export function verifyRef(ref: string): string | null {
  const idx = (ref || "").indexOf("X");
  if (idx < 0) return null;
  const e = ref.slice(0, idx);
  const sig = ref.slice(idx + 1);
  if (!safeEqual(sig, hmacHex("ref:" + e).slice(0, 16))) return null;
  try {
    return Buffer.from(e, "hex").toString("utf8");
  } catch {
    return null;
  }
}
