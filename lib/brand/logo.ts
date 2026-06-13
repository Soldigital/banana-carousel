import { createClient } from "@/lib/supabase/client";

export const BRAND_LOGOS_BUCKET = "brand-logos";
export const MAX_LOGO_BYTES = 2 * 1024 * 1024; // 2MB

// Public CDN URL for a stored logo path (bucket is public — no signed URL).
export function logoPublicUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  const supabase = createClient();
  return supabase.storage.from(BRAND_LOGOS_BUCKET).getPublicUrl(path).data
    .publicUrl;
}

function extOf(file: File): string {
  const fromType = file.type.split("/")[1];
  const ext = (fromType || file.name.split(".").pop() || "png").toLowerCase();
  return ext === "jpeg" ? "jpg" : ext.replace(/[^a-z0-9]/g, "") || "png";
}

// Upload a logo to the current user's own prefix. `kind` separates a profile's
// default logo from a per-project override. Returns the stored object path.
export async function uploadLogo(
  file: File,
  kind: "profile" | "override",
): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("File harus berupa gambar.");
  }
  if (file.size > MAX_LOGO_BYTES) {
    throw new Error("Ukuran logo maksimal 2MB.");
  }
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Silakan login dulu.");

  const path = `${user.id}/${kind}-${crypto.randomUUID()}.${extOf(file)}`;
  const { error } = await supabase.storage
    .from(BRAND_LOGOS_BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type });
  if (error) throw new Error(error.message);
  return path;
}

// Best-effort removal of a stored logo (ignored if it fails).
export async function removeLogo(path: string | null | undefined): Promise<void> {
  if (!path) return;
  try {
    const supabase = createClient();
    await supabase.storage.from(BRAND_LOGOS_BUCKET).remove([path]);
  } catch {
    /* best-effort */
  }
}
