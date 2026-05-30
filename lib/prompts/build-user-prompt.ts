import type { GeneratorInput } from "@/types/carousel";
import { getPresetById } from "./style-presets";

const CTA_LABELS: Record<string, string> = {
  follow: "Follow akun untuk konten serupa",
  save: "Save carousel ini untuk dibaca lagi",
  share: "Share ke teman yang butuh",
  comment: "Komen pendapatmu di bawah",
  dm: "DM kami untuk konsultasi / info lebih lanjut",
  link: "Klik link di bio untuk langkah selanjutnya",
  engagement: "Engagement maksimal (mix follow + save + share)",
};

export function buildUserPrompt(input: GeneratorInput): string {
  const preset = getPresetById(input.stylePresetId);

  const customNotes =
    input.customStyleNotes?.trim()
      ? `\n- Additional creator notes: ${input.customStyleNotes.trim()}`
      : "";

  const dominantColors =
    input.dominantColors?.trim()
      ? `\n- Creator-specified dominant colors: ${input.dominantColors.trim()} (use these to override or anchor the preset palette)`
      : "";

  const brand = input.brandName?.trim() ?? "";
  const brandBrief = brand
    ? `\n- Brand name / handle: ${brand}`
    : "";
  const brandWatermark = brand
    ? `\n- BRAND WATERMARK: Place a small, subtle brand watermark "${brand}" in a consistent corner (e.g. bottom-left) of EVERY slide's visual_prompt. It must be tasteful and unobtrusive — small, low-opacity, never covering the main subject or headline. Mention this watermark explicitly inside each slide's visual_prompt.`
    : "";

  return `Generate a complete carousel structure for the following creator brief.

# Creator Brief
- Carousel title: ${input.title || "(not specified — propose one)"}${brandBrief}
- Topic / theme: ${input.topic}
- Target audience: ${input.audience}
- Goal of the content: ${input.goal}
- Number of slides: ${input.slideCount} (slide 1 = hook, slide ${input.slideCount} = cta, slides in between = value/story)
- Output language for headlines & body: ${input.language === "id" ? "Bahasa Indonesia" : "English"}
- CTA style: ${input.ctaStyle} (${CTA_LABELS[input.ctaStyle] ?? input.ctaStyle})

# Style Direction
- Selected visual preset: ${preset.name}
- Preset description: ${preset.description}
- Preset mood: ${preset.mood}
- Preset color hints: ${preset.colorHints.join(", ")}
- Preset visual instruction (anchor every visual_prompt to this): ${preset.visualInstruction}
- Preset typography hint: ${preset.typographyHint}${dominantColors}${customNotes}${brandWatermark}

# Requirements
1. Produce exactly ${input.slideCount} slides in the \`slides\` array.
2. Strictly follow the storytelling arc (hook → context/value → peak insight → CTA).
3. Maintain perfect visual consistency across all slides (same palette, same lighting language, same typography family).
4. Every visual_prompt is in ENGLISH, ultra-detailed, ready for Gemini Imagen.
5. Headlines and body in ${input.language === "id" ? "Bahasa Indonesia" : "English"} — punchy, scroll-stopping, audience-appropriate.
6. The \`gemini_ready_prompt\` field is the single most important deliverable — it must be a 600-1500 word, structured, paste-ready master prompt.
7. Output ONLY the JSON object. No prose, no markdown fences.`;
}
