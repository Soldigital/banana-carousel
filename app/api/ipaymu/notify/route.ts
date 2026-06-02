import { NextResponse } from "next/server";
import {
  checkTransaction,
  isPaidTransaction,
  transactionAmount,
  transactionReferenceId,
} from "@/lib/ipaymu/client";
import { verifyRef } from "@/lib/license/token";
import { grantEntitlementByEmail } from "@/lib/license/entitlement";
import { sendLicenseEmail } from "@/lib/email/send-license";
import { notifyTelegram } from "@/lib/telegram/notify";
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
    const email = verifyRef(ref);
    if (!email) {
      console.warn("[notify] paid but could not resolve buyer email from referenceId");
      return NextResponse.json({ ok: true });
    }

    const amount = transactionAmount(tx) || PRICE;
    // Grant entitlement (idempotent via trx_id) and reuse the issued token as
    // the license/access code we email.
    const { token, duplicate } = await grantEntitlementByEmail(email, {
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
    console.error("[notify]", err);
    return NextResponse.json({ ok: true });
  }
}
