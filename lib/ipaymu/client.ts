import crypto from "crypto";

// Server-only iPaymu v2 client. NEVER import from a client component —
// it reads IPAYMU_VA / IPAYMU_API_KEY.
//
// Signature scheme (v2):
//   bodyHash     = lowercase(sha256(jsonBody))
//   stringToSign = "POST:" + VA + ":" + bodyHash + ":" + APIKEY
//   signature    = hmacSHA256(stringToSign, APIKEY)  (hex)
// Headers: va, signature, timestamp (YYYYMMDDHHmmss), Content-Type: application/json

function config() {
  const va = process.env.IPAYMU_VA;
  const apiKey = process.env.IPAYMU_API_KEY;
  const mode = (process.env.IPAYMU_MODE || "sandbox").toLowerCase();
  if (!va || !apiKey) {
    throw new Error("IPAYMU_VA / IPAYMU_API_KEY are not set");
  }
  const base =
    mode === "production"
      ? "https://my.ipaymu.com/api/v2"
      : "https://sandbox.ipaymu.com/api/v2";
  return { va, apiKey, base };
}

function timestamp(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}${p(
    d.getHours(),
  )}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function ipaymuPost(path: string, body: Record<string, unknown>): Promise<any> {
  const { va, apiKey, base } = config();
  // jsonBody must be the EXACT string we both hash and send.
  const jsonBody = JSON.stringify(body);
  const bodyHash = crypto.createHash("sha256").update(jsonBody).digest("hex").toLowerCase();
  const stringToSign = `POST:${va}:${bodyHash}:${apiKey}`;
  const signature = crypto.createHmac("sha256", apiKey).update(stringToSign).digest("hex");

  const res = await fetch(`${base}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      va,
      signature,
      timestamp: timestamp(),
    },
    body: jsonBody,
  });
  return res.json().catch(() => null);
}

export interface CreatePaymentArgs {
  product: string;
  price: number;
  qty?: number;
  referenceId: string;
  buyerName?: string;
  buyerEmail?: string;
  returnUrl: string;
  notifyUrl: string;
  cancelUrl: string;
}

export async function createPayment(
  args: CreatePaymentArgs,
): Promise<{ url: string; sessionId: string }> {
  const body: Record<string, unknown> = {
    product: [args.product],
    qty: [args.qty ?? 1],
    price: [args.price],
    returnUrl: args.returnUrl,
    notifyUrl: args.notifyUrl,
    cancelUrl: args.cancelUrl,
    referenceId: args.referenceId,
  };
  if (args.buyerName) body.buyerName = args.buyerName;
  if (args.buyerEmail) body.buyerEmail = args.buyerEmail;

  const json = await ipaymuPost("/payment", body);
  if (!json || Number(json.Status) !== 200 || !json.Data?.Url) {
    throw new Error(`iPaymu payment failed: ${json?.Message ?? "unknown response"}`);
  }
  return { url: json.Data.Url, sessionId: String(json.Data.SessionID ?? "") };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function checkTransaction(transactionId: string): Promise<any> {
  return ipaymuPost("/transaction", { transactionId });
}

// iPaymu transaction status: Data.Status is numeric (1 = Berhasil/success,
// 0 = Pending, -2 = Gagal). Also accept text variants defensively.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isPaidTransaction(txJson: any): boolean {
  const d = txJson?.Data;
  if (!d) return false;
  if (typeof d.Status === "number") return d.Status === 1;
  const s = String(d.Status ?? d.StatusDesc ?? "").toLowerCase();
  return /berhasil|success|paid|settled/.test(s);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function transactionReferenceId(txJson: any): string {
  const d = txJson?.Data ?? {};
  return String(d.ReferenceId ?? d.referenceId ?? "");
}
