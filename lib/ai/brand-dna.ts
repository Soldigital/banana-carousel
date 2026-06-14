import "server-only";
import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";
import { loadUserKeys } from "./load-keys";
import { MODEL_CHAINS, PROVIDER_BASE_URLS, type ProviderId } from "./types";

// Standalone, BYOK Brand-DNA generator. Deliberately does NOT use the carousel
// gateway (whose adapters hard-enforce the carousel schema) — the generate
// engine stays untouched. It reuses only the user's decrypted keys + the model
// registry, with its own tiny provider rotation and a JSON brand-DNA shape.

export interface BrandDNA {
  brand_voice: string;
  tone_of_voice: string;
  cta_style: string;
  audience_persona: string;
  visual_direction: string;
  content_style: string;
}

export interface BrandDNAInput {
  name: string;
  website?: string | null;
  instagram?: string | null;
}

const REQUIRED: (keyof BrandDNA)[] = [
  "brand_voice",
  "tone_of_voice",
  "cta_style",
  "audience_persona",
  "visual_direction",
  "content_style",
];

const SYSTEM = `Anda adalah brand strategist senior. Dari nama brand, website, dan Instagram, simpulkan "Brand DNA" yang ringkas dan tajam.
Keluarkan HANYA satu json object dengan PERSIS key berikut (semua wajib ada):
- brand_voice: karakter suara brand (1-2 kalimat)
- tone_of_voice: nada komunikasi (mis. "santai, kredibel, memotivasi")
- cta_style: gaya call-to-action khas brand ini
- audience_persona: persona audiens utama (demografi + psikografi singkat)
- visual_direction: arahan visual (warna, mood, gaya desain)
- content_style: gaya konten & angle yang cocok
Tulis nilai dalam Bahasa Indonesia natural (boleh campur istilah English yang umum). Ringkas, tanpa markdown, tanpa teks lain di luar json.`;

function buildUser(input: BrandDNAInput): string {
  return [
    `Brand: ${input.name}`,
    input.website ? `Website: ${input.website}` : "",
    input.instagram ? `Instagram: ${input.instagram}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function parseDNA(text: string): BrandDNA | null {
  try {
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) return null;
    const obj = JSON.parse(m[0]) as Record<string, unknown>;
    const out = {} as BrandDNA;
    for (const k of REQUIRED) {
      const v = obj[k];
      if (typeof v !== "string" || !v.trim()) return null;
      out[k] = v.trim();
    }
    return out;
  } catch {
    return null;
  }
}

const PER_CALL_MS = 18_000;

async function callGemini(apiKey: string, user: string): Promise<string> {
  const ai = new GoogleGenAI({ apiKey });
  const res = await ai.models.generateContent({
    model: MODEL_CHAINS.gemini[0],
    contents: user,
    config: {
      systemInstruction: SYSTEM,
      responseMimeType: "application/json",
      temperature: 0.7,
      maxOutputTokens: 2048,
      httpOptions: { timeout: PER_CALL_MS },
    },
  });
  return res.text ?? "";
}

async function callOpenAICompat(
  pid: "groq" | "openrouter",
  apiKey: string,
  user: string,
): Promise<string> {
  const client = new OpenAI({
    apiKey,
    baseURL: PROVIDER_BASE_URLS[pid],
    maxRetries: 0,
  });
  const completion = await client.chat.completions.create(
    {
      model: MODEL_CHAINS[pid][0],
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: user },
      ],
      temperature: 0.7,
      max_tokens: 2048,
      response_format: { type: "json_object" },
    },
    { signal: AbortSignal.timeout(PER_CALL_MS), timeout: PER_CALL_MS },
  );
  return completion.choices[0]?.message?.content ?? "";
}

// Generate Brand DNA using the user's own keys. Tries Gemini → Groq → OpenRouter
// (whichever keys exist), first model of each, until one returns valid JSON.
export async function generateBrandDNA(
  userId: string,
  input: BrandDNAInput,
): Promise<BrandDNA> {
  const keys = await loadUserKeys(userId);
  const user = buildUser(input);
  const order: ProviderId[] = ["gemini", "groq", "openrouter"];

  let tried = 0;
  for (const pid of order) {
    for (const key of keys[pid] ?? []) {
      tried++;
      try {
        const text =
          pid === "gemini"
            ? await callGemini(key.plaintext, user)
            : await callOpenAICompat(pid, key.plaintext, user);
        const dna = parseDNA(text);
        if (dna) return dna;
      } catch {
        /* rotate to the next key/provider */
      }
    }
  }
  throw new Error(
    tried === 0
      ? "Belum ada API key aktif. Tambahkan minimal satu key di dashboard."
      : "Gagal generate Brand DNA. Coba lagi sebentar.",
  );
}
