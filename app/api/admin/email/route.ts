import { NextResponse } from "next/server";
import { getSuperAdminUser } from "@/lib/auth/admin";
import { sendEmail } from "@/lib/email/send-email";

export const runtime = "nodejs";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export async function POST(req: Request) {
  const admin = await getSuperAdminUser();
  if (!admin) return NextResponse.json({ error: "Bukan admin." }, { status: 403 });

  try {
    const { to, subject, message } = await req.json();
    const dest = String(to ?? "").trim().toLowerCase();
    if (!EMAIL_RE.test(dest)) {
      return NextResponse.json({ error: "Email tujuan tidak valid." }, { status: 400 });
    }
    if (!String(subject ?? "").trim() || !String(message ?? "").trim()) {
      return NextResponse.json({ error: "Subjek & pesan wajib." }, { status: 400 });
    }

    const html = `<div style="font-family:system-ui,Arial,sans-serif;max-width:480px;margin:0 auto;color:#111;line-height:1.6">${String(
      message,
    )
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/\n/g, "<br/>")}</div>`;

    await sendEmail(dest, String(subject), html);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin/email]", err);
    return NextResponse.json({ error: "Gagal mengirim email." }, { status: 500 });
  }
}
