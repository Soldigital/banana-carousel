import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  CarouselOutput,
  GeneratorInput,
  Language,
  CtaStyle,
  LogoMode,
  UsernamePosition,
  UsernameSize,
  UsernameStyle,
} from "@/types/carousel";
import type { BrandProfile } from "@/types/db";

const CTA_VALUES: CtaStyle[] = [
  "follow",
  "save",
  "share",
  "comment",
  "dm",
  "link",
  "engagement",
];
const LANG_VALUES: Language[] = ["id", "en", "mix"];
const POS_VALUES: UsernamePosition[] = [
  "top-left",
  "top-center",
  "top-right",
  "bottom-left",
  "bottom-center",
  "bottom-right",
];
const SIZE_VALUES: UsernameSize[] = ["small", "medium", "large"];
const USTYLE_VALUES: UsernameStyle[] = ["plain", "minimal", "rounded", "premium"];
const pick = <T>(v: unknown, allowed: T[], fallback: T): T =>
  allowed.includes(v as T) ? (v as T) : fallback;

interface FormState extends GeneratorInput {
  isGenerating: boolean;
  output: CarouselOutput | null;
  error: string | null;
  setField: <K extends keyof GeneratorInput>(
    key: K,
    value: GeneratorInput[K],
  ) => void;
  setLanguage: (lang: Language) => void;
  setCtaStyle: (cta: CtaStyle) => void;
  setStylePreset: (id: string) => void;
  setSlideCount: (n: number) => void;
  setIsGenerating: (b: boolean) => void;
  setOutput: (o: CarouselOutput | null) => void;
  setError: (e: string | null) => void;
  selectBrandProfile: (profile: BrandProfile | null) => void;
  loadFromHistory: (input: GeneratorInput, output: CarouselOutput | null) => void;
  reset: () => void;
}

// Brand-profile fields default to a logo-on, no-profile state. logoMode
// "default" preserves the existing brand-name watermark behavior; only an
// explicit "none" (Remove Logo) suppresses it.
const DEFAULT_BRAND = {
  brandProfileId: null as string | null,
  logoMode: "default" as LogoMode,
  logoOverridePath: null as string | null,
  // Phase A: undefined ⇒ prompt uses today's default watermark text (byte-identical).
  toneOfVoice: undefined as string | undefined,
  secondaryColors: undefined as string | undefined,
  usernamePosition: undefined as UsernamePosition | undefined,
  usernameSize: undefined as UsernameSize | undefined,
  usernameStyle: undefined as UsernameStyle | undefined,
};

const DEFAULT_INPUT: GeneratorInput = {
  title: "",
  brandName: "",
  topic: "",
  audience: "",
  goal: "",
  stylePresetId: "cinematic-luxury",
  customStyleNotes: "",
  dominantColors: "",
  slideCount: 7,
  language: "id",
  ctaStyle: "engagement",
  ...DEFAULT_BRAND,
};

export const useFormStore = create<FormState>()(
  persist(
    (set) => ({
      ...DEFAULT_INPUT,
      isGenerating: false,
      output: null,
      error: null,
      setField: (key, value) => set({ [key]: value } as Partial<FormState>),
      setLanguage: (language) => set({ language }),
      setCtaStyle: (ctaStyle) => set({ ctaStyle }),
      setStylePreset: (stylePresetId) => set({ stylePresetId }),
      setSlideCount: (slideCount) => set({ slideCount }),
      setIsGenerating: (isGenerating) => set({ isGenerating }),
      setOutput: (output) => set({ output, error: null }),
      setError: (error) => set({ error }),
      selectBrandProfile: (profile) => {
        if (!profile) {
          set({ ...DEFAULT_BRAND });
          return;
        }
        const cta = profile.cta_style as CtaStyle | null;
        const sc =
          profile.default_slide_count != null
            ? Math.min(Math.max(profile.default_slide_count, 3), 10)
            : null;
        set((s) => ({
          brandProfileId: profile.id,
          brandName: profile.instagram_username || profile.name || s.brandName,
          dominantColors: profile.brand_color || s.dominantColors,
          stylePresetId: profile.default_style_preset_id || s.stylePresetId,
          ctaStyle: cta && CTA_VALUES.includes(cta) ? cta : s.ctaStyle,
          // Phase A auto-fills (only when the profile provides a value).
          audience: profile.target_audience || s.audience,
          language: profile.default_language
            ? pick(profile.default_language, LANG_VALUES, s.language)
            : s.language,
          slideCount: sc ?? s.slideCount,
          toneOfVoice: profile.tone_of_voice || undefined,
          secondaryColors: profile.secondary_color || undefined,
          usernamePosition: profile.username_position
            ? pick<UsernamePosition | undefined>(
                profile.username_position,
                POS_VALUES,
                undefined,
              )
            : s.usernamePosition,
          usernameSize: profile.username_size
            ? pick<UsernameSize | undefined>(profile.username_size, SIZE_VALUES, undefined)
            : s.usernameSize,
          usernameStyle: profile.username_style
            ? pick<UsernameStyle | undefined>(
                profile.username_style,
                USTYLE_VALUES,
                undefined,
              )
            : s.usernameStyle,
          logoMode: "default",
          logoOverridePath: null,
        }));
      },
      loadFromHistory: (input, output) =>
        // Reset brand fields first so a reopened older carousel (which lacks
        // them) doesn't inherit stale values; input overrides when present.
        set({
          ...DEFAULT_BRAND,
          ...input,
          output,
          error: null,
          isGenerating: false,
        }),
      reset: () =>
        set({
          ...DEFAULT_INPUT,
          isGenerating: false,
          output: null,
          error: null,
        }),
    }),
    {
      name: "banana-carousel.form.v1",
      partialize: (s) => ({
        title: s.title,
        brandName: s.brandName,
        topic: s.topic,
        audience: s.audience,
        goal: s.goal,
        stylePresetId: s.stylePresetId,
        customStyleNotes: s.customStyleNotes,
        dominantColors: s.dominantColors,
        slideCount: s.slideCount,
        language: s.language,
        ctaStyle: s.ctaStyle,
        brandProfileId: s.brandProfileId,
        logoMode: s.logoMode,
        logoOverridePath: s.logoOverridePath,
        toneOfVoice: s.toneOfVoice,
        secondaryColors: s.secondaryColors,
        usernamePosition: s.usernamePosition,
        usernameSize: s.usernameSize,
        usernameStyle: s.usernameStyle,
      }),
    },
  ),
);
