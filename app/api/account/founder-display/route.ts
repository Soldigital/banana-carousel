import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const DISPLAYS = ["name", "username", "number"];

// POST /api/account/founder-display { display, alias? } — a founding member sets
// how they appear on the public Founder Wall. Profile writes go via service role
// (profiles has no user-update RLS policy) after authenticating the caller.
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let display: unknown;
  let alias: unknown;
  try {
    const b = await req.json();
    display = b?.display;
    alias = b?.alias;
  } catch {
    return NextResponse.json({ error: "Request tidak valid." }, { status: 400 });
  }
  if (typeof display !== "string" || !DISPLAYS.includes(display)) {
    return NextResponse.json({ error: "Pilihan tampilan tidak valid." }, { status: 400 });
  }
  const cleanAlias =
    typeof alias === "string" ? alias.trim().slice(0, 40) || null : null;

  const admin = createAdminClient();
  // Only founders may set this; the update no-ops for non-founders (founder_number null).
  const { error } = await admin
    .from("profiles")
    .update({ founder_display: display, founder_alias: cleanAlias })
    .eq("id", user.id)
    .not("founder_number", "is", null);
  if (error) {
    return NextResponse.json({ error: "Gagal menyimpan." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
