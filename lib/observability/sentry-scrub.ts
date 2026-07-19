// Redacts provider API-key material that could leak into error messages /
// causes before any event leaves the server. BYOK app: never ship a user's key
// to Sentry. Used in beforeSend on the server + edge Sentry configs.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SentryEvent = any;

const KEY_PATTERNS: RegExp[] = [
  /AIza[0-9A-Za-z_\-]{20,}/g, // Google / Gemini
  /sk-or-[A-Za-z0-9_\-]{20,}/g, // OpenRouter
  /gsk_[A-Za-z0-9]{20,}/g, // Groq
  /sk-[A-Za-z0-9]{20,}/g, // OpenAI-style
  /Bearer\s+[A-Za-z0-9._\-]{20,}/g, // auth headers
];

function redact(s: string): string {
  let out = s;
  for (const re of KEY_PATTERNS) out = out.replace(re, "[REDACTED_KEY]");
  return out;
}

export function scrubEvent(event: SentryEvent): SentryEvent {
  try {
    // Never send request bodies/headers/cookies (may carry sensitive data).
    if (event.request) {
      delete event.request.data;
      delete event.request.cookies;
      delete event.request.headers;
    }
    if (event.message) event.message = redact(String(event.message));
    for (const ex of event.exception?.values ?? []) {
      if (ex.value) ex.value = redact(String(ex.value));
    }
    if (event.extra) {
      for (const k of Object.keys(event.extra)) {
        if (typeof event.extra[k] === "string") {
          event.extra[k] = redact(event.extra[k]);
        }
      }
    }
  } catch {
    /* scrubbing must never throw */
  }
  return event;
}
