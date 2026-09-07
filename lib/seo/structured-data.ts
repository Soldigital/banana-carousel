import {
  SITE_URL,
  SITE_NAME,
  SITE_DESCRIPTION,
  SITE_TITLE,
} from "./site";
import { STYLE_PRESETS } from "@/lib/prompts/style-presets";

// Derived so the structured data can never disagree with the picker or the
// landing copy. Retired presets stay in the array as `hidden` for backward
// compatibility, so they must be excluded from the advertised count.
const VISIBLE_PRESET_COUNT = STYLE_PRESETS.filter((p) => !p.hidden).length;

// JSON-LD builders. Kept as plain objects so they can be embedded by the
// <JsonLd> component on any page (server or client).

// Shared FAQ — also surfaced in the on-page FAQ section and llms.txt so the
// answer text stays consistent across SEO, AI-SEO, and the UI.
export const FAQ_ITEMS: { question: string; answer: string }[] = [
  {
    question: "Apa itu Banana Carousel?",
    answer:
      "Banana Carousel adalah AI carousel generator yang mengubah ide sederhana menjadi prompt carousel Instagram premium yang siap di-generate menjadi gambar. Anda cukup memasukkan topik, audience, dan gaya visual.",
  },
  {
    question: "Apakah Banana Carousel gratis?",
    answer:
      "Banana Carousel memakai model BYOK (Bring Your Own Key): Anda memakai API key AI Anda sendiri (Gemini, OpenRouter, atau Groq), banyak di antaranya punya free tier. Akses aplikasi sendiri bersifat lifetime sekali bayar.",
  },
  {
    question: "Provider AI apa saja yang didukung?",
    answer:
      "Google Gemini (2.5 Flash & Pro), OpenRouter (Claude, GPT, Gemini, DeepSeek, Qwen, Mistral, dan lainnya), serta Groq (Llama, DeepSeek, Mixtral). Sistem otomatis berpindah ke key atau provider lain saat satu kena limit.",
  },
  {
    question: "Apakah hasilnya bisa langsung jadi gambar?",
    answer:
      "Ya. Output berisi master prompt siap-tempel yang bisa langsung dipakai di Gemini/Imagen untuk menghasilkan gambar carousel 1080x1350 yang konsisten, lengkap dengan caption Instagram siap posting.",
  },
  {
    question: "Bahasa apa yang didukung?",
    answer:
      "Headline, body, dan caption bisa dalam Bahasa Indonesia atau Inggris. Prompt visual selalu dalam bahasa Inggris agar optimal untuk model gambar.",
  },
];

export function softwareApplicationLd() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    applicationCategory: "DesignApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      priceCurrency: "IDR",
      category: "lifetime access",
    },
    featureList: [
      "AI carousel prompt generation",
      "Multi-provider AI (Gemini, OpenRouter, Groq)",
      "Automatic API key rotation & fallback",
      `${VISIBLE_PRESET_COUNT} curated visual style presets`,
      "Instagram-ready captions",
    ],
  };
}

export function organizationLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    // Google prefers a real raster logo it can crop; icon.svg no longer exists.
    logo: `${SITE_URL}/brand/icon-512.png`,
    description: SITE_DESCRIPTION,
  };
}

export function websiteLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_TITLE,
    inLanguage: "id-ID",
  };
}

export function faqLd() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
}
