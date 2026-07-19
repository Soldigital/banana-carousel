import { NextResponse } from "next/server";
import { verifyLicense } from "@/lib/license/token";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeEmail } from "@/lib/config/app";

export const runtime = "nodejs";

// Lets a logged-in user attach an existing HMAC license token (from the old
// localStorage flow / purchase email) to their account, flipping is_pro.
export async function POST(req: Request) {
  try {
    const { token } = await req.json();
    const raw = String(token ?? "").trim();
    const info = verifyLicense(raw);
    if (!info.valid) {
      return NextResponse.json(
        { claimed: false, error: "Lisensi tidak valid." },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { claimed: false, error: "Harus login dulu." },
        { status: 401 },
      );
    }

    // Owner key is always claimable; an email-bound token must match the account.
    if (!info.owner && normalizeEmail(info.email) !== normalizeEmail(user.email)) {
      return NextResponse.json(
        { claimed: false, error: "Lisensi ini terdaftar untuk email lain." },
        { status: 403 },
      );
    }

    const admin = createAdminClient();
    await admin
      .from("profiles")
      .update({ is_pro: true, access_code: raw })
      .eq("id", user.id);

    return NextResponse.json({ claimed: true });
  } catch (err) {
    console.error("[license/claim]", err);
    return NextResponse.json(
      { claimed: false, error: "Gagal mengklaim lisensi." },
      { status: 500 },
    );
  }
}
