import type { StylePreset } from "@/types/carousel";

export const STYLE_PRESETS: StylePreset[] = [
  {
    id: "cinematic-luxury",
    name: "Cinematic Luxury",
    description: "Modern luxury, black + gold, dramatic lighting, premium mood.",
    gradient: "linear-gradient(135deg, #000000 0%, #FACC15 100%)",
    mood: "premium, dramatic, aspirational",
    colorHints: ["#0A0A0A", "#FACC15", "#1F1F1F", "#F59E0B"],
    visualInstruction:
      "Modern luxury black and gold aesthetic, dramatic cinematic lighting, bold serif/sans typography, premium composition, realistic shadows, glossy textures, high contrast, emotional storytelling, ultra detailed, 8k quality, depth of field.",
    typographyHint:
      "Bold modern sans-serif headline (e.g. Inter Black, Plus Jakarta Sans Bold) paired with thin elegant subhead. Generous letter spacing on uppercase labels.",
  },
  {
    id: "minimal-modern",
    name: "Minimal Modern",
    description: "Clean white space, simple shapes, refined typography.",
    gradient: "linear-gradient(135deg, #FAFAFA 0%, #E5E5E5 100%)",
    mood: "calm, refined, professional",
    colorHints: ["#FFFFFF", "#0A0A0A", "#F5F5F5", "#737373"],
    visualInstruction:
      "Minimal modern editorial design, abundant white space, refined geometric composition, subtle drop shadows, soft monochrome palette with single accent color, Swiss design principles, clean and uncluttered, high readability.",
    typographyHint:
      "Refined geometric sans-serif (e.g. Inter, Helvetica). Large display headline, generous line-height, small caps for labels.",
  },
  {
    id: "bold-typography",
    name: "Bold Typography",
    description: "Typography-led, oversized headlines, viral-ready impact.",
    gradient: "linear-gradient(135deg, #FACC15 0%, #DC2626 100%)",
    mood: "energetic, viral, attention-grabbing",
    colorHints: ["#FACC15", "#0A0A0A", "#DC2626", "#FFFFFF"],
    visualInstruction:
      "Bold typography-driven design, oversized display headline filling most of the canvas, high contrast color blocking, minimal supporting imagery, viral social media aesthetic, modern editorial poster vibes.",
    typographyHint:
      "Massive bold sans-serif display font (Anton, Bebas Neue, Inter Black). Headline dominates 60-80% of slide area. Tight leading.",
  },
  {
    id: "soft-aesthetic",
    name: "Soft Aesthetic",
    description: "Pastel tones, soft gradients, dreamy and feminine vibes.",
    gradient: "linear-gradient(135deg, #FCE7F3 0%, #DBEAFE 100%)",
    mood: "dreamy, calming, feminine, soft",
    colorHints: ["#FCE7F3", "#DBEAFE", "#FEF3C7", "#F3E8FF"],
    visualInstruction:
      "Soft pastel aesthetic, gentle gradients, dreamy atmosphere, blurred bokeh backgrounds, rounded organic shapes, soft shadows, light film grain, instagram-friendly girly aesthetic, gentle warmth.",
    typographyHint:
      "Soft humanist sans-serif or rounded serif (e.g. Quicksand, DM Serif). Hand-lettered accents allowed. Generous spacing.",
  },
  {
    id: "cyberpunk-neon",
    name: "Cyberpunk Neon",
    description: "Neon glow, dark cityscape, futuristic, Gen-Z edgy.",
    gradient: "linear-gradient(135deg, #7C3AED 0%, #06B6D4 100%)",
    mood: "futuristic, edgy, electric",
    colorHints: ["#0A0A0A", "#7C3AED", "#06B6D4", "#EC4899"],
    visualInstruction:
      "Cyberpunk neon aesthetic, dark moody background with vibrant neon accents (purple, cyan, magenta), glowing edges, scan lines, futuristic UI overlays, holographic elements, rain reflections, blade runner mood, Y2K resurgence.",
    typographyHint:
      "Geometric monospaced or techno display font (e.g. JetBrains Mono Bold, Orbitron). Glitch effects, chromatic aberration on key words.",
  },
  {
    id: "editorial-magazine",
    name: "Editorial Magazine",
    description: "Vogue/Wired-inspired layout, serif drama, sophisticated.",
    gradient: "linear-gradient(135deg, #FEF3C7 0%, #92400E 100%)",
    mood: "sophisticated, editorial, intellectual",
    colorHints: ["#FAFAF9", "#1C1917", "#A8A29E", "#78350F"],
    visualInstruction:
      "High-end editorial magazine layout, mix of large serif headlines and clean sans-serif body, grid-based composition, generous margins, photography-led with documentary realism, sophisticated muted palette, Vogue / Wired / Kinfolk mood.",
    typographyHint:
      "Large display serif headline (e.g. Playfair Display, GT Sectra) paired with clean sans body. Drop caps, justified text columns, italic pull quotes.",
  },
  {
    id: "3d-render",
    name: "3D Render",
    description: "Soft 3D objects, claymorphism, playful product-style.",
    gradient: "linear-gradient(135deg, #F472B6 0%, #FB923C 100%)",
    mood: "playful, modern, tactile",
    colorHints: ["#F472B6", "#FB923C", "#A78BFA", "#34D399"],
    visualInstruction:
      "Modern 3D render aesthetic, soft claymorphism, pastel rendered objects, smooth subsurface scattering, octane/blender quality, isometric or floating composition, soft global illumination, playful character or product as focal point.",
    typographyHint:
      "Rounded modern sans-serif (e.g. Nunito, Manrope Bold). Bouncy friendly tone. Mix with extruded 3D type for headlines.",
  },
  {
    id: "hand-drawn",
    name: "Hand-drawn",
    description: "Sketchy, illustrative, authentic indie creator vibes.",
    gradient: "linear-gradient(135deg, #FEF3C7 0%, #FB923C 100%)",
    mood: "authentic, personal, warm, indie",
    colorHints: ["#FEF9C3", "#451A03", "#FED7AA", "#9A3412"],
    visualInstruction:
      "Hand-drawn illustration style, sketchy ink lines, watercolor washes, imperfect organic shapes, warm paper texture background, doodle annotations, indie zine aesthetic, authentic and personal creator vibes.",
    typographyHint:
      "Hand-lettered headline or rough script. Mix with friendly sans-serif body (e.g. Caveat for accents, Inter for body). Underlines and circles as emphasis.",
  },
];

export function getPresetById(id: string): StylePreset {
  return STYLE_PRESETS.find((p) => p.id === id) ?? STYLE_PRESETS[0];
}
