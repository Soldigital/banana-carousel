// Shared error taxonomy for the AI Gateway. Mirrors the original GeminiError
// codes from lib/gemini/generate-carousel.ts so the existing UX/messages carry
// over, with two additions for the multi-provider world: "timeout".

export type GenErrorCode =
  | "invalid_key"
  | "rate_limit"
  | "model_not_found"
  | "parse_error"
  | "network"
  | "timeout"
  | "unknown";

export class GenError extends Error {
  constructor(
    message: string,
    public readonly code: GenErrorCode,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "GenError";
  }
}

function statusOf(err: unknown): number | null {
  if (err && typeof err === "object") {
    const s = (err as { status?: unknown; statusCode?: unknown }).status ??
      (err as { statusCode?: unknown }).statusCode;
    if (typeof s === "number") return s;
  }
  return null;
}

// Classify a raw provider/SDK error into our taxonomy. Works across the Gemini
// SDK, the OpenAI-compatible SDK (OpenRouter/Groq), and plain fetch errors.
export function classifyError(err: unknown): GenError {
  if (err instanceof GenError) return err;

  const status = statusOf(err);
  const msg =
    err instanceof Error ? err.message : typeof err === "string" ? err : "";
  const lower = msg.toLowerCase();

  if (
    status === 401 ||
    status === 403 ||
    lower.includes("api_key") ||
    lower.includes("api key") ||
    lower.includes("invalid key") ||
    lower.includes("invalid x-api-key") ||
    lower.includes("permission") ||
    lower.includes("unauthorized") ||
    lower.includes("no auth credentials") ||
    lower.includes("401") ||
    lower.includes("403")
  ) {
    return new GenError(
      "API key tidak valid atau tidak punya akses.",
      "invalid_key",
      err,
    );
  }
  if (
    status === 429 ||
    lower.includes("rate") ||
    lower.includes("quota") ||
    lower.includes("429") ||
    lower.includes("exhaust") ||
    lower.includes("insufficient")
  ) {
    return new GenError(
      "Quota / rate limit tercapai pada key ini.",
      "rate_limit",
      err,
    );
  }
  if (
    status === 404 ||
    lower.includes("not found") ||
    lower.includes("not available") ||
    lower.includes("does not exist") ||
    lower.includes("model") && lower.includes("invalid") ||
    lower.includes("404")
  ) {
    return new GenError(
      "Model yang diminta tidak tersedia untuk key ini.",
      "model_not_found",
      err,
    );
  }
  if (
    lower.includes("timeout") ||
    lower.includes("timed out") ||
    lower.includes("etimedout") ||
    lower.includes("aborted")
  ) {
    return new GenError("Permintaan timeout pada key ini.", "timeout", err);
  }
  if (
    lower.includes("network") ||
    lower.includes("fetch") ||
    lower.includes("econnreset") ||
    lower.includes("enotfound") ||
    (status !== null && status >= 500)
  ) {
    return new GenError(
      "Gagal terhubung ke provider AI.",
      "network",
      err,
    );
  }
  return new GenError(
    msg || "Terjadi kesalahan tidak terduga saat memanggil provider.",
    "unknown",
    err,
  );
}

// Human-facing aggregated message after the whole rotation is exhausted.
export function exhaustedMessage(last: GenError | null): string {
  switch (last?.code) {
    case "rate_limit":
      return "Semua API key Anda sedang kena rate limit / quota habis. Tambahkan key lain atau tunggu beberapa menit lalu coba lagi.";
    case "invalid_key":
      return "Semua API key gagal otentikasi. Cek kembali key Anda di dashboard.";
    case "model_not_found":
      return "Model tidak tersedia untuk key yang dikonfigurasi. Coba provider/key lain.";
    case "parse_error":
      return "Provider mengembalikan output yang tidak bisa diparse. Coba generate ulang — biasanya berhasil di percobaan kedua.";
    case "timeout":
      return "Semua percobaan timeout. Coba lagi sebentar.";
    default:
      return last?.message || "Semua provider AI gagal dipanggil. Coba lagi nanti.";
  }
}
