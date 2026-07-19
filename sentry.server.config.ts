import * as Sentry from "@sentry/nextjs";
import { scrubEvent } from "@/lib/observability/sentry-scrub";

// Server runtime. Hardened for a BYOK app: PII + local-variable capture are OFF
// so a stack frame can never ship a user's decrypted API key, and beforeSend
// redacts any key material that lands in an error message/cause.
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development",
  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,
  sendDefaultPii: false,
  includeLocalVariables: false,
  enableLogs: true,
  beforeSend: scrubEvent,
});
