import { Redis } from "@upstash/redis";

// Single shared Upstash Redis client. Returns null when Upstash is not
// configured, so every consumer (cache, rate-limit, health) degrades to a safe
// no-op instead of throwing — the app keeps working without Redis.

let cached: Redis | null | undefined;

export function getRedis(): Redis | null {
  if (cached !== undefined) return cached;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  cached = url && token ? new Redis({ url, token }) : null;
  return cached;
}
