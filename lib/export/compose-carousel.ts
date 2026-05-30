import type { CarouselOutput, SlidePrompt } from "@/types/carousel";
import { slidePreamble } from "@/lib/prompts/system-prompt";

// One self-contained, paste-ready image prompt for a single slide.
// Starts with the per-slide preamble (role + jpg 1080x1350 + "SLIDE ke-n tentang:").
export function composeSlidePrompt(slide: SlidePrompt): string {
  return `${slidePreamble(slide.slide_num)} ${slide.headline}

[SLIDE ${slide.slide_num} — ${slide.role.toUpperCase()}]

HEADLINE: ${slide.headline}

BODY: ${slide.body}

VISUAL PROMPT: ${slide.visual_prompt}

TYPOGRAPHY: ${slide.typography_instruction}

LAYOUT: ${slide.layout_instruction}`;
}

// All slides for the "Copy All Slides" action — opens with a strong
// separate-images instruction, then each slide as a standalone block.
export function composeAllSlides(output: CarouselOutput): string {
  const n = output.slides.length;
  const header = `# ${output.carousel_title}

PENTING: Hasilkan ${n} GAMBAR TERPISAH — satu gambar JPG 1080x1350 px untuk SETIAP slide di bawah. JANGAN gabungkan beberapa slide ke dalam satu gambar. Jaga konsistensi gaya visual antar slide.

## GLOBAL STYLE
Mood: ${output.global_style.mood}
Palette: ${output.global_style.color_palette.join(", ")}
Typography: ${output.global_style.typography_family}
Aspect: ${output.global_style.aspect_ratio} (1080x1350 px)
Consistency: ${output.global_style.consistency_notes}

========================================

`;

  const slides = output.slides
    .map((s) => composeSlidePrompt(s))
    .join("\n\n========================================\n\n");

  const cta = `

========================================

## FINAL CTA
${output.cta.headline}
→ ${output.cta.action}
`;

  return header + slides + cta;
}

// Full export for .txt / .pdf download: title + global style + the
// AI-authored master prompt + the deterministic per-slide breakdown.
export function composeFullExport(output: CarouselOutput): string {
  return `============================================================
BANANA CAROUSEL — ${output.carousel_title}
============================================================

>>> MASTER PROMPT (paste ke Gemini / Nano Banana) <<<

${output.gemini_ready_prompt}


============================================================
>>> CAPTION INSTAGRAM (siap paste ke caption postingan) <<<
============================================================

${output.caption}


============================================================
>>> RINCIAN PER SLIDE (tiap slide = 1 gambar terpisah) <<<
============================================================

${composeAllSlides(output)}
`;
}

export function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "banana-carousel"
  );
}
