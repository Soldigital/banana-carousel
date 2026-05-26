# Banana Carousel

> Dari ide sederhana menjadi prompt carousel Instagram premium siap generate ke Gemini AI — dalam hitungan detik.

Banana Carousel adalah web app generator prompt carousel Instagram. Anda tinggal isi topik, audience, style, dan tujuan — AI akan menyusun storyline, hook, CTA, visual direction, typography, dan layout instruction yang konsisten antar slide, siap copy-paste ke Gemini AI / Imagen.

## Highlights

- **Free + BYOK** — Pakai API key Gemini gratis Anda sendiri. Tidak ada biaya, tidak perlu daftar.
- **Privacy-first** — API key dienkripsi AES-GCM di browser Anda. Server kami tidak menyimpan apapun.
- **8 style preset** — Cinematic Luxury, Minimal Modern, Bold Typography, Soft Aesthetic, Cyberpunk Neon, Editorial Magazine, 3D Render, Hand-drawn.
- **3–10 slide** — Slider fleksibel sesuai kebutuhan.
- **EN/ID toggle** — Headline & body sesuai bahasa, visual prompt selalu English untuk kualitas Imagen optimal.
- **Master prompt 600-1500 kata** — Satu prompt komprehensif siap paste ke Gemini AI Studio.
- **Mobile-first** — Dioptimalkan untuk creator yang kerja dari HP.

## Quick Start

```powershell
npm install
npm run dev
```

Buka `http://localhost:3000`.

### Mendapatkan API key Gemini

1. Buka https://aistudio.google.com/apikey
2. Login dengan akun Google
3. Klik **Create API key**
4. Copy key (diawali `AIza...`)
5. Di Banana Carousel, klik **Set API Key** di header → paste

## Verification Checklist

| # | Skenario | Expected |
|---|----------|----------|
| 1 | `npm run dev` → buka `localhost:3000` | Landing tampil, hero + 4 mockup slide |
| 2 | Klik "Generate Sekarang" | Routing ke `/generate` |
| 3 | Tanpa API key, klik "Generate Carousel Prompt" | Toast "Masukkan API key" + modal terbuka |
| 4 | Set API key dummy, generate | Toast error "API key tidak valid" |
| 5 | Set API key valid, isi form lengkap, generate | Loading state → Output viewer muncul dengan 3 tabs |
| 6 | Tab "Per Slide" → Copy slide 1 | Clipboard berisi prompt slide 1 |
| 7 | Tab "Gemini-Ready Prompt" → Copy Master Prompt | Clipboard berisi full prompt 600+ kata |
| 8 | Paste master prompt ke gemini.google.com | Gemini menampilkan/menggenerate carousel |
| 9 | Mobile viewport 375px | Form usable, preset grid 2 kolom, copy button tetap accessible |
| 10 | Theme toggle (sun/moon icon) | Switch dark ↔ light, semua kontras readable |
| 11 | Refresh halaman | Form state tersimpan (Zustand persist), API key tetap tersimpan |
| 12 | Klik "Hapus Key" di modal | API key terhapus, banner muncul kembali |

## Architecture

- **Framework**: Next.js 15 (App Router) + TypeScript + React 19
- **Styling**: Tailwind CSS + shadcn/ui (custom built primitives)
- **State**: Zustand (form + UI stores, persisted)
- **AI**: `@google/genai` SDK, client-side BYOK
- **Theme**: `next-themes` (dark default + light toggle)
- **Animation**: Framer Motion
- **Validation**: Zod schema for AI response

### Project Structure

```
app/                    # Next.js App Router pages
  layout.tsx            # Root layout + theme + fonts + toaster
  page.tsx              # Landing page (/)
  generate/page.tsx     # Generator (/generate)
  globals.css           # Tailwind + theme tokens

components/
  api-key/              # ApiKeyModal, ApiKeyBanner
  generator/            # GeneratorForm, OutputViewer, SlideCard, presets
  landing/              # Hero, HowItWorks, FeatureExample, CtaSection
  layout/               # Header, Footer, Logo, ThemeToggle
  providers/            # ThemeProvider wrapper
  ui/                   # shadcn-style primitives (button, input, dialog, ...)

lib/
  gemini/               # Gemini SDK client + JSON schema
  prompts/              # System prompt + style presets + user prompt builder
  storage/              # AES-GCM encryption for API key in localStorage
  store/                # Zustand stores (form, ui)
  utils.ts              # cn() helper

types/
  carousel.ts           # CarouselOutput, SlidePrompt, GeneratorInput, StylePreset
```

### Prompt Engine Flow

1. User fills form → `GeneratorInput`
2. `buildUserPrompt(input)` composes brief from form + selected preset
3. `generateCarousel(input, apiKey)`:
   - Calls Gemini 2.0 Flash (with 1.5 Flash fallback) using `responseMimeType: "application/json"` + JSON schema
   - Parses + validates against Zod schema
   - Auto-corrects slide count + slide_num
4. `CarouselOutput` rendered in 3 tabs: Master Prompt / Per Slide / Global Style

## Deployment to Vercel

```powershell
npm install -g vercel
vercel
```

Atau push ke GitHub dan connect repo di vercel.com — auto-deploy on push.

## V2 Backlog (not yet implemented)

- Supabase Auth + user history & favorites
- Subscription (Pro tier) + Stripe/Midtrans
- Credit system + server-side API key
- Gemini Imagen integration (preview image in-app)
- Public showcase gallery + user submissions
- Export PDF/JSON
- MCP architecture + workflow chaining

## License

Private — built for Indonesian creators.
