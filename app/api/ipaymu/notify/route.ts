import { NextResponse } from "next/server";
import {
  checkTransaction,
  isPaidTransaction,
  transactionReferenceId,
} from "@/lib/ipaymu/client";
import { issueLicense, verifyRef } from "@/lib/license/token";
import { sendLicenseEmail } from "@/lib/email/send-license";

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

    const license = issueLicense(email);
    await sendLicenseEmail(email, license);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[notify]", err);
    return NextResponse.json({ ok: true });
  }
}
