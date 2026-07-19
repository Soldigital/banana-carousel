import { SITE_URL } from "@/lib/seo/site";

export const runtime = "nodejs";

// AI-crawler sitemap: points generative engines at the home page and the
// llms.txt knowledge documents so they can ground answers about the product.
export async function GET() {
  const urls = [
    { loc: `${SITE_URL}/`, type: "page" },
    { loc: `${SITE_URL}/llms.txt`, type: "knowledge" },
    { loc: `${SITE_URL}/llms-full.txt`, type: "knowledge" },
  ];

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map((u) => `  <url>\n    <loc>${u.loc}</loc>\n    <changefreq>weekly</changefreq>\n  </url>`)
  .join("\n")}
</urlset>`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
