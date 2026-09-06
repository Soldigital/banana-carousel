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

// Client IP for rate-limiting unauthenticated routes (behind Vercel).
//
// `x-forwarded-for` is a client-supplied header that Vercel APPENDS to rather
// than replaces, so its first entry is attacker-controlled: sending
// `x-forwarded-for: <random>` on every request defeats any limiter keyed on it.
// That matters because these limiters are the only brute-force guard on
// /api/auth/license-login (license keys) and the only throttle on checkout and
// promo redemption.
//
// `x-vercel-forwarded-for` is set by Vercel's proxy and cannot be spoofed by
// the client, so it is preferred. We fall back to the LAST entry of XFF (the
// hop nearest our own proxy, i.e. the least attacker-influenced one) rather
// than the first, and finally to x-real-ip.
export function clientIp(req: Request): string {
  const vercelIp = req.headers.get("x-vercel-forwarded-for");
  if (vercelIp) return vercelIp.split(",")[0].trim();

  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const hops = xff
      .split(",")
      .map((h) => h.trim())
      .filter(Boolean);
    if (hops.length) return hops[hops.length - 1];
  }
  return req.headers.get("x-real-ip") || "unknown";
}
