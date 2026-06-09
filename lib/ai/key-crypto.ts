import "server-only";
import crypto from "node:crypto";

// Server-side AES-256-GCM encryption for users' provider API keys at rest.
// The 32-byte key is derived from AI_KEYS_ENC_SECRET. Stored format (base64):
//   [ iv(12) | authTag(16) | ciphertext ]
// Plaintext keys are only ever decrypted in-memory inside the gateway and are
// NEVER logged.

const ALGO = "aes-256-gcm";

function encKey(): Buffer {
  const secret = process.env.AI_KEYS_ENC_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "AI_KEYS_ENC_SECRET is not set (need a long random string, e.g. openssl rand -hex 32).",
    );
  }
  // Normalize any-length secret to exactly 32 bytes.
  return crypto.createHash("sha256").update(secret).digest();
}

export function encryptKey(plaintext: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, encKey(), iv);
  const enc = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64");
}

export function decryptKey(ciphertextB64: string): string {
  const buf = Buffer.from(ciphertextB64, "base64");
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const data = buf.subarray(28);
  const decipher = crypto.createDecipheriv(ALGO, encKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString(
    "utf8",
  );
}

export function keyLast4(key: string): string {
  const t = key.trim();
  return t.length <= 4 ? t : t.slice(-4);
}
