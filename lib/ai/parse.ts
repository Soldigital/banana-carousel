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

// Parse + Zod-validate raw model text into a carousel object, or throw GenError.
export function parseCarouselJSON(text: string): CarouselOutputZ {
  const parsed = parseJSON(text);
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
