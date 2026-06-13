import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const BUCKET = "brand-logos";
const MAX_BYTES = 2 * 1024 * 1024; // 2MB

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

function extOf(type: string, name: string): string {
  const fromType = type.split("/")[1];
  const ext = (fromType || name.split(".").pop() || "png").toLowerCase();
  return ext === "jpeg" ? "jpg" : ext.replace(/[^a-z0-9]/g, "") || "png";
}

// POST /api/brand-profiles/logo  (multipart: file, kind?, oldPath?)
// Uploads via the service-role admin client (bypasses storage RLS, matching the
// proven manual-order proof-upload path). The object path is derived from the
// authenticated user's id, so a user can only ever write under their own prefix.
export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "Format request tidak valid (harus form upload)." },
      { status: 400 },
    );
  }

  const file = form.get("file");
  const kind = form.get("kind") === "override" ? "override" : "profile";
  const oldPath = form.get("oldPath");

  if (!(file instanceof Blob) || file.size === 0) {
    return NextResponse.json({ error: "File logo wajib diunggah." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Ukuran logo maksimal 2MB." }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Logo harus berupa gambar." }, { status: 400 });
  }

  const admin = createAdminClient();
  const name = file instanceof File ? file.name : "logo.png";
  const path = `${user.id}/${kind}-${randomUUID()}.${extOf(file.type, name)}`;
  const bytes = new Uint8Array(await file.arrayBuffer());

  const { error } = await admin.storage
    .from(BUCKET)
    .upload(path, bytes, { contentType: file.type, upsert: true });
  if (error) {
    return NextResponse.json({ error: "Gagal mengunggah logo." }, { status: 500 });
  }

  // Best-effort cleanup of a replaced object — only within the user's own prefix.
  if (typeof oldPath === "string" && oldPath.startsWith(`${user.id}/`)) {
    await admin.storage.from(BUCKET).remove([oldPath]).catch(() => {});
  }

  return NextResponse.json({ path });
}
