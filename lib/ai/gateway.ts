import type { CarouselOutput, GeneratorInput } from "@/types/carousel";
import {
  SYSTEM_PROMPT,
  MASTER_PROMPT_PREAMBLE,
} from "@/lib/prompts/system-prompt";
import { buildUserPrompt } from "@/lib/prompts/build-user-prompt";
import type { CarouselOutputZ } from "@/lib/gemini/schema";
import { GenError, classifyError, exhaustedMessage } from "./errors";
import { parseCarouselJSON } from "./parse";
import { cacheKey, getCached, setCached } from "./cache";
import { recordHealth } from "./health";
import { geminiProvider } from "./providers/gemini";
import { openrouterProvider, groqProvider } from "./providers/openai-compat";
import {
  PROVIDER_ORDER,
  type AiProvider,
  type KeysByProvider,
  type ProviderId,
} from "./types";

const PROVIDERS: Record<ProviderId, AiProvider> = {
  gemini: geminiProvider,
  openrouter: openrouterProvider,
  groq: groqProvider,
};

// Time budgets. The route's maxDuration is 60s, so the whole rotation MUST
// finish (success or a clean error) before that — otherwise Vercel kills the
// function mid-flight, the connection drops, and the browser shows a misleading
// "network" error. We cap the total work at GATEWAY_BUDGET_MS and derive each
// attempt's timeout from the remaining budget.
const GATEWAY_BUDGET_MS = 52_000;
const PER_ATTEMPT_MS = 35_000;
const MIN_ATTEMPT_MS = 8_000;

export interface GatewayResult {
  output: CarouselOutput;
  provider: ProviderId | "cache";
  model: string;
  keyId: string;
  cached: boolean;
}

export interface GatewayArgs {
  userId: string;
  input: GeneratorInput;
  keysByProvider: KeysByProvider;
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new GenError("Attempt timed out", "timeout")),
      ms,
    );
    p.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e) => {
        clearTimeout(timer);
        reject(e);
      },
    );
  });
}

// Reproduces the post-processing from the original generate-carousel.ts so the
// output contract is byte-for-byte identical to the legacy client path.
function finalizeOutput(
  data: CarouselOutputZ,
  input: GeneratorInput,
): CarouselOutput {
  const out = { ...data };
  if (out.slides.length > input.slideCount) {
    out.slides = out.slides.slice(0, input.slideCount);
  }
  out.slides = out.slides.map((slide, idx) => ({
    ...slide,
    slide_num: idx + 1,
  }));
  out.gemini_ready_prompt = `${MASTER_PROMPT_PREAMBLE} ${out.carousel_title}\n\n${out.gemini_ready_prompt}`;
  return out;
}

function totalKeys(keys: KeysByProvider): number {
  return PROVIDER_ORDER.reduce((n, p) => n + (keys[p]?.length ?? 0), 0);
}

/**
 * The rotation engine. Tries every enabled key, provider by provider, model by
 * model, until one succeeds. Cache hit short-circuits everything. Each attempt
 * is health-logged. Throws an aggregated GenError when all keys are exhausted.
 */
export async function runGateway(args: GatewayArgs): Promise<GatewayResult> {
  const { userId, input, keysByProvider } = args;

  if (totalKeys(keysByProvider) === 0) {
    throw new GenError(
      "Belum ada API key aktif. Tambahkan minimal satu key di dashboard.",
      "invalid_key",
    );
  }

  const systemPrompt = SYSTEM_PROMPT;
  const userPrompt = buildUserPrompt(input);

  // 1. Cache lookup (shared across users — keyed by prompt+input only).
  const ck = cacheKey(systemPrompt, input);
  const cachedHit = await getCached(ck);
  if (cachedHit) {
    return {
      output: cachedHit,
      provider: "cache",
      model: "cache",
      keyId: "",
      cached: true,
    };
  }

  // 2. Rotation: provider order → each enabled key → provider's model chain.
  // Bounded by a global deadline so we always return before maxDuration.
  let lastError: GenError | null = null;
  const startedAt = Date.now();

  for (const pid of PROVIDER_ORDER) {
    const provider = PROVIDERS[pid];
    const keys = keysByProvider[pid] ?? [];

    for (const key of keys) {
      // Stop rotating once the time budget is nearly spent, so the function
      // returns a clean error response instead of being killed by the platform.
      const remaining = GATEWAY_BUDGET_MS - (Date.now() - startedAt);
      if (remaining < MIN_ATTEMPT_MS) {
        if (!lastError) {
          lastError = new GenError(
            "Waktu pemrosesan habis sebelum semua key sempat dicoba.",
            "timeout",
          );
        }
        break;
      }
      const attemptTimeout = Math.min(PER_ATTEMPT_MS, remaining - 2_000);

      const started = Date.now();
      try {
        const { text, model } = await withTimeout(
          provider.generate({ apiKey: key.plaintext, systemPrompt, userPrompt }),
          attemptTimeout,
        );
        const parsed = parseCarouselJSON(text);
        const output = finalizeOutput(parsed, input);

        void recordHealth({
          userId,
          provider: pid,
          keyId: key.id,
          model,
          ok: true,
          latencyMs: Date.now() - started,
        });
        void setCached(ck, output);

        return { output, provider: pid, model, keyId: key.id, cached: false };
      } catch (err) {
        const c = err instanceof GenError ? err : classifyError(err);
        lastError = c;
        void recordHealth({
          userId,
          provider: pid,
          keyId: key.id,
          model: null,
          ok: false,
          latencyMs: Date.now() - started,
          errorCode: c.code,
        });
        // Move on to the next key (then next provider). A parse_error from one
        // key/model is worth retrying on another.
      }
    }
  }

  throw new GenError(exhaustedMessage(lastError), lastError?.code ?? "unknown", lastError);
}
