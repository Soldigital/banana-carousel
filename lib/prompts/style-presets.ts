import type { StylePreset } from "@/types/carousel";

// Category display order for the grouped style picker.
export const STYLE_CATEGORIES: string[] = [
  "Luxury & Premium",
  "Modern & Corporate",
  "Typography & Viral Impact",
  "Social Impact & Documentary",
  "Futuristic & Digital",
  "Creative & Illustration",
  "Artistic & Craft",
  // V2 Phase B — premium library additions (available to all paid users).
  "Business & Personal Brand",
  "Education",
  "Islamic",
  "Startup & Tech",
  "Minimalist",
];

// NOTE on backward-compatibility: `stylePresetId` is stored on every generated
// carousel. The 7 presets that existed before keep their original `id` so old
// history still resolves to the same style. Retired styles (e.g. soft-aesthetic)
// stay in the array as `hidden: true` so old carousels still resolve to *them*
// while being absent from the picker. getPresetById() never throws.
export const STYLE_PRESETS: StylePreset[] = [
  // ───────────────────────── Luxury & Premium ─────────────────────────
  {
    id: "cinematic-luxury",
    name: "Cinematic Luxury",
    description:
      "Luxury advertising & cinematic poster vibes — dramatic lighting, deep shadows, gold & champagne tones.",
    category: "Luxury & Premium",
    bestFor:
      "Luxury brands, CEOs, consultants, premium services, executive & personal branding.",
    gradient: "linear-gradient(135deg, #0A0A0A 0%, #C9A227 100%)",
    mood: "premium, dramatic, exclusive, authoritative",
    colorHints: ["#0A0A0A", "#C9A227", "#F5E6C8", "#FFFFF0"],
    visualInstruction:
      "High-end luxury advertisement aesthetic, cinematic dramatic lighting with deep shadows and rich contrast, premium palette of black, gold, champagne and ivory, glossy reflective surfaces, emotional and aspirational storytelling, sense of exclusivity and sophistication, ultra detailed, 8k quality, shallow depth of field.",
    typographyHint:
      "Headlines: Playfair Display / Bodoni Moda / Cormorant Garamond (elegant high-contrast serif). Body: Inter / Manrope / Helvetica Neue. Style: elegant serif headlines paired with clean modern sans-serif.",
  },
  {
    id: "editorial-magazine",
    name: "Editorial Magazine",
    description:
      "Vogue / Forbes / Wired inspired — strong type hierarchy, oversized headlines, sophisticated layouts.",
    category: "Luxury & Premium",
    bestFor:
      "Thought leadership, business insights, educational content, professional storytelling, personal brands.",
    gradient: "linear-gradient(135deg, #1C1917 0%, #A8A29E 100%)",
    mood: "sophisticated, editorial, intellectual, authoritative",
    colorHints: ["#FAFAF9", "#1C1917", "#A8A29E", "#78350F"],
    visualInstruction:
      "High-end editorial magazine layout inspired by Vogue, Forbes, Wired and Monocle, strong typographic hierarchy with oversized headlines, sophisticated grid-based composition, generous margins, photography-led with documentary realism, refined muted palette, balances elegance with authority.",
    typographyHint:
      "Headlines: Libre Baskerville / Bodoni Moda / DM Serif Display. Body: Inter / Source Sans Pro / Neue Haas Grotesk. Style: editorial serif mixed with minimalist sans-serif; drop caps and italic pull quotes.",
  },
  {
    id: "apple-keynote",
    name: "Apple Keynote Style",
    description:
      "Ultra-clean premium design — huge whitespace, minimal distractions, precise hierarchy.",
    category: "Luxury & Premium",
    bestFor:
      "Technology, startups, productivity, innovation, presentations, educational content.",
    gradient: "linear-gradient(135deg, #FFFFFF 0%, #D1D1D6 100%)",
    mood: "clean, precise, premium, focused",
    colorHints: ["#FFFFFF", "#1D1D1F", "#F5F5F7", "#0071E3"],
    visualInstruction:
      "Ultra-clean premium Apple keynote aesthetic, vast whitespace, minimal distractions, single product or concept as the hero, precise visual hierarchy, soft realistic shadows, subtle gradients, every element purposeful, calm and confident, studio lighting, crisp high resolution.",
    typographyHint:
      "Headlines: SF Pro Display / Inter / Helvetica Neue. Body: SF Pro Text / Inter. Style: modern geometric sans-serif only, tight and precise.",
  },

  // ──────────────────────── Modern & Corporate ────────────────────────
  {
    id: "minimal-modern",
    name: "Minimal Modern",
    description:
      "Clean, contemporary, balanced — generous whitespace, subtle palette, structured layouts.",
    category: "Modern & Corporate",
    bestFor:
      "Corporate communication, educational content, professional services, startups.",
    gradient: "linear-gradient(135deg, #FAFAFA 0%, #E5E5E5 100%)",
    mood: "calm, refined, professional",
    colorHints: ["#FFFFFF", "#0A0A0A", "#F5F5F5", "#737373"],
    visualInstruction:
      "Minimal modern editorial design, abundant white space, refined geometric composition, subtle drop shadows, soft monochrome palette with a single accent color, clean and uncluttered, high readability, professional and contemporary.",
    typographyHint:
      "Headlines: Inter / Manrope / Plus Jakarta Sans. Body: Inter / DM Sans. Style: modern sans-serif, generous line-height.",
  },
  {
    id: "swiss-style",
    name: "Swiss Style",
    description:
      "International Style — strict grids, strong alignment, typography-first, timeless clarity.",
    category: "Modern & Corporate",
    bestFor:
      "Corporate reports, educational slides, consulting, data-driven communication.",
    gradient: "linear-gradient(135deg, #FFFFFF 0%, #DC2626 100%)",
    mood: "functional, organized, timeless, objective",
    colorHints: ["#FFFFFF", "#111111", "#DC2626", "#9CA3AF"],
    visualInstruction:
      "Swiss International Style design, strict mathematical grid system, strong left alignment, typography-first communication, flat bold red and black accents on white, functional and objective, information clarity above decoration, generous negative space, timeless and precise.",
    typographyHint:
      "Headlines: Helvetica Neue / Univers / Inter. Body: Helvetica Neue / IBM Plex Sans. Style: clean sans-serif with strict hierarchy.",
  },
  {
    id: "startup-tech",
    name: "Startup Tech",
    description:
      "Silicon Valley / SaaS look — gradients, UI-inspired elements, sleek digital systems.",
    category: "Modern & Corporate",
    bestFor: "AI, SaaS, startups, digital products, innovation, future trends.",
    gradient: "linear-gradient(135deg, #6366F1 0%, #06B6D4 100%)",
    mood: "modern, digital, optimistic, sleek",
    colorHints: ["#0F172A", "#6366F1", "#06B6D4", "#F8FAFC"],
    visualInstruction:
      "Modern digital-first SaaS startup aesthetic inspired by Silicon Valley, smooth vibrant gradients (indigo to cyan), UI-inspired cards and glassmorphism, subtle grid and dashboard elements, sleek and polished visual system, clean tech product mood, soft glows.",
    typographyHint:
      "Headlines: Sora / Space Grotesk / Inter. Body: Inter / DM Sans. Style: geometric sans-serif.",
  },

  // ────────────────────── Typography & Viral Impact ─────────────────────
  {
    id: "bold-typography",
    name: "Bold Typography",
    description:
      "Type is the hero — oversized headlines, strong contrast, scroll-stopping impact.",
    category: "Typography & Viral Impact",
    bestFor:
      "Instagram carousels, viral content, hooks, marketing campaigns, educational content.",
    gradient: "linear-gradient(135deg, #FACC15 0%, #DC2626 100%)",
    mood: "energetic, viral, attention-grabbing",
    colorHints: ["#FACC15", "#0A0A0A", "#DC2626", "#FFFFFF"],
    visualInstruction:
      "Bold typography-driven design where text is the hero, oversized display headline filling most of the canvas, aggressive hierarchy, high-contrast color blocking, minimal supporting imagery, viral social-media poster aesthetic designed to stop scrolling instantly.",
    typographyHint:
      "Headlines: Anton / Bebas Neue / League Spartan (extra-bold, oversized). Body: Inter / Montserrat. Style: extra-bold sans-serif, headline dominates 60-80% of the slide.",
  },
  {
    id: "brutalist",
    name: "Brutalist Design",
    description:
      "Raw, unconventional, anti-design — extreme contrast, asymmetry, commands attention.",
    category: "Typography & Viral Impact",
    bestFor:
      "Gen Z audiences, disruptive brands, social commentary, trend-based content.",
    gradient: "linear-gradient(135deg, #FFFFFF 0%, #000000 100%)",
    mood: "raw, disruptive, bold, unconventional",
    colorHints: ["#FFFFFF", "#000000", "#FF3B30", "#FFE600"],
    visualInstruction:
      "Raw brutalist anti-design aesthetic, intentionally imperfect and unconventional, extreme black-and-white contrast with harsh accent colors, oversized typography, asymmetrical off-grid layouts, visible borders and blocks, web-brutalism mood that commands attention.",
    typographyHint:
      "Headlines: Space Grotesk / IBM Plex Sans / Neue Montreal. Body: IBM Plex Sans. Style: experimental sans-serif, deliberately stark.",
  },
  {
    id: "hero-campaign",
    name: "Hero Campaign Visual",
    description:
      "Movie-poster & campaign energy — dominant headlines, strong focal point, emotional messaging.",
    category: "Typography & Viral Impact",
    bestFor:
      "Campaigns, social movements, fundraising, leadership messaging, impact-driven content.",
    gradient: "linear-gradient(135deg, #7F1D1D 0%, #111827 100%)",
    mood: "powerful, emotional, rallying, cinematic",
    colorHints: ["#111827", "#DC2626", "#F3F4F6", "#B91C1C"],
    visualInstruction:
      "Hero campaign visual inspired by political campaigns, movie posters and global movement branding, single dominant focal point, powerful condensed headline, dramatic emotional imagery, strong directional lighting, bold message-driven composition with high impact.",
    typographyHint:
      "Headlines: Oswald / Anton / League Gothic (condensed bold). Body: Inter / Source Sans Pro. Style: condensed bold campaign typography.",
  },

  // ─────────────────── Social Impact & Documentary ────────────────────
  {
    id: "human-centered",
    name: "Human-Centered Storytelling",
    description:
      "Authentic human emotion — real faces, community moments, empathy-building warmth.",
    category: "Social Impact & Documentary",
    bestFor:
      "NGOs, nonprofits, zakat institutions, community empowerment, CSR programs.",
    gradient: "linear-gradient(135deg, #FB923C 0%, #FBBF24 100%)",
    mood: "warm, empathetic, authentic, hopeful",
    colorHints: ["#FFF7ED", "#7C2D12", "#FB923C", "#FCD34D"],
    visualInstruction:
      "Human-centered storytelling photography, authentic human emotions and genuine facial expressions, community interactions and personal journeys, warm natural light, candid documentary realism, builds empathy and emotional connection, hopeful and dignified portrayal.",
    typographyHint:
      "Headlines: Montserrat / Inter / Source Sans Pro. Body: Inter / Nunito. Style: friendly modern sans-serif.",
  },
  {
    id: "documentary-photojournalism",
    name: "Documentary Photojournalism",
    description:
      "Authentic, unmanipulated documentary photography — realism, truth, genuine moments.",
    category: "Social Impact & Documentary",
    bestFor:
      "Impact reports, humanitarian work, field documentation, social programs.",
    gradient: "linear-gradient(135deg, #1F2937 0%, #6B7280 100%)",
    mood: "honest, raw, grounded, truthful",
    colorHints: ["#111827", "#F9FAFB", "#6B7280", "#B45309"],
    visualInstruction:
      "Authentic documentary photojournalism, minimal manipulation, true-to-life realism, genuine unposed moments, available natural light, photojournalistic framing and subtle grain, prioritizes truth and emotional storytelling through real field documentation.",
    typographyHint:
      "Headlines: Franklin Gothic / Inter / Archivo. Body: Source Sans Pro / Inter. Style: journalistic sans-serif, understated.",
  },
  {
    id: "luxury-cinematic-documentary",
    name: "Luxury Cinematic Documentary",
    description:
      "Documentary authenticity meets premium cinema — dramatic lighting, depth, refined grading.",
    category: "Social Impact & Documentary",
    bestFor:
      "Fundraising campaigns, annual reports, NGO branding, social impact storytelling.",
    gradient: "linear-gradient(135deg, #0A0A0A 0%, #92400E 100%)",
    mood: "emotional, premium, cinematic, dignified",
    colorHints: ["#0A0A0A", "#D6B370", "#F5E6C8", "#57534E"],
    visualInstruction:
      "Luxury cinematic documentary style, combines documentary authenticity with premium cinematic visuals, emotional storytelling enhanced by dramatic directional lighting, rich depth of field, refined warm color grading, dignified and moving, film-grade quality.",
    typographyHint:
      "Headlines: Playfair Display / Cormorant Garamond. Body: Inter / Manrope. Style: luxury serif + modern sans-serif.",
  },

  // ───────────────────────── Futuristic & Digital ──────────────────────
  {
    id: "ai-futuristic",
    name: "AI Futuristic",
    description:
      "AI, data networks & holograms — glowing elements, digital environments, advanced tech.",
    category: "Futuristic & Digital",
    bestFor: "AI content, technology brands, innovation, future predictions.",
    gradient: "linear-gradient(135deg, #0EA5E9 0%, #2563EB 100%)",
    mood: "futuristic, intelligent, sleek, advanced",
    colorHints: ["#0B1120", "#38BDF8", "#22D3EE", "#E0F2FE"],
    visualInstruction:
      "AI futuristic aesthetic, glowing holographic systems and data networks, abstract neural connections and particle flows, deep blue and cyan luminescence on dark backgrounds, advanced technology interfaces, clean sci-fi sophistication, sense of intelligence and the future.",
    typographyHint:
      "Headlines: Space Grotesk / Orbitron / Exo 2. Body: Inter / IBM Plex Sans. Style: futuristic geometric typography.",
  },
  {
    id: "cyberpunk-neon",
    name: "Cyberpunk Neon",
    description:
      "Neon glow, dark cityscapes, strong cyber aesthetics — high-energy and futuristic.",
    category: "Futuristic & Digital",
    bestFor: "Gaming, crypto, technology, youth audiences, entertainment.",
    gradient: "linear-gradient(135deg, #7C3AED 0%, #06B6D4 100%)",
    mood: "futuristic, edgy, electric",
    colorHints: ["#0A0A0A", "#7C3AED", "#06B6D4", "#EC4899"],
    visualInstruction:
      "Cyberpunk neon aesthetic, dark moody environment with vibrant neon accents (purple, cyan, magenta), glowing edges, digital cityscape, scan lines, holographic UI overlays, rain reflections, blade-runner mood, high-energy and futuristic.",
    typographyHint:
      "Headlines: Orbitron / Audiowide / Rajdhani. Body: Exo 2 / Inter. Style: futuristic display typography with glow.",
  },
  {
    id: "y2k",
    name: "Y2K Aesthetic",
    description:
      "Early-2000s internet — chrome, holographic textures, glossy metallic nostalgia.",
    category: "Futuristic & Digital",
    bestFor: "Gen Z content, fashion, internet culture, lifestyle brands.",
    gradient: "linear-gradient(135deg, #C0C0C0 0%, #A78BFA 50%, #22D3EE 100%)",
    mood: "nostalgic, glossy, playful, digital",
    colorHints: ["#C0C0C0", "#A78BFA", "#22D3EE", "#F472B6"],
    visualInstruction:
      "Y2K aesthetic inspired by early-2000s internet culture, liquid chrome and metallic effects, holographic iridescent textures, glossy bubbly interfaces, lens flares and star sparkles, nostalgic digital pop, playful and shiny.",
    typographyHint:
      "Headlines: Eurostile / Microgramma / Orbitron. Body: Inter / Arial. Style: tech-inspired chrome display fonts.",
  },

  // ─────────────────────── Creative & Illustration ─────────────────────
  {
    id: "3d-render",
    name: "3D Render",
    description:
      "Realistic or stylized 3D objects with premium lighting and depth — modern and engaging.",
    category: "Creative & Illustration",
    bestFor: "Technology, products, educational content, explainers.",
    gradient: "linear-gradient(135deg, #F472B6 0%, #FB923C 100%)",
    mood: "playful, modern, tactile",
    colorHints: ["#F472B6", "#FB923C", "#A78BFA", "#34D399"],
    visualInstruction:
      "Modern 3D render aesthetic, soft claymorphism, pastel rendered objects with smooth subsurface scattering, Octane/Blender quality, premium lighting and depth, floating or isometric composition, soft global illumination, playful product or character as focal point.",
    typographyHint:
      "Headlines: Sora / Inter / Poppins. Body: Inter. Style: clean geometric sans-serif; extruded 3D type for headlines.",
  },
  {
    id: "isometric",
    name: "Isometric Illustration",
    description:
      "Isometric perspective to visualize systems, workflows and business processes.",
    category: "Creative & Illustration",
    bestFor: "Business education, process explanations, SaaS, productivity.",
    gradient: "linear-gradient(135deg, #818CF8 0%, #34D399 100%)",
    mood: "structured, explanatory, clean, modern",
    colorHints: ["#EEF2FF", "#4F46E5", "#10B981", "#F59E0B"],
    visualInstruction:
      "Isometric vector illustration, precise 30-degree isometric perspective, visualizes systems, workflows, business processes and abstract concepts as connected scenes, clean flat-but-dimensional shapes, soft shadows, organized and explanatory, modern tech palette.",
    typographyHint:
      "Headlines: Inter / DM Sans. Body: Inter. Style: functional sans-serif.",
  },
  {
    id: "flat-illustration",
    name: "Flat Illustration",
    description:
      "Clean vector illustrations — simple shapes, bold colors, friendly and approachable.",
    category: "Creative & Illustration",
    bestFor: "Education, startups, social media, community content.",
    gradient: "linear-gradient(135deg, #60A5FA 0%, #FBBF24 100%)",
    mood: "friendly, approachable, cheerful, clear",
    colorHints: ["#3B82F6", "#FBBF24", "#EF4444", "#10B981"],
    visualInstruction:
      "Clean flat vector illustration, simple geometric shapes, bold cheerful color palette, minimal detail with strong silhouettes, friendly and approachable characters, scalable modern flat-design style, universal and easy to read.",
    typographyHint:
      "Headlines: Nunito / Poppins / Montserrat. Body: Nunito / Inter. Style: friendly rounded sans-serif.",
  },

  // ───────────────────────── Artistic & Craft ──────────────────────────
  {
    id: "hand-drawn",
    name: "Hand-Drawn",
    description:
      "Organic, sketch-based, personal — imperfect lines and a genuine human touch.",
    category: "Artistic & Craft",
    bestFor:
      "Personal brands, storytelling, educational creators, indie projects.",
    gradient: "linear-gradient(135deg, #FEF3C7 0%, #FB923C 100%)",
    mood: "authentic, personal, warm, indie",
    colorHints: ["#FEF9C3", "#451A03", "#FED7AA", "#9A3412"],
    visualInstruction:
      "Hand-drawn illustration style, sketchy ink lines, watercolor washes, imperfect organic shapes, warm paper texture background, doodle annotations, indie zine aesthetic, authentic and personal creator vibes.",
    typographyHint:
      "Headlines: Caveat / Kalam / Patrick Hand (handwritten). Body: Inter / Nunito. Style: handwritten accents + modern sans-serif body.",
  },
  {
    id: "paper-cut",
    name: "Paper Cut Style",
    description:
      "Layered handcrafted paper artwork — depth, texture and tactile visual uniqueness.",
    category: "Artistic & Craft",
    bestFor: "Creative storytelling, educational content, lifestyle brands.",
    gradient: "linear-gradient(135deg, #FDE68A 0%, #FCA5A5 100%)",
    mood: "crafted, tactile, layered, warm",
    colorHints: ["#FEF3C7", "#F87171", "#60A5FA", "#34D399"],
    visualInstruction:
      "Layered paper-cut craft style, stacked cut-paper shapes creating real depth and drop shadows, tactile handcrafted texture, soft pastel layers, diorama-like composition, warm and artisanal, papercraft realism.",
    typographyHint:
      "Headlines: Poppins / Montserrat. Body: Inter. Style: clean modern sans-serif.",
  },
  {
    id: "japandi",
    name: "Japandi Style",
    description:
      "Japanese minimalism × Scandinavian simplicity — calm, balanced, natural and timeless.",
    category: "Artistic & Craft",
    bestFor:
      "Mindfulness, self-development, premium lifestyle, wellness, productivity.",
    gradient: "linear-gradient(135deg, #E7E0D6 0%, #A89B86 100%)",
    mood: "calm, balanced, refined, natural",
    colorHints: ["#EDE7DD", "#3F3A34", "#A89B86", "#7C6F5A"],
    visualInstruction:
      "Japandi aesthetic fusing Japanese minimalism and Scandinavian simplicity, calm and balanced compositions, natural earthy palette (warm beige, clay, muted sage, charcoal), organic materials like wood, linen and ceramic, soft diffused light, generous negative space, timeless and serene.",
    typographyHint:
      "Headlines: Noto Serif / Cormorant Garamond. Body: Inter / Manrope. Style: elegant serif + minimalist sans-serif.",
  },

  // ─────────────── Business & Personal Brand (V2 premium) ───────────────
  {
    id: "business-clean-authority",
    name: "Clean Authority",
    description:
      "Crisp, confident corporate-clean look — white space, restrained accent color, trustworthy and modern.",
    category: "Business & Personal Brand",
    bestFor:
      "Coaches, consultants, B2B, personal brands, LinkedIn-style thought leadership.",
    gradient: "linear-gradient(135deg, #0F172A 0%, #2563EB 100%)",
    mood: "professional, confident, trustworthy, clean",
    colorHints: ["#0F172A", "#2563EB", "#F8FAFC", "#E2E8F0"],
    visualInstruction:
      "Clean professional business aesthetic, generous white space, one restrained accent color (deep blue), crisp grid layouts, subtle soft shadows, confident and authoritative mood, modern flat illustrations or clean photography, premium-but-approachable, ultra sharp, 8k.",
    typographyHint:
      "Headlines: Inter / Manrope / Söhne (geometric sans, bold). Body: Inter / Source Sans. Strong hierarchy, tight tracking on headlines.",
  },
  // ───────────────────────── Education (V2 premium) ─────────────────────
  {
    id: "education-explainer",
    name: "Bright Explainer",
    description:
      "Friendly educational style — clear diagrams, highlighted keywords, approachable colors that aid retention.",
    category: "Education",
    bestFor:
      "Educators, course creators, how-to & tips content, study/tutorial carousels.",
    gradient: "linear-gradient(135deg, #FEF3C7 0%, #10B981 100%)",
    mood: "friendly, clear, energetic, approachable",
    colorHints: ["#10B981", "#FBBF24", "#1F2937", "#FFFFFF"],
    visualInstruction:
      "Friendly educational explainer aesthetic, clean flat vector illustrations and simple diagrams, highlighted keywords with marker/underline accents, generous readable spacing, cheerful but legible palette, icons supporting each point, approachable and trustworthy, crisp 8k.",
    typographyHint:
      "Headlines: Poppins / Nunito (rounded friendly sans, bold). Body: Inter. Use highlight/marker accents on key words.",
  },
  // ───────────────────────── Islamic (V2 premium) ──────────────────────
  {
    id: "islamic-elegant",
    name: "Islamic Elegant",
    description:
      "Refined Islamic aesthetic — geometric arabesque patterns, calm emerald & gold, dignified and serene.",
    category: "Islamic",
    bestFor:
      "Dakwah, kajian, Islamic brands, motivational & spiritual content, Ramadan campaigns.",
    gradient: "linear-gradient(135deg, #064E3B 0%, #C9A227 100%)",
    mood: "serene, dignified, spiritual, elegant",
    colorHints: ["#064E3B", "#C9A227", "#F5F5DC", "#FFFFFF"],
    visualInstruction:
      "Elegant modern Islamic aesthetic, subtle geometric arabesque and girih patterns as accents (never overwhelming), calm emerald green, gold and cream palette, soft light, dignified and serene mood, generous negative space, tasteful ornamental borders, respectful and premium, crisp 8k. Avoid depicting faces of religious figures.",
    typographyHint:
      "Headlines: elegant high-contrast serif or refined geometric sans (Cormorant, Poppins). Latin script for id/en; optional tasteful Arabic calligraphy accent. Calm, generous spacing.",
  },
  // ───────────────────────── Startup & Tech (V2 premium) ───────────────
  {
    id: "startup-gradient",
    name: "Startup Gradient",
    description:
      "Modern SaaS/startup vibe — vivid gradients, glassmorphism, bold geometric shapes, energetic and current.",
    category: "Startup & Tech",
    bestFor:
      "Startups, SaaS, tech products, product launches, founders & growth content.",
    gradient: "linear-gradient(135deg, #6D28D9 0%, #EC4899 100%)",
    mood: "energetic, modern, bold, optimistic",
    colorHints: ["#6D28D9", "#EC4899", "#0EA5E9", "#0B1020"],
    visualInstruction:
      "Modern startup/SaaS aesthetic, vivid multi-stop gradients, glassmorphism cards with soft blur, bold geometric shapes and abstract 3D blobs, clean UI-inspired layouts, energetic and optimistic, high contrast, crisp vector + subtle glow, 8k.",
    typographyHint:
      "Headlines: Space Grotesk / Satoshi / Inter (modern geometric sans, bold). Body: Inter. Tight, confident hierarchy.",
  },
  // ───────────────────────── Minimalist (V2 premium) ───────────────────
  {
    id: "minimal-mono",
    name: "Minimal Mono",
    description:
      "Ultra-minimal monochrome — one accent, massive white space, calm and premium restraint.",
    category: "Minimalist",
    bestFor:
      "Premium minimalist brands, quotes, design-led personal brands, calm aesthetics.",
    gradient: "linear-gradient(135deg, #111111 0%, #9CA3AF 100%)",
    mood: "calm, refined, minimal, premium",
    colorHints: ["#111111", "#FFFFFF", "#9CA3AF", "#F5F5F5"],
    visualInstruction:
      "Ultra-minimalist monochrome aesthetic, massive negative space, a single subtle accent, restrained grayscale palette, perfectly aligned grid, one focal element per slide, calm and premium, subtle fine-line details, gallery-like composition, crisp 8k.",
    typographyHint:
      "Headlines: Helvetica Neue / Söhne / Neue Haas (clean neutral sans). Body: same family. Big type, lots of air, precise alignment.",
  },

  // ───────────────────────── Retired (hidden) ──────────────────────────
  // Kept so carousels generated before the 2026 style refresh still resolve to
  // their original style instead of falling back. Not shown in the picker.
  {
    id: "soft-aesthetic",
    name: "Soft Aesthetic",
    description: "Pastel tones, soft gradients, dreamy and feminine vibes.",
    category: "Artistic & Craft",
    hidden: true,
    gradient: "linear-gradient(135deg, #FCE7F3 0%, #DBEAFE 100%)",
    mood: "dreamy, calming, feminine, soft",
    colorHints: ["#FCE7F3", "#DBEAFE", "#FEF3C7", "#F3E8FF"],
    visualInstruction:
      "Soft pastel aesthetic, gentle gradients, dreamy atmosphere, blurred bokeh backgrounds, rounded organic shapes, soft shadows, light film grain, instagram-friendly girly aesthetic, gentle warmth.",
    typographyHint:
      "Soft humanist sans-serif or rounded serif (e.g. Quicksand, DM Serif). Hand-lettered accents allowed. Generous spacing.",
  },
];

export function getPresetById(id: string): StylePreset {
  return STYLE_PRESETS.find((p) => p.id === id) ?? STYLE_PRESETS[0];
}
