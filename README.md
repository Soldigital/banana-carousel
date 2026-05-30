# Banana Carousel

> Dari ide sederhana menjadi prompt carousel Instagram premium siap generate ke Gemini AI — dalam hitungan detik.

Banana Carousel adalah web app generator prompt carousel Instagram. Anda tinggal isi topik, audience, style, dan tujuan — AI akan menyusun storyline, hook, CTA, visual direction, typography, dan layout instruction yang konsisten antar slide, siap copy-paste ke Gemini AI / Imagen.

## Highlights

- **Lifetime access (BYOK)** — Bayar sekali Rp99.000 (normal Rp199.000), akses generator selamanya. Tetap pakai API key Gemini gratis Anda sendiri.
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

## Monetisasi (iPaymu paywall)

Akses `/generate` dikunci di balik lisensi **lifetime** (bayar sekali via iPaymu). Arsitektur tanpa database — lisensi adalah token HMAC yang memvalidasi dirinya sendiri.

**Alur:** Landing `#pricing` → `BuyButton` (isi email) → `POST /api/checkout` → iPaymu → bayar → redirect ke `/activate` (verifikasi via `POST /api/activate`, key tampil + tersimpan) + webhook `POST /api/ipaymu/notify` (kirim key via email). Gate (`components/license/LicenseGate.tsx`) memverifikasi token ke `POST /api/license/verify`.

Generate tetap berjalan **client-side** (API key Gemini user tidak pernah ke server) — paywall bersifat gate klien.

### Environment Variables

Copy `.env.example` → `.env.local` (lokal) dan set semua di **Vercel → Settings → Environment Variables** (production). Jangan commit `.env.local`.

| Var | Catatan |
|-----|---------|
| `IPAYMU_VA`, `IPAYMU_API_KEY` | Kredensial iPaymu (sandbox: `sandbox.ipaymu.com/integration`, prod: `my.ipaymu.com/integration`) |
| `IPAYMU_MODE` | `sandbox` atau `production` |
| `LICENSE_SECRET` | String acak (mis. `openssl rand -hex 32`) — tanda tangan lisensi |
| `OWNER_LICENSE_KEY` | Key owner rahasia — tempel di app untuk akses gratis |
| `RESEND_API_KEY`, `LICENSE_FROM_EMAIL` | Pengiriman email lisensi (Resend; verifikasi domain) |
| `NEXT_PUBLIC_APP_URL` | mis. `https://www.bananacarousel.click` |

## Deployment to Vercel

```powershell
npm install -g vercel
vercel
```

Atau push ke GitHub dan connect repo di vercel.com — auto-deploy on push. **Set semua Environment Variables di Vercel** lalu redeploy. Webhook iPaymu memakai URL publik (`/api/ipaymu/notify`) — tes lokal butuh tunnel (mis. ngrok) atau langsung di Vercel Preview.

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
