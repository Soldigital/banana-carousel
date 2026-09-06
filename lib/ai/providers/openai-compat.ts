import OpenAI from "openai";
import { GEMINI_RESPONSE_SCHEMA } from "@/lib/gemini/schema";
import { classifyError, GenError } from "../errors";
import {
  MODEL_CHAINS,
  MIN_MODEL_MS,
  PER_MODEL_CAP_MS,
  PROVIDER_BASE_URLS,
  type AiProvider,
  type GenerateArgs,
  type ProviderId,
} from "../types";

// Unlike Gemini (which enforces shape via responseSchema), OpenAI-compatible
// providers only get `response_format: json_object` — that guarantees valid
// JSON but NOT the right shape. Without the schema the model omits required keys
// (notably the top-level `slides` array and `cta`), so output fails
// CarouselOutputSchema → the whole attempt errors. We therefore inject the exact
// JSON Schema into the system message. The literal word "json" here also
// satisfies Groq's json_object requirement regardless of the base prompt wording.
const SCHEMA_INSTRUCTION = `

# REQUIRED JSON SHAPE (CRITICAL — must match exactly)
Return a single json object that EXACTLY matches this JSON Schema. EVERY required key must be present at the correct nesting — especially the TOP-LEVEL "slides" array and the "cta" object. Do NOT nest "slides" inside another object.
${JSON.stringify(GEMINI_RESPONSE_SCHEMA)}

# HARD CONSTRAINTS (output is REJECTED if any is violated)
- "slides": an array of 3 to 10 items. It MUST contain EXACTLY the number given by "SLIDE COUNT" in the user message.
- Each slide object MUST have ALL of: slide_num, role, headline, body, visual_prompt, typography_instruction, layout_instruction.
- "slide_num": integer starting at 1, incrementing by 1, with no gaps (1,2,3,...).
- "role": exactly one of "hook", "context", "value", "story", "cta".
- "visual_prompt": at least 20 characters (detailed English visual description).
- "gemini_ready_prompt": at least 200 characters.
- "caption": at least 30 characters.
- "global_style.color_palette": an array of at least 2 color strings.
- Every other string field (carousel_title, headline, body, hook.*, cta.*, global_style.mood/typography_family/aspect_ratio/consistency_notes, typography_instruction, layout_instruction) MUST be non-empty.
- No extra top-level keys. No markdown, no code fences — just the json object.`;

// Output cap for OpenAI-compat providers. 6144 still gives >1.3x headroom over
// the longest completion observed (~4.5k tokens). We keep this well below
// Groq's free-tier 12k tokens-per-minute limit (which counts max_tokens toward
// it, not just actual usage) so the RESERVATION ITSELF doesn't trip a 413
// "request too large" on a brand-new key's very first call, before the model
// even runs.
// OpenAI-style strict structured output. Groq (and OpenRouter, per model)
// enforce the schema server-side when given response_format:"json_schema" —
// far more reliable than asking the model to comply in the prompt. Their strict
// mode requires every object to set additionalProperties:false and to list all
// of its properties in `required`, which this derives from our Zod-generated
// schema.
//
// This matters: with prompt-only json_object, openai/gpt-oss-120b returned
// valid JSON that was missing the required top-level "hook" and "cta" keys.
// With strict mode the same model produces a fully schema-valid carousel.
type JsonSchemaNode = { [key: string]: unknown };

function toStrictJsonSchema(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(toStrictJsonSchema);
  if (!node || typeof node !== "object") return node;
  const out: JsonSchemaNode = { ...(node as JsonSchemaNode) };
  for (const k of Object.keys(out)) out[k] = toStrictJsonSchema(out[k]);
  if (
    String(out.type ?? "").toLowerCase() === "object" &&
    out.properties &&
    typeof out.properties === "object"
  ) {
    out.additionalProperties = false;
    out.required = Object.keys(out.properties as JsonSchemaNode);
  }
  return out;
}

const STRICT_RESPONSE_FORMAT = {
  type: "json_schema" as const,
  json_schema: {
    name: "carousel",
    strict: true,
    schema: toStrictJsonSchema(GEMINI_RESPONSE_SCHEMA) as JsonSchemaNode,
  },
};

// Not every OpenRouter-routed model accepts json_schema; those reject the
// request outright (HTTP 400 naming response_format/json_schema) rather than
// producing bad output, so we can safely retry that one model with plain JSON
// mode plus the prompt-level schema instruction.
function isUnsupportedResponseFormat(err: unknown): boolean {
  const m = (err instanceof Error ? err.message : String(err)).toLowerCase();
  return (
    m.includes("response_format") ||
    m.includes("json_schema") ||
    m.includes("json schema")
  );
}

const OPENAI_COMPAT_MAX_TOKENS = 6144;

// Shared adapter for OpenAI-compatible providers (OpenRouter & Groq). Both
// expose /chat/completions with JSON mode. We walk the model chain with one key.

export function makeOpenAICompatProvider(id: ProviderId): AiProvider {
  const baseURL = PROVIDER_BASE_URLS[id];
  const models = MODEL_CHAINS[id];
  if (!baseURL) throw new Error(`No base URL configured for provider ${id}`);

  return {
    id,
    models,
    async generate({ apiKey, systemPrompt, userPrompt, deadlineMs }: GenerateArgs) {
      const client = new OpenAI({
        apiKey,
        baseURL,
        // We do our own provider/key rotation, so the SDK's default 2 internal
        // retries (with backoff) would only multiply latency and blow the budget.
        maxRetries: 0,
        // OpenRouter recommends these; harmless for Groq.
        defaultHeaders: {
          "HTTP-Referer":
            process.env.NEXT_PUBLIC_APP_URL || "https://bananacarousel.click",
          "X-Title": "Banana Carousel",
        },
      });

      let lastError: GenError | null = null;
      for (const model of models) {
        // Hard, cancelling per-model slice of the remaining budget.
        const slice = deadlineMs
          ? Math.min(PER_MODEL_CAP_MS, deadlineMs - Date.now())
          : PER_MODEL_CAP_MS;
        if (slice < MIN_MODEL_MS) break;
        const call = (strict: boolean) =>
          client.chat.completions.create(
            {
              model,
              messages: [
                {
                  role: "system",
                  // With server-side schema enforcement the long prompt-level
                  // schema restatement is redundant; keep it only for the
                  // json_object fallback.
                  content: strict ? systemPrompt : systemPrompt + SCHEMA_INSTRUCTION,
                },
                { role: "user", content: userPrompt },
              ],
              temperature: 0.9,
              top_p: 0.95,
              max_tokens: OPENAI_COMPAT_MAX_TOKENS,
              response_format: strict
                ? STRICT_RESPONSE_FORMAT
                : { type: "json_object" as const },
            },
            { signal: AbortSignal.timeout(slice), timeout: slice },
          );

        try {
          let completion;
          try {
            completion = await call(true);
          } catch (err) {
            if (!isUnsupportedResponseFormat(err)) throw err;
            completion = await call(false);
          }
          const text = completion.choices[0]?.message?.content;
          if (!text) {
            throw new GenError(`${id} mengembalikan respons kosong.`, "parse_error");
          }
          return { text, model };
        } catch (err) {
          const c = err instanceof GenError ? err : classifyError(err);
          c.model = c.model ?? model;
          lastError = c;
          if (c.code === "invalid_key") throw c;
        }
      }
      throw lastError ?? new GenError(`${id} gagal pada semua model.`, "unknown");
    },
  };
}

export const openrouterProvider = makeOpenAICompatProvider("openrouter");
export const groqProvider = makeOpenAICompatProvider("groq");
