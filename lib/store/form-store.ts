import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  CarouselOutput,
  GeneratorInput,
  Language,
  CtaStyle,
} from "@/types/carousel";

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
  loadFromHistory: (input: GeneratorInput, output: CarouselOutput) => void;
  reset: () => void;
}

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
      loadFromHistory: (input, output) =>
        set({ ...input, output, error: null, isGenerating: false }),
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
      }),
    },
  ),
);
