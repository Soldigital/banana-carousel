import { GoogleGenAI } from "@google/genai";
import { jsonrepair } from "jsonrepair";
import type { CarouselOutput, GeneratorInput } from "@/types/carousel";
import {
  SYSTEM_PROMPT,
  MASTER_PROMPT_PREAMBLE,
} from "@/lib/prompts/system-prompt";
import { buildUserPrompt } from "@/lib/prompts/build-user-prompt";
import {
  CarouselOutputSchema,
  GEMINI_RESPONSE_SCHEMA,
  type CarouselOutputZ,
} from "./schema";

const MODEL_CHAIN = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-2.5-flash-lite",
] as const;

type GeminiErrorCode =
  | "invalid_key"
  | "rate_limit"
  | "request_too_large"
  | "model_not_found"
  | "parse_error"
  | "network"
  | "unknown";

export class GeminiError extends Error {
  constructor(
    message: string,
    public readonly code: GeminiErrorCode,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "GeminiError";
  }
}

function classifyError(err: unknown): GeminiError {
  const msg =
    err instanceof Error ? err.message : typeof err === "string" ? err : "";
  const lower = msg.toLowerCase();

  if (
    lower.includes("api_key") ||
    lower.includes("api key") ||
    lower.includes("invalid key") ||
    lower.includes("permission") ||
    lower.includes("unauthorized") ||
    lower.includes("403") ||
    lower.includes("401")
  ) {
    return new GeminiError(
      "API key tidak valid atau tidak punya akses. Cek kembali API key Gemini Anda di https://aistudio.google.com/apikey",
      "invalid_key",
      err,
    );
  }
  if (
    lower.includes("not found") ||
    lower.includes("not available") ||
    lower.includes("does not exist") ||
    lower.includes("404")
  ) {
    return new GeminiError(
      "Model Gemini yang diminta tidak tersedia di akun Anda.",
      "model_not_found",
      err,
    );
  }
  // Checked before the rate_limit bucket: a 413/"request too large" means the
  // request itself didn't fit this account's tier — different remediation
  // than a rate limit (retrying won't help).
  if (lower.includes("request too large") || lower.includes("413")) {
    return new GeminiError(
      "Permintaan terlalu besar untuk tier akun key ini (bukan rate limit).",
      "request_too_large",
      err,
    );
  }
  if (
    lower.includes("rate") ||
    lower.includes("quota") ||
    lower.includes("429") ||
    lower.includes("exhaust")
  ) {
    return new GeminiError(
      "Quota Gemini API habis atau rate limit tercapai pada model ini.",
      "rate_limit",
      err,
    );
  }
  if (
    lower.includes("network") ||
    lower.includes("fetch") ||
    lower.includes("timeout") ||
    lower.includes("econnreset")
  ) {
    return new GeminiError(
      "Gagal terhubung ke Gemini API. Cek koneksi internet Anda dan coba lagi.",
      "network",
      err,
    );
  }
  return new GeminiError(
    msg || "Terjadi kesalahan tidak terduga saat memanggil Gemini.",
    "unknown",
    err,
  );
}

async function callGemini(
  ai: GoogleGenAI,
  model: string,
  userPrompt: string,
): Promise<string> {
  const response = await ai.models.generateContent({
    model,
    contents: userPrompt,
    config: {
      systemInstruction: SYSTEM_PROMPT,
      responseMimeType: "application/json",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      responseSchema: GEMINI_RESPONSE_SCHEMA as any,
      temperature: 0.9,
      topP: 0.95,
      maxOutputTokens: 16384,
    },
  });

  const text = response.text;
  if (!text) {
    throw new GeminiError(
      "Gemini mengembalikan respons kosong. Coba generate ulang.",
      "parse_error",
    );
  }
  return text;
}

function stripMarkdownFence(text: string): string {
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  return fenceMatch ? fenceMatch[1].trim() : text;
}

function parseJSON(text: string): unknown {
  const stripped = stripMarkdownFence(text.trim());

  // Layer 1: direct parse (happy path, ~99% of cases when API behaves)
  try {
    return JSON.parse(stripped);
  } catch {
    // fall through
  }

  // Layer 2: jsonrepair — handles trailing commas, smart quotes,
  // unescaped inner quotes, missing brackets, ellipsis truncation, etc.
  try {
    return JSON.parse(jsonrepair(stripped));
  } catch {
    // fall through
  }

  // Layer 3: extract first { to last } (strip any wrapper prose), then repair
  const firstBrace = stripped.indexOf("{");
  const lastBrace = stripped.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    const slice = stripped.slice(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(jsonrepair(slice));
    } catch {
      // fall through
    }
  }

  throw new GeminiError(
    "Gemini mengembalikan JSON yang tidak bisa diperbaiki bahkan setelah repair attempt.",
    "parse_error",
  );
}

async function callAndParseWithModelChain(
  ai: GoogleGenAI,
  userPrompt: string,
): Promise<CarouselOutputZ> {
  let lastError: GeminiError | null = null;

  for (const model of MODEL_CHAIN) {
    try {
      const text = await callGemini(ai, model, userPrompt);
      const parsed = parseJSON(text);
      const validation = CarouselOutputSchema.safeParse(parsed);
      if (!validation.success) {
        throw new GeminiError(
          `Output Gemini tidak sesuai schema: ${validation.error.issues
            .slice(0, 3)
            .map((i) => `${i.path.join(".")}: ${i.message}`)
            .join("; ")}`,
          "parse_error",
          validation.error,
        );
      }
      return validation.data;
    } catch (err) {
      const classified =
        err instanceof GeminiError ? err : classifyError(err);
      lastError = classified;

      if (classified.code === "invalid_key") {
        throw classified;
      }

      // Always log the RAW underlying error so the exact Google message is
      // visible in DevTools console for diagnosis (classified msg hides it).
      console.warn(
        `[Gemini] Model "${model}" gagal (${classified.code}):`,
        classified.message,
        "\nRaw error:",
        classified.cause ?? err,
      );
    }
  }

  const triedModels = MODEL_CHAIN.join(", ");
  const rawMsg = rawErrorMessage(lastError?.cause);
  if (lastError?.code === "rate_limit") {
    throw new GeminiError(
      `Quota Gemini Anda sudah tercapai untuk semua model yang dicoba (${triedModels}). Kalau ini key yang baru dibuat: quota Google kadang terikat ke akun/project Google Cloud, bukan cuma ke key ini — jadi key baru bisa langsung kena walau belum pernah dipakai. Coba tunggu beberapa menit, atau buat key dari project Google yang berbeda, lalu coba lagi.`,
      "rate_limit",
      lastError.cause,
    );
  }
  if (lastError?.code === "request_too_large") {
    throw new GeminiError(
      `Permintaan ke Gemini terlalu besar untuk tier akun key ini (dicoba: ${triedModels}). Ini bukan soal rate limit.${rawMsg ? ` Pesan asli Google: ${rawMsg}` : ""}`,
      "request_too_large",
      lastError.cause,
    );
  }
  if (lastError?.code === "parse_error") {
    throw new GeminiError(
      `Semua model Gemini mengembalikan JSON yang tidak bisa diparse (dicoba: ${triedModels}). Coba generate ulang — biasanya berhasil di percobaan kedua.${rawMsg ? ` (detail: ${rawMsg})` : ""}`,
      "parse_error",
      lastError.cause,
    );
  }
  if (lastError?.code === "model_not_found") {
    throw new GeminiError(
      `Model Gemini tidak tersedia untuk API key ini (dicoba: ${triedModels}). Pastikan: (1) API key dibuat di Google AI Studio (aistudio.google.com/apikey), BUKAN Vertex AI; (2) "Generative Language API" aktif; (3) API key tidak punya pembatasan model.${rawMsg ? ` Pesan asli Google: ${rawMsg}` : ""}`,
      "model_not_found",
      lastError.cause,
    );
  }
  throw new GeminiError(
    `Semua model Gemini gagal dipanggil (dicoba: ${triedModels}).${rawMsg ? ` Pesan asli Google: ${rawMsg}` : ""}`,
    lastError?.code ?? "unknown",
    lastError?.cause,
  );
}

function rawErrorMessage(cause: unknown): string {
  if (!cause) return "";
  if (cause instanceof Error) return cause.message.slice(0, 300);
  if (typeof cause === "string") return cause.slice(0, 300);
  try {
    return JSON.stringify(cause).slice(0, 300);
  } catch {
    return "";
  }
}

export async function generateCarousel(
  input: GeneratorInput,
  apiKey: string,
): Promise<CarouselOutput> {
  if (!apiKey || apiKey.trim().length < 10) {
    throw new GeminiError(
      "API key Gemini belum dimasukkan atau tidak valid. Buka Settings untuk menambahkannya.",
      "invalid_key",
    );
  }

  const ai = new GoogleGenAI({ apiKey });
  const userPrompt = buildUserPrompt(input);

  const data = await callAndParseWithModelChain(ai, userPrompt);

  if (data.slides.length > input.slideCount) {
    data.slides = data.slides.slice(0, input.slideCount);
  }
  data.slides = data.slides.map((slide, idx) => ({
    ...slide,
    slide_num: idx + 1,
  }));

  data.gemini_ready_prompt = `${MASTER_PROMPT_PREAMBLE} ${data.carousel_title}\n\n${data.gemini_ready_prompt}`;

  return data;
}
