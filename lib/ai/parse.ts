// Shared JSON parsing + validation for provider output. This is the same
// 3-layer repair strategy proven in lib/gemini/generate-carousel.ts, extracted
// so every provider adapter benefits from it identically.

import { jsonrepair } from "jsonrepair";
import { CarouselOutputSchema, type CarouselOutputZ } from "@/lib/gemini/schema";
import { GenError } from "./errors";

function stripMarkdownFence(text: string): string {
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  return fenceMatch ? fenceMatch[1].trim() : text;
}

function parseJSON(text: string): unknown {
  const stripped = stripMarkdownFence(text.trim());

  // Layer 1: direct parse (happy path).
  try {
    return JSON.parse(stripped);
  } catch {
    /* fall through */
  }

  // Layer 2: jsonrepair — trailing commas, smart quotes, unescaped quotes, etc.
  try {
    return JSON.parse(jsonrepair(stripped));
  } catch {
    /* fall through */
  }

  // Layer 3: extract first { to last } (strip wrapper prose), then repair.
  const first = stripped.indexOf("{");
  const last = stripped.lastIndexOf("}");
  if (first !== -1 && last > first) {
    try {
      return JSON.parse(jsonrepair(stripped.slice(first, last + 1)));
    } catch {
      /* fall through */
    }
  }

  throw new GenError(
    "Output AI tidak bisa diparse menjadi JSON bahkan setelah repair.",
    "parse_error",
  );
}

const VALID_ROLES = ["hook", "context", "value", "story", "cta"];

// Repair small, non-critical drifts that schema-free providers (Groq/OpenRouter)
// occasionally produce, so one cosmetic deviation doesn't fail an otherwise-good
// carousel. Gemini (responseSchema-enforced) never hits these. We ONLY touch
// fields that are either non-semantic or get overwritten downstream:
//   - slide.role: coerce an off-enum value by position (first=hook, last=cta,
//     otherwise value). Role is metadata; the visual output doesn't depend on it.
//   - slide.slide_num: coerce to its 1-based index (finalizeOutput renumbers it
//     anyway; this just gets it past the int(1..10) check first).
function normalizeForSchema(parsed: unknown): unknown {
  if (!parsed || typeof parsed !== "object") return parsed;
  const obj = parsed as Record<string, unknown>;
  if (Array.isArray(obj.slides)) {
    const n = obj.slides.length;
    obj.slides = obj.slides.map((raw, i) => {
      if (!raw || typeof raw !== "object") return raw;
      const s = raw as Record<string, unknown>;
      if (typeof s.role !== "string" || !VALID_ROLES.includes(s.role)) {
        s.role = i === 0 ? "hook" : i === n - 1 ? "cta" : "value";
      }
      if (
        typeof s.slide_num !== "number" ||
        !Number.isInteger(s.slide_num) ||
        s.slide_num < 1 ||
        s.slide_num > 10
      ) {
        s.slide_num = i + 1;
      }
      return s;
    });
  }
  return obj;
}

// Parse + Zod-validate raw model text into a carousel object, or throw GenError.
export function parseCarouselJSON(text: string): CarouselOutputZ {
  const parsed = normalizeForSchema(parseJSON(text));
  const validation = CarouselOutputSchema.safeParse(parsed);
  if (!validation.success) {
    throw new GenError(
      `Output tidak sesuai schema: ${validation.error.issues
        .slice(0, 3)
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; ")}`,
      "parse_error",
      validation.error,
    );
  }
  return validation.data;
}
