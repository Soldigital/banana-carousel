import { Resend } from "resend";

// Server-only. Sends the lifetime license key to the buyer via Resend.
// Silently no-ops (with a warning) if email env vars are unset, so the
// activation flow still works even before email is configured.
export async function sendLicenseEmail(
  to: string,
  licenseKey: string,
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.LICENSE_FROM_EMAIL;
  if (!apiKey || !from) {
    console.warn(
      "[email] RESEND_API_KEY / LICENSE_FROM_EMAIL not set — skipping license email",
    );
    return;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.bananacarousel.click";
  const resend = new Resend(apiKey);

  await resend.emails.send({
    from,
    to,
    subject: "Lisensi Banana Carousel Anda (Lifetime) 🍌",
    html: `
      <div style="font-family:system-ui,Arial,sans-serif;max-width:480px;margin:0 auto;color:#111">
        <h2 style="margin:0 0 12px">Terima kasih sudah membeli Banana Carousel 🎉</h2>
        <p style="margin:0 0 16px;line-height:1.6">
          Berikut <strong>License Key lifetime</strong> Anda. Simpan baik-baik —
          key ini yang membuka akses generator.
        </p>
        <pre style="background:#f4f4f5;border:1px solid #e4e4e7;border-radius:8px;padding:14px;font-size:13px;white-space:pre-wrap;word-break:break-all">${licenseKey}</pre>
        <p style="margin:16px 0;line-height:1.6">
          Buka <a href="${appUrl}/generate" style="color:#ca8a04">${appUrl}/generate</a>,
          klik <strong>"Sudah punya lisensi?"</strong>, lalu tempel key di atas.
        </p>
        <p style="margin:0;color:#71717a;font-size:12px">
          Email ini dikirim otomatis. Jika Anda tidak melakukan pembelian, abaikan saja.
        </p>
      </div>
    `,
  });
}
