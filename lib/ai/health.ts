import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRedis } from "./redis";
import type { ProviderId } from "./types";

// Per-key health tracking. Hot counters live in Redis (fast reads for the
// monitoring panel); a sampled durable copy goes to ai_key_health for history
// and admin aggregates. All writes are best-effort — never block generation.

export interface HealthEvent {
  userId: string;
  provider: ProviderId;
  keyId: string;
  model: string | null;
  ok: boolean;
  latencyMs: number;
  errorCode?: string;
}

export interface KeyHealth {
  ok: number;
  err: number;
  successRate: number; // 0..1
  lastLatencyMs: number;
  lastOk: boolean | null;
  lastCode: string | null;
}

const HEALTH_TTL = 60 * 60 * 24 * 7; // 7 days

function healthHashKey(userId: string, provider: string, keyId: string): string {
  return `cc:health:${userId}:${provider}:${keyId}`;
}

export async function recordHealth(ev: HealthEvent): Promise<void> {
  const redis = getRedis();
  if (redis) {
    const hk = healthHashKey(ev.userId, ev.provider, ev.keyId);
    try {
      const p = redis.pipeline();
      p.hincrby(hk, ev.ok ? "ok" : "err", 1);
      p.hset(hk, {
        last_latency: ev.latencyMs,
        last_ok: ev.ok ? 1 : 0,
        last_code: ev.errorCode ?? "",
        last_model: ev.model ?? "",
        updated_at: Date.now(),
      });
      p.expire(hk, HEALTH_TTL);
      await p.exec();
    } catch {
      /* ignore */
    }
  }

  // Durable sample (skip the happy-path noise: always log errors, sample ~1/4
  // of successes to keep the table small).
  const shouldPersist = !ev.ok || Math.random() < 0.25;
  if (shouldPersist) {
    try {
      const admin = createAdminClient();
      await admin.from("ai_key_health").insert({
        user_id: ev.userId,
        provider: ev.provider,
        key_id: ev.keyId,
        model: ev.model,
        ok: ev.ok,
        latency_ms: ev.latencyMs,
        error_code: ev.errorCode ?? null,
      });
    } catch {
      /* ignore */
    }
  }
}

export async function getHealthSnapshot(
  userId: string,
  keys: { id: string; provider: ProviderId }[],
): Promise<Record<string, KeyHealth | null>> {
  const redis = getRedis();
  const out: Record<string, KeyHealth | null> = {};
  if (!redis) {
    for (const k of keys) out[k.id] = null;
    return out;
  }
  await Promise.all(
    keys.map(async (k) => {
      try {
        const h = await redis.hgetall<Record<string, string | number>>(
          healthHashKey(userId, k.provider, k.id),
        );
        if (!h) {
          out[k.id] = null;
          return;
        }
        const ok = Number(h.ok ?? 0);
        const err = Number(h.err ?? 0);
        const total = ok + err;
        out[k.id] = {
          ok,
          err,
          successRate: total > 0 ? ok / total : 1,
          lastLatencyMs: Number(h.last_latency ?? 0),
          lastOk: h.last_ok === undefined ? null : Number(h.last_ok) === 1,
          lastCode: (h.last_code as string) || null,
        };
      } catch {
        out[k.id] = null;
      }
    }),
  );
  return out;
}
