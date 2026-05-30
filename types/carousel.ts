export type SlideRole = "hook" | "context" | "value" | "story" | "cta";

export type Language = "en" | "id";

export type CtaStyle =
  | "follow"
  | "save"
  | "share"
  | "comment"
  | "dm"
  | "link"
  | "engagement";

export interface SlidePrompt {
  slide_num: number;
  role: SlideRole;
  headline: string;
  body: string;
  visual_prompt: string;
  typography_instruction: string;
  layout_instruction: string;
}

export interface GlobalStyle {
  color_palette: string[];
  mood: string;
  typography_family: string;
  aspect_ratio: string;
  consistency_notes: string;
}

export interface CarouselOutput {
  carousel_title: string;
  hook: {
    headline: string;
    body: string;
  };
  slides: SlidePrompt[];
  cta: {
    headline: string;
    action: string;
  };
  global_style: GlobalStyle;
  gemini_ready_prompt: string;
  caption: string;
}

export interface GeneratorInput {
  title: string;
  brandName?: string;
  topic: string;
  audience: string;
  goal: string;
  stylePresetId: string;
  customStyleNotes?: string;
  dominantColors?: string;
  slideCount: number;
  language: Language;
  ctaStyle: CtaStyle;
}

export interface StylePreset {
  id: string;
  name: string;
  description: string;
  gradient: string;
  mood: string;
  colorHints: string[];
  visualInstruction: string;
  typographyHint: string;
}
