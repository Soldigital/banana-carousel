import { createClient } from "@/lib/supabase/client";

export const BRAND_LOGOS_BUCKET = "brand-logos";
export const MAX_LOGO_BYTES = 2 * 1024 * 1024; // 2MB

// Public CDN URL for a stored logo path (bucket is public — no signed URL,
// no auth needed; getPublicUrl just builds the URL string).
export function logoPublicUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  const supabase = createClient();
  return supabase.storage.from(BRAND_LOGOS_BUCKET).getPublicUrl(path).data
    .publicUrl;
}

// Upload a logo through the server (service-role admin), which bypasses storage
// RLS — the same proven path as manual-order proof uploads. `kind` separates a
// profile's default logo from a per-project override; `oldPath` (optional) is a
// previous object to clean up on replace. Returns the stored object path.
export async function uploadLogo(
  file: File,
  kind: "profile" | "override",
  oldPath?: string | null,
): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("File harus berupa gambar.");
  }
  if (file.size > MAX_LOGO_BYTES) {
    throw new Error("Ukuran logo maksimal 2MB.");
  }
  const body = new FormData();
  body.append("file", file);
  body.append("kind", kind);
  if (oldPath) body.append("oldPath", oldPath);

  const res = await fetch("/api/brand-profiles/logo", { method: "POST", body });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Gagal mengunggah logo.");
  return data.path as string;
}
