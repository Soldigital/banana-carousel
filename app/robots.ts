import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Keep private/auth surfaces out of the index.
        disallow: [
          "/api/",
          "/admin",
          "/dashboard",
          "/reset-password",
          "/activate",
          "/auth/",
        ],
      },
    ],
    sitemap: [`${SITE_URL}/sitemap.xml`, `${SITE_URL}/ai-sitemap.xml`],
    host: SITE_URL,
  };
}
