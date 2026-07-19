import { getRedis } from "./redis";
import { isProviderId, type ProviderId, type ResolvedKey } from "./types";

// Optional, capped, business-funded EMERGENCY fallback.
//
// Pure BYOK is the default: normal traffic always uses the user's own keys and
// the business pays Rp0. This fallback only fires when ALL of a user's own keys
// are exhausted, is bounded by a daily quota, and is killable via env in one
// flip. Disabled (and therefore zero behavior change) unless FALLBACK_ENABLED is
// truthy AND a key is set.

export interface FallbackConfig {
  provider: ProviderId;
  key: ResolvedKey;
  dailyLimit: number;
}

function truthy(v: string | undefined): boolean {
  if (!v) return false;
  const s = v.trim().toLowerCase();
  return s === "1" || s === "on" || s === "true" || s === "yes";
}

/**
 * Reads the fallback config from env. Returns null when disabled or unset, so
 * call sites can treat "no fallback" as the normal, default case.
 */
export function getFallback(): FallbackConfig | null {
  if (!truthy(process.env.FALLBACK_ENABLED)) return null;

  const apiKey = process.env.FALLBACK_API_KEY?.trim();
  if (!apiKey) return null;

  const providerRaw = (process.env.FALLBACK_PROVIDER ?? "groq").trim();
  const provider: ProviderId = isProviderId(providerRaw) ? providerRaw : "groq";

  const dailyLimit = Number.parseInt(
    process.env.FALLBACK_DAILY_LIMIT ?? "200",
    10,
  );

  return {
    provider,
    dailyLimit: Number.isFinite(dailyLimit) && dailyLimit > 0 ? dailyLimit : 200,
    key: {
      id: "__fallback__",
      provider,
      label: "emergency-fallback",
      plaintext: apiKey,
    },
  };
}

function todayKey(): string {
  // UTC date bucket. Date.toISOString slice is fine here (no Math.random/Date.now
  // restriction in app runtime — that constraint is workflow-script only).
  return `fallback:count:${new Date().toISOString().slice(0, 10)}`;
}

/**
 * Atomically claim one unit of today's fallback quota. Returns true if the call
 * is allowed to proceed. With Upstash configured (prod), this is a hard daily
 * cap. Without Upstash it can't be counted reliably → allow but log, since the
 * env limit is then the only guard and Upstash is active in production anyway.
 */
export async function tryConsumeFallbackQuota(limit: number): Promise<boolean> {
  const redis = getRedis();
  if (!redis) {
    console.warn("[fallback] Upstash off — quota not enforced this request");
    return true;
  }
  try {
    const k = todayKey();
    const n = await redis.incr(k);
    if (n === 1) {
      // First hit today — expire the counter a bit over 24h later.
      await redis.expire(k, 60 * 60 * 26);
    }
    return n <= limit;
  } catch (err) {
    console.warn("[fallback] quota check failed, allowing:", err);
    return true;
  }
}
