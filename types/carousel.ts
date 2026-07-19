export type SlideRole = "hook" | "context" | "value" | "story" | "cta";

// "mix" = Bahasa Indonesia as the base, code-mixing common English terms.
export type Language = "en" | "id" | "mix";

// Username (@handle) watermark placement controls (Phase A / Feature 4).
export type UsernamePosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";
export type UsernameSize = "small" | "medium" | "large";
export type UsernameStyle = "plain" | "minimal" | "rounded" | "premium";

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

export type LogoMode = "default" | "custom" | "none";

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
  // Brand Profile (Phase 2) — all optional so existing inputs/history stay valid
  // and the prompt is byte-identical when these are absent.
  brandProfileId?: string | null;
  logoMode?: LogoMode;
  logoOverridePath?: string | null;
  // Phase A (V2) — optional brand-context + username-watermark controls. Absent
  // ⇒ prompt unchanged from before.
  toneOfVoice?: string;
  secondaryColors?: string;
  usernamePosition?: UsernamePosition;
  usernameSize?: UsernameSize;
  usernameStyle?: UsernameStyle;
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
  /** Category label used to group presets in the selection grid. */
  category?: string;
  /** Short "best for" guidance shown as a tooltip / hint on the card. */
  bestFor?: string;
  /** Retired presets: still resolvable via getPresetById, hidden from the grid. */
  hidden?: boolean;
}
