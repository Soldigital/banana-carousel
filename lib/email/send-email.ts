import "server-only";
import { Resend } from "resend";

// Generic transactional email via Resend (admin "Kirim Email" feature).
// No-ops with a warning if email env is not configured.
export async function sendEmail(
  to: string,
  subject: string,
  html: string,
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.LICENSE_FROM_EMAIL;
  if (!apiKey || !from) {
    console.warn("[email] RESEND not configured — skipping sendEmail");
    return;
  }
  const resend = new Resend(apiKey);
  await resend.emails.send({ from, to, subject, html });
}
