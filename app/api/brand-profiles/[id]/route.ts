import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
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

  const ok = await deleteBrandProfile(user.id, id);
  if (!ok) {
    return NextResponse.json({ error: "Gagal menghapus brand profile." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
