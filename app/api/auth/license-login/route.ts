import { NextResponse } from "next/server";
import { verifyLicense } from "@/lib/license/token";
import { ensureAccountForEmail } from "@/lib/auth/account";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { normalizeEmail } from "@/lib/config/app";

export const runtime = "nodejs";

// Log in using a license key: verifies the key, ensures the account exists,
// grants entitlement, then mints a real Supabase session (no email needed) via
// admin generateLink + verifyOtp so the user can use the dashboard & generator.
export async function POST(req: Request) {
  try {
    const { licenseKey } = await req.json();
    const info = verifyLicense(String(licenseKey ?? "").trim());
    if (!info.valid) {
      return NextResponse.json({ error: "License key tidak valid." }, { status: 400 });
    }
    const email = normalizeEmail(info.email);
    if (!email) {
      return NextResponse.json(
        { error: "Key ini tidak terikat email. Silakan login pakai email admin." },
        { status: 400 },
      );
    }

    const admin = createAdminClient();

    // Ensure account + grant access. Block banned users.
    await ensureAccountForEmail(email);
    const { data: profile } = await admin
      .from("profiles")
      .select("id, banned")
      .eq("email", email)
      .maybeSingle();
    if (profile?.banned) {
      return NextResponse.json({ error: "Akun dinonaktifkan." }, { status: 403 });
    }
    await admin
      .from("profiles")
      .update({ is_pro: true, access_code: String(licenseKey).trim() })
      .eq("email", email);

    // Mint a session without sending an email.
    const { data: link, error: linkErr } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email,
    });
    const tokenHash = link?.properties?.hashed_token;
    if (linkErr || !tokenHash) {
      throw new Error(linkErr?.message || "generateLink failed");
    }

    const supabase = await createClient();
    const { error: vErr } = await supabase.auth.verifyOtp({
      type: "magiclink",
      token_hash: tokenHash,
    });
    if (vErr) throw new Error(vErr.message);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[license-login]", err);
    return NextResponse.json(
      { error: "Gagal login dengan license key." },
      { status: 500 },
    );
  }
}
