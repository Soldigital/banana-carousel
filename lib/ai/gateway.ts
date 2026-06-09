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

const ATTEMPT_TIMEOUT_MS = 45_000;

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
  let lastError: GenError | null = null;

  for (const pid of PROVIDER_ORDER) {
    const provider = PROVIDERS[pid];
    const keys = keysByProvider[pid] ?? [];

    for (const key of keys) {
      const started = Date.now();
      try {
        const { text, model } = await withTimeout(
          provider.generate({ apiKey: key.plaintext, systemPrompt, userPrompt }),
          ATTEMPT_TIMEOUT_MS,
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
