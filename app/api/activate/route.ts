import { NextResponse } from "next/server";
import {
  checkTransaction,
  isPaidTransaction,
  transactionReferenceId,
} from "@/lib/ipaymu/client";
import { issueLicense, verifyRef } from "@/lib/license/token";

export const runtime = "nodejs";

// Called by the /activate page after iPaymu redirects the buyer back.
// Confirms payment server-to-server, then issues the lifetime license token.
export async function POST(req: Request) {
  try {
    const { trxId } = await req.json();
    const id = String(trxId ?? "").trim();
    if (!id) {
      return NextResponse.json({ error: "trxId wajib." }, { status: 400 });
    }

    const tx = await checkTransaction(id);
    if (!isPaidTransaction(tx)) {
      return NextResponse.json({ paid: false });
    }

    const email = verifyRef(transactionReferenceId(tx))?.email || "buyer";
    const token = issueLicense(email);
    return NextResponse.json({ paid: true, token, email });
  } catch (err) {
    console.error("[activate]", err);
    return NextResponse.json(
      { error: "Gagal memverifikasi pembayaran." },
      { status: 500 },
    );
  }
}
