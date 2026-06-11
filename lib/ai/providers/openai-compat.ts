import OpenAI from "openai";
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
        try {
          const completion = await client.chat.completions.create(
            {
              model,
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt },
              ],
              temperature: 0.9,
              top_p: 0.95,
              max_tokens: 8192,
              response_format: { type: "json_object" },
            },
            { signal: AbortSignal.timeout(slice), timeout: slice },
          );
          const text = completion.choices[0]?.message?.content;
          if (!text) {
            throw new GenError(`${id} mengembalikan respons kosong.`, "parse_error");
          }
          return { text, model };
        } catch (err) {
          const c = err instanceof GenError ? err : classifyError(err);
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
