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

export default nextConfig;
