// Shared error taxonomy for the AI Gateway. Mirrors the original GeminiError
// codes from lib/gemini/generate-carousel.ts so the existing UX/messages carry
// over, with two additions for the multi-provider world: "timeout".

export type GenErrorCode =
  | "invalid_key"
  | "rate_limit"
  | "request_too_large"
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
    // Which model id produced this error, when known. Recorded in
    // ai_key_health so a retired/renamed model is visible in the data instead
    // of having to be inferred from latency.
    public model?: string | null,
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
  // Checked BEFORE the rate_limit bucket below: a 413 means the request/
  // reservation itself was too large for this account's tier — a distinct
  // condition from "you've been rate-limited," with different remediation
  // (it won't help to just wait and retry).
  if (status === 413 || lower.includes("request too large")) {
    return new GenError(
      "Permintaan terlalu besar untuk tier akun key ini (reservasi output token melebihi batas). Ini BUKAN rate limit — coba lagi biasanya tidak membantu.",
      "request_too_large",
      err,
    );
  }
  if (
    status === 429 ||
    lower.includes("rate") ||
    lower.includes("quota") ||
    lower.includes("429") ||
    lower.includes("exhaust") ||
    lower.includes("insufficient") ||
    // Groq/OpenAI per-minute token limits surface in messages mentioning
    // tokens-per-minute — treat as a transient rate cap.
    lower.includes("tokens per minute") ||
    lower.includes("tpm")
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
      return "Semua API key Anda sedang kena rate limit / quota habis. Kalau ini key yang baru saja dibuat: quota Google/Groq/OpenRouter kadang terikat ke akun atau project, bukan cuma ke key itu sendiri — jadi key baru bisa langsung kena walau belum pernah dipakai. Coba: (1) tunggu beberapa menit lalu coba lagi, (2) buat key dari project Google Cloud / akun yang berbeda, atau (3) tambahkan key dari provider lain di dashboard.";
    case "request_too_large":
      return "Permintaan ke provider terlalu besar untuk tier akun key ini (bukan soal rate limit / quota habis). Coba kurangi jumlah slide, atau tambahkan key dari provider/model lain di dashboard.";
    case "invalid_key":
      return "Semua API key gagal otentikasi. Cek kembali key Anda di dashboard.";
    case "model_not_found":
      return "Model tidak tersedia untuk key yang dikonfigurasi. Coba provider/key lain.";
    case "parse_error":
      return "Provider mengembalikan output yang tidak bisa diparse. Coba generate ulang — biasanya berhasil di percobaan kedua.";
    case "timeout":
      return "Semua percobaan timeout — provider sedang lambat/sibuk. Coba lagi sebentar, atau tambahkan key dari provider lain (mis. Groq yang biasanya tercepat) di dashboard agar generate lebih andal.";
    default:
      return last?.message || "Semua provider AI gagal dipanggil. Coba lagi nanti.";
  }
}
