// AI Gateway provider contract + model registry.
// BYOK: every request uses the *user's own* keys. The gateway rotates across a
// user's keys within a provider, then falls back to the next provider.

export type ProviderId = "gemini" | "openrouter" | "groq";

export const PROVIDER_IDS: ProviderId[] = ["gemini", "openrouter", "groq"];

// Order the gateway tries providers in when a user has keys for several.
export const PROVIDER_ORDER: ProviderId[] = ["gemini", "openrouter", "groq"];

export const PROVIDER_LABELS: Record<ProviderId, string> = {
  gemini: "Google Gemini",
  openrouter: "OpenRouter",
  groq: "Groq",
};

// Where to get a key, surfaced in the dashboard UI.
export const PROVIDER_KEY_URLS: Record<ProviderId, string> = {
  gemini: "https://aistudio.google.com/apikey",
  openrouter: "https://openrouter.ai/keys",
  groq: "https://console.groq.com/keys",
};

// Per-provider ordered model fallback chain. The provider adapter walks this
// list, moving to the next model on model_not_found / transient errors.
export const MODEL_CHAINS: Record<ProviderId, string[]> = {
  gemini: ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.5-flash-lite"],
  openrouter: [
    "google/gemini-2.5-flash",
    "openai/gpt-4o-mini",
    "deepseek/deepseek-chat",
  ],
  groq: ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"],
};

// OpenAI-compatible base URLs (OpenRouter & Groq).
export const PROVIDER_BASE_URLS: Partial<Record<ProviderId, string>> = {
  openrouter: "https://openrouter.ai/api/v1",
  groq: "https://api.groq.com/openai/v1",
};

export interface GenerateArgs {
  apiKey: string;
  systemPrompt: string;
  userPrompt: string;
}

export interface GenRawResult {
  /** Raw model text (expected to be a JSON object string). */
  text: string;
  /** Which model in the chain actually produced the result. */
  model: string;
}

export interface AiProvider {
  id: ProviderId;
  models: string[];
  /**
   * Try the provider's model chain with a single key. Resolves with raw text,
   * or throws a GenError. invalid_key short-circuits (no point trying more
   * models with a dead key).
   */
  generate(args: GenerateArgs): Promise<GenRawResult>;
}

// A user's decrypted key, ready for use inside the gateway (server-only).
export interface ResolvedKey {
  id: string;
  provider: ProviderId;
  label: string | null;
  plaintext: string;
}

export type KeysByProvider = Record<ProviderId, ResolvedKey[]>;

export function emptyKeysByProvider(): KeysByProvider {
  return { gemini: [], openrouter: [], groq: [] };
}

export function isProviderId(v: unknown): v is ProviderId {
  return v === "gemini" || v === "openrouter" || v === "groq";
}
