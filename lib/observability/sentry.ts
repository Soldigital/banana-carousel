import "server-only";
import * as Sentry from "@sentry/nextjs";

// Thin helper over the instrumentation-initialized SDK. captureException is a
// safe no-op when no DSN is configured, so call sites never need to guard.
export async function captureError(
  err: unknown,
  context?: Record<string, unknown>,
): Promise<void> {
  try {
    Sentry.captureException(err, context ? { extra: context } : undefined);
  } catch {
    /* never let telemetry break the request */
  }
}
