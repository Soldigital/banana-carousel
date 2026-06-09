// Feature flags (public — safe to read on the client).

// Route generation through the server-side AI Gateway (multi-provider, multi-key
// rotation, cache, monitoring). When off, the app uses the legacy client-side
// Gemini path — an instant rollback switch.
export const USE_GATEWAY = process.env.NEXT_PUBLIC_USE_GATEWAY === "on";
