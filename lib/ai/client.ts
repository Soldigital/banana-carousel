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

export async function generateViaGateway(
  input: GeneratorInput,
): Promise<CarouselOutput> {
  let res: Response;
  try {
    res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input }),
    });
  } catch {
    throw new GatewayError(
      "Gagal terhubung ke server. Cek koneksi internet Anda.",
      "network",
    );
  }

  let data: { output?: CarouselOutput; error?: string; code?: string };
  try {
    data = await res.json();
  } catch {
    throw new GatewayError("Respons server tidak valid.", "parse_error");
  }

  if (!res.ok || !data.output) {
    throw new GatewayError(data.error || "Gagal generate carousel.", data.code);
  }
  return data.output;
}
