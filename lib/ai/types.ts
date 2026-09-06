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
// Model fallback chains, best-first.
//
// These MUST be kept current: providers retire model ids, and a retired id
// returns 404, which the gateway surfaces as "model_not_found" after burning
// the whole rotation. That is exactly what happened in Sep 2026 — every chain
// below had gone stale at once:
//   - Groq deprecated llama-3.3-70b-versatile and llama-3.1-8b-instant for
//     free/developer tier on 2026-06-17 (verified against a live key: neither
//     id is returned by GET /models any more).
//   - gemini-2.0-flash is shut down, and gemini-2.5-flash / -flash-lite are
//     retiring 2026-10-16 with reports of earlier unavailability.
export const MODEL_CHAINS: Record<ProviderId, string[]> = {
  // gemini-2.5-flash is kept as a LAST-RESORT entry: the 3.x ids could not be
  // verified against a live key from here, and if a given key's tier cannot see
  // them they 404 fast and cost almost nothing to skip. Remove it after its
  // 2026-10-16 retirement.
  gemini: [
    "gemini-3.5-flash",
    "gemini-3.5-flash-lite",
    "gemini-3.1-flash-lite",
    "gemini-2.5-flash",
  ],
  openrouter: [
    // OpenRouter still resolves the 2.5 ids, but they inherit Google's
    // retirement date, so point at the current generation instead.
    "google/gemini-3.5-flash",
    "openai/gpt-4o-mini",
    "deepseek/deepseek-chat",
  ],
  // gpt-oss-120b is first: 20b failed JSON-mode validation even on a trivial
  // prompt, so it is a last resort rather than the fast default.
  groq: ["openai/gpt-oss-120b", "openai/gpt-oss-20b"],
};

// OpenAI-compatible base URLs (OpenRouter & Groq).
export const PROVIDER_BASE_URLS: Partial<Record<ProviderId, string>> = {
  openrouter: "https://openrouter.ai/api/v1",
  groq: "https://api.groq.com/openai/v1",
};

// Hard per-model wall. A single model call gets at most this long before it is
// ABORTED (the underlying socket is cancelled) and the chain moves on. This is
// what keeps one slow/overloaded model from eating an entire attempt's budget,
// so the gateway can reach many more keys within its global deadline.
// Measured: a full 5-slide carousel on openai/gpt-oss-120b takes ~11.0s. At the
// previous 11s cap the abort fired at almost exactly the moment a healthy call
// was completing, so normal generations were being killed and logged as
// timeouts. 15s leaves real headroom while still capping a hung model.
export const PER_MODEL_CAP_MS = 15_000;
// Below this much remaining time, don't even start another model — there isn't
// enough budget for a useful attempt.
export const MIN_MODEL_MS = 2_000;

export interface GenerateArgs {
  apiKey: string;
  systemPrompt: string;
  userPrompt: string;
  /**
   * Epoch ms by which the whole provider call (its model chain) must finish.
   * Each model is given min(PER_MODEL_CAP_MS, deadline - now) and aborted at
   * that point. Omitted → provider falls back to PER_MODEL_CAP_MS per model.
   */
  deadlineMs?: number;
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
