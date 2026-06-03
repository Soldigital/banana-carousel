import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth/admin";
import { ensureAccountForEmail } from "@/lib/auth/account";
import { grantEntitlementByEmail } from "@/lib/license/entitlement";
import { sendLicenseEmail } from "@/lib/email/send-license";
import { normalizeEmail } from "@/lib/config/app";

export const runtime = "nodejs";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

// Manually add a (promo / free) user: create account + grant lifetime access +
// email the license key.
export async function POST(req: Request) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Bukan admin." }, { status: 403 });

  try {
    const { email, name, whatsapp } = await req.json();
    const e = normalizeEmail(email);
    if (!EMAIL_RE.test(e)) {
      return NextResponse.json({ error: "Email tidak valid." }, { status: 400 });
    }

    await ensureAccountForEmail(e, {
      name: String(name ?? "").trim() || null,
      whatsapp: String(whatsapp ?? "").trim() || null,
    });
    const { token } = await grantEntitlementByEmail(e, {
      method: "promo",
      amount: 0,
      name: String(name ?? "").trim() || null,
      whatsapp: String(whatsapp ?? "").trim() || null,
      approvedBy: admin.id,
    });
    await sendLicenseEmail(e, token);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin/add-user]", err);
    return NextResponse.json({ error: "Gagal menambah user." }, { status: 500 });
  }
}
