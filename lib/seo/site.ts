// Single source of truth for site-wide SEO constants.

export const SITE_URL = (
  process.env.NEXT_PUBLIC_APP_URL || "https://www.bananacarousel.click"
).replace(/\/$/, "");

export const SITE_NAME = "Banana Carousel";

export const SITE_TAGLINE = "AI Prompt Generator untuk Carousel Instagram";

export const SITE_TITLE = `${SITE_NAME} — ${SITE_TAGLINE}`;

export const SITE_DESCRIPTION =
  "Ubah ide sederhana menjadi prompt carousel Instagram premium yang siap di-generate dalam hitungan detik. Didukung multi-provider AI (Gemini, OpenRouter, Groq) dengan rotasi API key otomatis.";

export const SITE_KEYWORDS = [
  "AI carousel generator",
  "Instagram carousel generator",
  "carousel prompt generator",
  "social media carousel creator",
  "Gemini AI carousel",
  "generator carousel Instagram",
  "AI content creator Indonesia",
  "prompt generator carousel",
];

export const TWITTER_HANDLE = "@bananacarousel";
