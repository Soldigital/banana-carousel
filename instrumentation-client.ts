import * as Sentry from "@sentry/nextjs";

// Browser runtime. No Session Replay and no PII: this app has API-key input
// fields, and keeping the client lean matters for Core Web Vitals. Error +
// light tracing only. (Replay can be added later if needed.)
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,
  sendDefaultPii: false,
  enableLogs: true,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
