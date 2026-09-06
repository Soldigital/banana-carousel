import type { MetadataRoute } from "next";
import { SITE_DESCRIPTION } from "@/lib/seo/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Banana Carousel — AI Carousel Generator",
    short_name: "Banana Carousel",
    description: SITE_DESCRIPTION,
    start_url: "/",
    display: "standalone",
    background_color: "#0A0A0A",
    theme_color: "#FACC15",
    categories: ["productivity", "design", "social"],
    icons: [
      { src: "/brand/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      // `maskable` lets Android crop to its own shape without clipping the mark;
      // the asset already has generous padding inside the yellow tile.
      { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
