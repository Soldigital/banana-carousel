import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { decryptKey } from "./key-crypto";
import { emptyKeysByProvider, isProviderId, type KeysByProvider } from "./types";

// Load + decrypt a user's enabled provider keys into the in-memory shape the
// gateway rotates over. Service-role read (ciphertext is sensitive); scoped to
// the given user. A key that fails to decrypt is skipped, not fatal.

export async function loadUserKeys(userId: string): Promise<KeysByProvider> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("ai_provider_keys")
    .select("id, provider, label, key_ciphertext, enabled")
    .eq("user_id", userId)
    .eq("enabled", true)
    .order("created_at", { ascending: true });

  const byProvider = emptyKeysByProvider();
  if (error || !data) return byProvider;

  for (const row of data) {
    if (!isProviderId(row.provider)) continue;
    try {
      byProvider[row.provider].push({
        id: row.id,
        provider: row.provider,
        label: row.label,
        plaintext: decryptKey(row.key_ciphertext),
      });
    } catch {
      // Undecryptable (e.g. secret rotated) — skip rather than crash generation.
    }
  }
  return byProvider;
}
