import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

// PATCH /api/keys/:id — enable/disable a key (ownership enforced by user_id).
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  let enabled: unknown;
  try {
    enabled = (await req.json())?.enabled;
  } catch {
    return NextResponse.json({ error: "Request tidak valid." }, { status: 400 });
  }
  if (typeof enabled !== "boolean") {
    return NextResponse.json({ error: "Field 'enabled' wajib boolean." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("ai_provider_keys")
    .update({ enabled })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: "Gagal memperbarui key." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

// DELETE /api/keys/:id — remove a key.
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const admin = createAdminClient();
  const { error } = await admin
    .from("ai_provider_keys")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: "Gagal menghapus key." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
