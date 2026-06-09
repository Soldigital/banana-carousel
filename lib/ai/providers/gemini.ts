import { GoogleGenAI } from "@google/genai";
import { GEMINI_RESPONSE_SCHEMA } from "@/lib/gemini/schema";
import { classifyError, GenError } from "../errors";
import { MODEL_CHAINS, type AiProvider, type GenerateArgs } from "../types";

// Gemini adapter — wraps the existing @google/genai call (schema-enforced JSON)
// and walks the model fallback chain with a single key.

export const geminiProvider: AiProvider = {
  id: "gemini",
  models: MODEL_CHAINS.gemini,
  async generate({ apiKey, systemPrompt, userPrompt }: GenerateArgs) {
    const ai = new GoogleGenAI({ apiKey });
    let lastError: GenError | null = null;

    for (const model of MODEL_CHAINS.gemini) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: userPrompt,
          config: {
            systemInstruction: systemPrompt,
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
          throw new GenError("Gemini mengembalikan respons kosong.", "parse_error");
        }
        return { text, model };
      } catch (err) {
        const c = err instanceof GenError ? err : classifyError(err);
        lastError = c;
        // A dead key won't get better on another model — bubble up so the
        // gateway moves to the next key.
        if (c.code === "invalid_key") throw c;
      }
    }
    throw lastError ?? new GenError("Gemini gagal pada semua model.", "unknown");
  },
};
