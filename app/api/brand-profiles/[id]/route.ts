import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getBrandProfile,
  updateBrandProfile,
  deleteBrandProfile,
  sanitizeBrandInput,
} from "@/lib/data/brand-profiles";

export const runtime = "nodejs";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

// PATCH /api/brand-profiles/:id — update fields.
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  let fields;
  try {
    fields = sanitizeBrandInput(await req.json());
  } catch {
    return NextResponse.json({ error: "Request tidak valid." }, { status: 400 });
  }
  if ("name" in fields && !fields.name) {
    return NextResponse.json({ error: "Nama brand tidak boleh kosong." }, { status: 400 });
  }

  const profile = await updateBrandProfile(user.id, id, fields);
  if (!profile) {
    return NextResponse.json({ error: "Gagal memperbarui brand profile." }, { status: 500 });
  }
  return NextResponse.json({ profile });
}

// DELETE /api/brand-profiles/:id
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  // Grab the logo path before deleting so we can clean up the stored object.
  const profile = await getBrandProfile(user.id, id);

  const ok = await deleteBrandProfile(user.id, id);
  if (!ok) {
    return NextResponse.json({ error: "Gagal menghapus brand profile." }, { status: 500 });
  }

  // Best-effort removal of the logo object (admin bypasses storage RLS).
  if (profile?.logo_path?.startsWith(`${user.id}/`)) {
    await createAdminClient()
      .storage.from("brand-logos")
      .remove([profile.logo_path])
      .catch(() => {});
  }
  return NextResponse.json({ ok: true });
}
