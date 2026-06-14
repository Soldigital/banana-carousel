import { NextResponse } from "next/server";
import {
  checkTransaction,
  isPaidTransaction,
  transactionAmount,
  transactionReferenceId,
} from "@/lib/ipaymu/client";
import { verifyRef } from "@/lib/license/token";
import { grantEntitlementByEmail } from "@/lib/license/entitlement";
import { ensureAccountForEmail } from "@/lib/auth/account";
import { sendLicenseEmail } from "@/lib/email/send-license";
import { notifyTelegram } from "@/lib/telegram/notify";
import { captureError } from "@/lib/observability/sentry";
import { PRICE, formatIDR } from "@/lib/config/payment";

export const runtime = "nodejs";

// iPaymu server-to-server callback. We never trust its body blindly —
// we re-query the transaction status from iPaymu before issuing a license.
// Always responds 200 so iPaymu does not retry-storm.
export async function POST(req: Request) {
  try {
    let trxId = "";
    let referenceId = "";

    const ct = req.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      const b = await req.json();
      trxId = String(b.trx_id ?? b.transactionId ?? b.TransactionId ?? "");
      referenceId = String(b.reference_id ?? b.referenceId ?? "");
    } else {
      const f = await req.formData();
      trxId = String(f.get("trx_id") ?? f.get("transactionId") ?? "");
      referenceId = String(f.get("reference_id") ?? f.get("referenceId") ?? "");
    }

    if (!trxId) return NextResponse.json({ ok: true });

    const tx = await checkTransaction(trxId);
    if (!isPaidTransaction(tx)) return NextResponse.json({ ok: true });

    const ref = referenceId || transactionReferenceId(tx);
    const info = verifyRef(ref);
    if (!info) {
      // Paid, but we cannot resolve the buyer (e.g. LICENSE_SECRET rotated since
      // checkout). Returning 200 avoids an iPaymu retry-storm, but this is a
      // money-received-no-license case → alert the owner so they can issue it.
      console.error("[notify] PAID but unresolved buyer email", trxId);
      void captureError(new Error("ipaymu paid but referenceId unverifiable"), {
        scope: "ipaymu-notify",
        trxId,
      });
      await notifyTelegram(
        `⚠️ <b>iPaymu BAYAR tapi email tidak terverifikasi</b>\n` +
          `TRX: <code>${trxId}</code>\n` +
          `Terbitkan lisensi manual via panel admin.`,
      );
      return NextResponse.json({ ok: true });
    }
    const { email, plan, code } = info;

    const amount = transactionAmount(tx) || PRICE;
    // Beli = Daftar: make sure the buyer has an account (idempotent).
    try {
      await ensureAccountForEmail(email);
    } catch (e) {
      console.error("[notify] ensureAccount failed (non-fatal)", e);
    }
    // Grant entitlement (idempotent via trx_id) and reuse the issued token as
    // the license/access code we email.
    const { token, duplicate } = await grantEntitlementByEmail(email, {
      plan,
      promoCode: code,
      method: "ipaymu",
      trxId,
      amount,
    });

    if (!duplicate) {
      await sendLicenseEmail(email, token);
      await notifyTelegram(
        `💰 <b>Pembayaran iPaymu BERHASIL</b>\n` +
          `Email: <code>${email}</code>\n` +
          `Nominal: ${formatIDR(amount)}\n` +
          `TRX: <code>${trxId}</code>`,
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    // A failure here may mean a paid transaction wasn't fully processed (e.g. the
    // order insert threw). Stay 200 to avoid retry-storms, but escalate so the
    // owner can reconcile manually.
    console.error("[notify]", err);
    void captureError(err, { scope: "ipaymu-notify-fatal" });
    await notifyTelegram(
      `🚨 <b>iPaymu webhook gagal diproses</b>\n` +
        `Cek log Sentry/Vercel & terbitkan lisensi manual bila perlu.\n` +
        `<code>${err instanceof Error ? err.message : String(err)}</code>`,
    ).catch(() => {});
    return NextResponse.json({ ok: true });
  }
}
