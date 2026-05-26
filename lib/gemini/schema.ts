import { z } from "zod";

export const SlideRoleEnum = z.enum([
  "hook",
  "context",
  "value",
  "story",
  "cta",
]);

export const SlidePromptSchema = z.object({
  slide_num: z.number().int().min(1).max(10),
  role: SlideRoleEnum,
  headline: z.string().min(1),
  body: z.string().min(1),
  visual_prompt: z.string().min(20),
  typography_instruction: z.string().min(1),
  layout_instruction: z.string().min(1),
});

export const GlobalStyleSchema = z.object({
  color_palette: z.array(z.string()).min(2),
  mood: z.string().min(1),
  typography_family: z.string().min(1),
  aspect_ratio: z.string().min(1),
  consistency_notes: z.string().min(1),
});

export const CarouselOutputSchema = z.object({
  carousel_title: z.string().min(1),
  hook: z.object({
    headline: z.string().min(1),
    body: z.string().min(1),
  }),
  slides: z.array(SlidePromptSchema).min(3).max(10),
  cta: z.object({
    headline: z.string().min(1),
    action: z.string().min(1),
  }),
  global_style: GlobalStyleSchema,
  gemini_ready_prompt: z.string().min(200),
});

export type CarouselOutputZ = z.infer<typeof CarouselOutputSchema>;

export const GEMINI_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    carousel_title: { type: "string" },
    hook: {
      type: "object",
      properties: {
        headline: { type: "string" },
        body: { type: "string" },
      },
      required: ["headline", "body"],
    },
    slides: {
      type: "array",
      items: {
        type: "object",
        properties: {
          slide_num: { type: "integer" },
          role: {
            type: "string",
            enum: ["hook", "context", "value", "story", "cta"],
          },
          headline: { type: "string" },
          body: { type: "string" },
          visual_prompt: { type: "string" },
          typography_instruction: { type: "string" },
          layout_instruction: { type: "string" },
        },
        required: [
          "slide_num",
          "role",
          "headline",
          "body",
          "visual_prompt",
          "typography_instruction",
          "layout_instruction",
        ],
      },
    },
    cta: {
      type: "object",
      properties: {
        headline: { type: "string" },
        action: { type: "string" },
      },
      required: ["headline", "action"],
    },
    global_style: {
      type: "object",
      properties: {
        color_palette: {
          type: "array",
          items: { type: "string" },
        },
        mood: { type: "string" },
        typography_family: { type: "string" },
        aspect_ratio: { type: "string" },
        consistency_notes: { type: "string" },
      },
      required: [
        "color_palette",
        "mood",
        "typography_family",
        "aspect_ratio",
        "consistency_notes",
      ],
    },
    gemini_ready_prompt: { type: "string" },
  },
  required: [
    "carousel_title",
    "hook",
    "slides",
    "cta",
    "global_style",
    "gemini_ready_prompt",
  ],
} as const;
