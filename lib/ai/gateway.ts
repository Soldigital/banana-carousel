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
import { recordHealth, getHealthSnapshot, type KeyHealth } from "./health";
import { geminiProvider } from "./providers/gemini";
import { openrouterProvider, groqProvider } from "./providers/openai-compat";
import { getFallback, tryConsumeFallbackQuota } from "./fallback";
import {
  PROVIDER_ORDER,
  type AiProvider,
  type KeysByProvider,
  type ProviderId,
  type ResolvedKey,
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
// Shorter per-attempt so a few slow/hanging keys can't eat the whole budget
// before faster keys are reached. Combined with the providers' per-model abort
// (PER_MODEL_CAP_MS), a slow key now fails fast and we reach 4-6 candidates
// within budget instead of only 2-3. A healthy Gemini-Flash / Groq call with
// the 8k-token cap finishes well within this.
const PER_ATTEMPT_MS = 15_000;
const MIN_ATTEMPT_MS = 7_000;
// When a business fallback is available, hold back this much budget so the
// emergency call can still run after the user's own keys are exhausted.
const FALLBACK_RESERVE_MS = 14_000;

export interface GatewayResult {
  output: CarouselOutput;
  provider: ProviderId | "cache";
  model: string;
  keyId: string;
  cached: boolean;
  /** True when served by the business emergency fallback, not a user key. */
  fallback?: boolean;
}

export interface GatewayArgs {
  userId: string;
  input: GeneratorInput;
  keysByProvider: KeysByProvider;
  /** Optional correlation id for log tracing. */
  requestId?: string;
}

interface Candidate {
  pid: ProviderId;
  key: ResolvedKey;
}

// A key with no health history is treated optimistically (neutral) so it still
// ranks ahead of keys with a proven-bad recent record but behind proven-good
// ones. With Upstash off, every key scores neutral → stable PROVIDER_ORDER.
function healthScore(h: KeyHealth | null | undefined): number {
  if (!h || h.ok + h.err === 0) return 0.75;
  return h.successRate;
}

// Order attempts by recent success rate, then by last latency. Stable sort
// (V8) preserves PROVIDER_ORDER for equal scores.
function orderCandidates(
  candidates: Candidate[],
  health: Record<string, KeyHealth | null>,
): Candidate[] {
  return [...candidates].sort((a, b) => {
    const sb = healthScore(health[b.key.id]);
    const sa = healthScore(health[a.key.id]);
    if (sb !== sa) return sb - sa;
    const la = health[a.key.id]?.lastLatencyMs ?? Number.POSITIVE_INFINITY;
    const lb = health[b.key.id]?.lastLatencyMs ?? Number.POSITIVE_INFINITY;
    return la - lb;
  });
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

  // 2. Build the attempt list by ROUND-ROBIN across providers (gemini →
  // openrouter → groq → gemini → …) instead of all-of-one-provider-first. This
  // guarantees a fast provider (e.g. Groq) is reached within the first few
  // attempts even with no health history (cold start), so slow Gemini keys
  // can't exhaust the budget before the fast ones are tried.
  const buckets = PROVIDER_ORDER.map((pid) =>
    (keysByProvider[pid] ?? []).map((key) => ({ pid, key }) as Candidate),
  );
  const candidates: Candidate[] = [];
  for (let i = 0; candidates.length < buckets.reduce((n, b) => n + b.length, 0); i++) {
    for (const b of buckets) if (i < b.length) candidates.push(b[i]);
  }
  // Then refine by health (stable sort keeps the round-robin order when there's
  // no health data yet; promotes proven-fast keys once metrics accumulate).
  const health = await getHealthSnapshot(
    userId,
    candidates.map((c) => ({ id: c.key.id, provider: c.pid })),
  );
  const ordered = orderCandidates(candidates, health);

  // 3. Rotation, bounded by a global deadline so we always return before
  // maxDuration (a clean error response instead of a killed function).
  let lastError: GenError | null = null;
  let attempts = 0;
  const startedAt = Date.now();

  // If a business emergency fallback is available, hold back a slice of the
  // budget so it can still run after the user's own keys are exhausted.
  const fallback = getFallback();
  const userKeyFloor =
    MIN_ATTEMPT_MS + (fallback ? FALLBACK_RESERVE_MS : 0);

  for (const { pid, key } of ordered) {
    const remaining = GATEWAY_BUDGET_MS - (Date.now() - startedAt);
    if (remaining < userKeyFloor) {
      if (!lastError) {
        lastError = new GenError(
          "Waktu pemrosesan habis sebelum semua key sempat dicoba.",
          "timeout",
        );
      }
      console.warn(
        `[generate] budget exhausted after ${attempts}/${ordered.length} attempts`,
        args.requestId ?? "",
      );
      break;
    }
    const attemptTimeout = Math.min(PER_ATTEMPT_MS, remaining - 2_000);
    const provider = PROVIDERS[pid];
    attempts += 1;

    const started = Date.now();
    try {
      const { text, model } = await withTimeout(
        provider.generate({
          apiKey: key.plaintext,
          systemPrompt,
          userPrompt,
          deadlineMs: Date.now() + attemptTimeout,
        }),
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
      // Move on to the next candidate. A parse_error from one key/model is
      // worth retrying on another.
    }
  }

  // 4. Last-resort cache: if a cached result for this exact prompt exists
  // (e.g. populated by a concurrent request), serve it rather than failing.
  const stale = await getCached(ck);
  if (stale) {
    return {
      output: stale,
      provider: "cache",
      model: "cache",
      keyId: "",
      cached: true,
    };
  }

  // 5. Business emergency fallback (opt-in, capped, killable). Only reached when
  // every user key failed. Bounded by its own time budget + a daily quota so a
  // bad day can't run up unbounded cost. Failure here never masks the original
  // user-facing error.
  if (fallback) {
    const remaining = GATEWAY_BUDGET_MS - (Date.now() - startedAt);
    if (remaining >= MIN_ATTEMPT_MS && (await tryConsumeFallbackQuota(fallback.dailyLimit))) {
      const attemptTimeout = Math.min(PER_ATTEMPT_MS, remaining - 2_000);
      const provider = PROVIDERS[fallback.provider];
      try {
        const { text, model } = await withTimeout(
          provider.generate({
            apiKey: fallback.key.plaintext,
            systemPrompt,
            userPrompt,
            deadlineMs: Date.now() + attemptTimeout,
          }),
          attemptTimeout,
        );
        const parsed = parseCarouselJSON(text);
        const output = finalizeOutput(parsed, input);
        void setCached(ck, output);
        console.warn(
          `[generate] served via emergency fallback (${fallback.provider})`,
          args.requestId ?? "",
        );
        return {
          output,
          provider: fallback.provider,
          model,
          keyId: "",
          cached: false,
          fallback: true,
        };
      } catch (err) {
        const c = err instanceof GenError ? err : classifyError(err);
        console.warn(
          `[generate] emergency fallback failed: ${c.code} — ${c.message}`,
          args.requestId ?? "",
        );
        // Fall through to the user's original error below.
      }
    }
  }

  throw new GenError(
    exhaustedMessage(lastError),
    lastError?.code ?? "unknown",
    lastError,
  );
}
