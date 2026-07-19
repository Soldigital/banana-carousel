import { Ratelimit } from "@upstash/ratelimit";
import type { Duration } from "@upstash/ratelimit";
import { getRedis } from "@/lib/ai/redis";

// Sliding-window rate limiting backed by Upstash. Degrades to allow-all when
// Redis is not configured, so the app never hard-fails on a missing limiter.

const limiters = new Map<string, Ratelimit>();

export interface RateLimitOptions {
  limit: number;
  window: Duration; // e.g. "60 s", "1 h"
}

export async function rateLimit(
  identifier: string,
  { limit, window }: RateLimitOptions,
): Promise<{ success: boolean; remaining: number }> {
  const redis = getRedis();
  if (!redis) return { success: true, remaining: limit };

  const cacheId = `${limit}:${window}`;
  let limiter = limiters.get(cacheId);
  if (!limiter) {
    limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limit, window),
      prefix: "cc:rl",
      analytics: false,
    });
    limiters.set(cacheId, limiter);
  }

  try {
    const res = await limiter.limit(identifier);
    return { success: res.success, remaining: res.remaining };
  } catch {
    // Fail open — a limiter outage must not take down the route.
    return { success: true, remaining: limit };
  }
}

// Best-effort client IP for rate-limiting unauthenticated routes (behind Vercel).
export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}
