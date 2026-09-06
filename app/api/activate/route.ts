import { NextResponse } from "next/server";
import { checkTransaction, isPaidTransaction } from "@/lib/ipaymu/client";

export const runtime = "nodejs";

// Called by the /activate page after iPaymu redirects the buyer back.
// Confirms payment status server-to-server — and NOTHING ELSE.
//
// This route is unauthenticated and cannot be otherwise: the buyer may not have
// a session yet. It therefore must never hand out credentials. It previously
// returned {token, email}, which meant anyone who guessed a paid trxId (numeric
// and enumerable) received the buyer's email plus a valid lifetime license
// token bound to them — and /api/auth/license-login converts such a token into
// a real Supabase session, i.e. full takeover of a paying customer's account.
//
// Delivery of the license is the webhook's job (app/api/ipaymu/notify), which
// verifies the transaction against iPaymu's own record, creates the account and
// emails the key. Here we only answer "has this transaction been paid?".
export async function POST(req: Request) {
  try {
    const { trxId } = await req.json();
    const id = String(trxId ?? "").trim();
    if (!id) {
      return NextResponse.json({ error: "trxId wajib." }, { status: 400 });
    }

    const tx = await checkTransaction(id);
    return NextResponse.json({ paid: isPaidTransaction(tx) });
  } catch (err) {
    console.error("[activate]", err);
    return NextResponse.json(
      { error: "Gagal memverifikasi pembayaran." },
      { status: 500 },
    );
  }
}
