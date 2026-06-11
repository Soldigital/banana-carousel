import type { CarouselOutput, GeneratorInput } from "@/types/carousel";

// Client-safe helper to call the server AI Gateway. No server imports here, so
// this is safe to import from "use client" components.

export class GatewayError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = "GatewayError";
  }
}

// Client safety-net timeout — above the server's 60s maxDuration so we never
// abort a request the server is still legitimately answering.
const CLIENT_TIMEOUT_MS = 65_000;

async function postOnce(
  input: GeneratorInput,
  requestId: string,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CLIENT_TIMEOUT_MS);
  try {
    return await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-request-id": requestId },
      body: JSON.stringify({ input }),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

function newRequestId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  }
}

export async function generateViaGateway(
  input: GeneratorInput,
): Promise<CarouselOutput> {
  // Stable id across the request + its one retry, for server-side correlation.
  const requestId = newRequestId();
  let res: Response;
  try {
    res = await postOnce(input, requestId);
  } catch (err) {
    // AbortError = our client-side safety timeout fired (request hung).
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new GatewayError(
        "Generate memakan waktu terlalu lama. Coba lagi, atau kurangi jumlah API key yang aktif.",
        "timeout",
      );
    }
    // True network-level rejection — retry once before giving up, to smooth
    // over transient connection resets. Do NOT blame the user's internet.
    try {
      await new Promise((r) => setTimeout(r, 800));
      res = await postOnce(input, requestId);
    } catch (err2) {
      if (err2 instanceof DOMException && err2.name === "AbortError") {
        throw new GatewayError(
          "Generate memakan waktu terlalu lama. Coba lagi, atau kurangi jumlah API key yang aktif.",
          "timeout",
        );
      }
      throw new GatewayError(
        "Koneksi ke server terputus saat generate. Coba lagi sebentar.",
        "network",
      );
    }
  }

  let data: { output?: CarouselOutput; error?: string; code?: string };
  try {
    data = await res.json();
  } catch {
    throw new GatewayError(
      "Server sedang sibuk memproses generate. Coba lagi sebentar.",
      "parse_error",
    );
  }

  if (!res.ok || !data.output) {
    throw new GatewayError(data.error || "Gagal generate carousel.", data.code);
  }
  return data.output;
}
