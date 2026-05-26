import { GoogleGenAI } from "@google/genai";
import type { CarouselOutput, GeneratorInput } from "@/types/carousel";
import {
  SYSTEM_PROMPT,
  MASTER_PROMPT_PREAMBLE,
} from "@/lib/prompts/system-prompt";
import { buildUserPrompt } from "@/lib/prompts/build-user-prompt";
import {
  CarouselOutputSchema,
  GEMINI_RESPONSE_SCHEMA,
} from "./schema";

const MODEL_CHAIN = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
] as const;

type GeminiErrorCode =
  | "invalid_key"
  | "rate_limit"
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
      maxOutputTokens: 8192,
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

function parseJSON(text: string): unknown {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch) {
      return JSON.parse(fenceMatch[1].trim());
    }
    const firstBrace = trimmed.indexOf("{");
    const lastBrace = trimmed.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      return JSON.parse(trimmed.slice(firstBrace, lastBrace + 1));
    }
    throw new GeminiError(
      "Gemini mengembalikan JSON yang tidak valid. Coba generate ulang.",
      "parse_error",
    );
  }
}

async function callWithModelChain(
  ai: GoogleGenAI,
  userPrompt: string,
): Promise<string> {
  let lastError: GeminiError | null = null;

  for (const model of MODEL_CHAIN) {
    try {
      return await callGemini(ai, model, userPrompt);
    } catch (err) {
      const classified =
        err instanceof GeminiError ? err : classifyError(err);
      lastError = classified;

      if (classified.code === "invalid_key") {
        throw classified;
      }

      if (process.env.NODE_ENV !== "production") {
        console.warn(
          `[Gemini] Model "${model}" gagal (${classified.code}):`,
          classified.message,
        );
      }
    }
  }

  const triedModels = MODEL_CHAIN.join(", ");
  const lastMsg = lastError?.message ?? "";
  if (lastError?.code === "rate_limit") {
    throw new GeminiError(
      `Quota Gemini Anda sudah tercapai untuk semua model yang dicoba (${triedModels}). Tunggu beberapa menit lalu coba lagi — untuk akun baru, quota free-tier biasanya reset per menit.`,
      "rate_limit",
      lastError.cause,
    );
  }
  throw new GeminiError(
    `Semua model Gemini gagal dipanggil (dicoba: ${triedModels}).${
      lastMsg ? " " + lastMsg : ""
    }`,
    lastError?.code ?? "unknown",
    lastError?.cause,
  );
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

  const rawText = await callWithModelChain(ai, userPrompt);

  let parsed: unknown;
  try {
    parsed = parseJSON(rawText);
  } catch (err) {
    if (err instanceof GeminiError) throw err;
    throw classifyError(err);
  }

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

  const data = validation.data;
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
