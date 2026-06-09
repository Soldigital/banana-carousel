import OpenAI from "openai";
import { classifyError, GenError } from "../errors";
import {
  MODEL_CHAINS,
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
    async generate({ apiKey, systemPrompt, userPrompt }: GenerateArgs) {
      const client = new OpenAI({
        apiKey,
        baseURL,
        // OpenRouter recommends these; harmless for Groq.
        defaultHeaders: {
          "HTTP-Referer":
            process.env.NEXT_PUBLIC_APP_URL || "https://bananacarousel.click",
          "X-Title": "Banana Carousel",
        },
      });

      let lastError: GenError | null = null;
      for (const model of models) {
        try {
          const completion = await client.chat.completions.create({
            model,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
            temperature: 0.9,
            top_p: 0.95,
            response_format: { type: "json_object" },
          });
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
