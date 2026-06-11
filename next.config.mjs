import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  async headers() {
    // Conservative, app-wide security headers. Intentionally NO restrictive
    // Content-Security-Policy: the app loads many first-party-approved third
    // parties (GTM, GA, Meta/TikTok pixels, Clarity, PostHog, Tidio) and connects
    // to Supabase/Upstash/AI providers — a strict CSP would need careful
    // allow-listing and is best added as a deliberate follow-up.
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
};

// Sentry build wrapper. Source-map upload only runs when SENTRY_AUTH_TOKEN +
// org/project are set; without them the build still succeeds (just no maps).
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  widenClientFileUpload: true,
});
