import "server-only";

// Lean, dependency-safe Sentry capture. Sentry only loads/initializes when
// SENTRY_DSN is set, so this is a zero-cost no-op until you provision it. Used
// for server-side error visibility in the AI pipeline (the main observability
// gap). Full client + tracing instrumentation can be layered on later.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let sentryMod: any = null;
let initialized = false;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getSentry(): Promise<any> {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return null;
  if (sentryMod) return sentryMod;
  try {
    const mod = await import("@sentry/nextjs");
    if (!initialized) {
      mod.init({
        dsn,
        environment: process.env.VERCEL_ENV ?? "development",
        tracesSampleRate: 0,
      });
      initialized = true;
    }
    sentryMod = mod;
    return mod;
  } catch {
    return null;
  }
}

export async function captureError(
  err: unknown,
  context?: Record<string, unknown>,
): Promise<void> {
  const s = await getSentry();
  if (!s) return;
  try {
    s.captureException(err, context ? { extra: context } : undefined);
  } catch {
    /* never let telemetry break the request */
  }
}
