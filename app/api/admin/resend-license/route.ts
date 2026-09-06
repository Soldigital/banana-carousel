import { NextResponse } from "next/server";
import { getSuperAdminUser } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { issueLicense } from "@/lib/license/token";
import { sendLicenseEmail } from "@/lib/email/send-license";
import { normalizeEmail } from "@/lib/config/app";

export const runtime = "nodejs";

// Resend the user's license key to their email (issuing one if missing).
export async function POST(req: Request) {
  const admin = await getSuperAdminUser();
  if (!admin) return NextResponse.json({ error: "Bukan admin." }, { status: 403 });

  try {
    const { email } = await req.json();
    const e = normalizeEmail(email);
    if (!e) return NextResponse.json({ error: "Email wajib." }, { status: 400 });

    const db = createAdminClient();
    const { data: profile } = await db
      .from("profiles")
      .select("id, access_code")
      .eq("email", e)
      .maybeSingle();

    let token = profile?.access_code;
    if (!token) {
      token = issueLicense(e);
      if (profile?.id) {
        await db
          .from("profiles")
          .update({ access_code: token, is_pro: true })
          .eq("id", profile.id);
      }
    }

    await sendLicenseEmail(e, token);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin/resend-license]", err);
    return NextResponse.json({ error: "Gagal mengirim ulang." }, { status: 500 });
  }
}
