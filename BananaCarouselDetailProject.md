# Banana Carousel Generator — Dokumentasi Detail Proyek

> Dibuat sebagai referensi analisis untuk pengembangan aplikasi lebih lanjut. Berisi ringkasan produk, arsitektur, model data, alur bisnis, postur keamanan, dan status tooling per **19 Juli 2026**.

---

## 1. Apa Produk Ini

**Banana Carousel Generator** adalah SaaS berbahasa Indonesia yang mengubah ide konten (topik, target audiens, gaya, tujuan) menjadi **prompt siap-pakai untuk model gambar Gemini/"Nano Banana"**, dipakai untuk membuat slide carousel Instagram. Aplikasi **tidak men-generate gambar sendiri** — ia men-generate teks prompt terstruktur: hook slide, prompt per-slide (visual + tipografi + layout), CTA, dan master prompt (600–1500 kata) untuk 3–10 slide, dengan 8 preset gaya dan toggle EN/ID.

### Model Bisnis
- **BYOK (Bring Your Own Key)** — user memasukkan API key Gemini/OpenRouter/Groq sendiri, dienkripsi AES-256-GCM sebelum disimpan.
- **Lisensi lifetime** sekali bayar (~Rp99.000–299.000 tergantung status Founding Member) via **iPaymu**, atau transfer manual dengan notifikasi Telegram ke admin.
- **Founding Member**: 100 slot pertama, dialokasikan atomik via RPC `claim_founding_number()`.
- **Pro Annual**: langganan tahunan (Rp99.000/tahun), perpanjangan manual.
- **Program afiliasi**: referral dengan komisi, dilacak via cookie `ref` + tabel `affiliates`/`affiliate_earnings`.
- **Promo code**: diskon fixed/percentage/trial/upgrade.

---

## 2. Tech Stack

| Layer | Teknologi |
|---|---|
| Framework | Next.js 16.2 (App Router, Turbopack), React 19, TypeScript 5.7 |
| Styling/UI | Tailwind CSS 3, Radix UI primitives, shadcn-style components, Framer Motion, next-themes |
| State | Zustand (persisted) |
| AI/LLM | `@google/genai` (Gemini), `openai` SDK (mode kompatibel untuk OpenRouter/Groq) |
| Data & Auth | Supabase (Postgres + Auth + Storage), `@supabase/ssr` |
| Pembayaran | iPaymu v2 (integrasi REST custom, HMAC-SHA256) |
| Email | Resend |
| Cache/Rate-limit | Upstash Redis + `@upstash/ratelimit` |
| Validasi | Zod; **JSON repair**: `jsonrepair`; **Export PDF**: `jspdf` |
| Observability | `@sentry/nextjs` (server/edge/client terpisah), `@vercel/speed-insights` |
| Virtualisasi | `@tanstack/react-virtual` (history list) |
| Lint | ESLint 9 + `eslint-config-next` (flat config) — `next lint` sudah dihapus di Next.js 16, project ini sudah dimigrasikan |

**Deploy**: Vercel (project `banana-carousel`, org `soldigitals-projects`, domain produksi `bananacarousel.click`). Cron harian (`0 3 * * *`) via `vercel.json` memanggil `/api/cron/cleanup-carousels`.

---

## 3. Struktur Direktori

```
app/                    # Next.js App Router — halaman + API routes
  api/                  # 40+ API route handlers (lihat §5)
  activate/ admin/ dashboard/ founders/ generate/ login/
  reset-password/ transfer/ ref/[code]/ auth/callback/
components/
  admin/ analytics/ api-key/ dashboard/ generator/ history/
  landing/ layout/ license/ pricing/ providers/ seo/ ui/
lib/
  ai/                   # AI Gateway (BYOK multi-provider, lihat §7.1)
  auth/ config/ data/ email/ export/ gemini/ (legacy path)
  ipaymu/ license/ observability/ prompts/ security/ seo/
  storage/ store/ supabase/ telegram/
supabase/
  migrations/           # 13 file migrasi SQL (lihat §6)
types/                  # carousel.ts, db.ts — domain types
scripts/                # compress-examples.mjs, set-admin-passwords.mjs
assets-raw/             # source gallery images (di-gitignore, sebelum compress)
```

---

## 4. Halaman (Routes)

| Route | Deskripsi |
|---|---|
| `/` | Landing page (Hero, HowItWorks, FeatureExample, ExampleGallery, Pricing, FAQ, CTA) |
| `/generate` | Layar utama generator — `GeneratorForm` + `OutputViewer`, dibatasi `LicenseGate` + `ApiKeyBanner/Modal` untuk BYOK |
| `/dashboard` | Riwayat generasi, brand profile, panel affiliate, kontrol founder |
| `/admin` | Konsol admin — user, promo, affiliate, grafik penjualan, pengumuman, tutorial |
| `/login`, `/reset-password`, `/activate`, `/transfer` | Alur auth & lisensi |
| `/founders` | Landing info Founding Member |
| `/ref/[code]` | Redirect referral affiliate |
| `/auth/callback` | Callback OAuth/email Supabase |

---

## 5. API Routes (per kategori)

- **Generate**: `POST /api/generate` — endpoint utama, lewat AI Gateway (auth → rate-limit `gen:${userId}` 20/60s → load BYOK keys → `runGateway()`)
- **Carousel CRUD**: `carousels`, `carousels/[id]`, `carousels/recycle-bin`, `carousels/empty-bin`, `cron/cleanup-carousels`
- **Brand Profile**: `brand-profiles`, `brand-profiles/[id]`, `brand-profiles/logo`, `brand-profiles/dna` (ekstraksi "Brand DNA" via AI)
- **API Keys (BYOK)**: `keys`, `keys/[id]`, `keys/health`
- **Lisensi/Auth**: `license/verify|claim|status`, `auth/license-login`, `activate`
- **Pembayaran**: `checkout`, `ipaymu/notify` (webhook — **sudah di-hardening**, lihat §8), `manual-order`, `founding`
- **Promo & Affiliate**: `promo/validate`, `promo/redeem`, `affiliate`, `account/founder-display`
- **Admin** (semua gated `getAdminUser()`/`getSuperAdminUser()`): `add-user`, `update-user`, `ban`, `role`, `promo`, `promo/[id]`, `affiliates`, `orders/approve`, `orders/reject`, `resend-license`, `announcement`, `tutorial`, `email`
- **Lainnya**: `track` (analytics event), `ai-sitemap.xml`

---

## 6. Model Data & Skema Database (Supabase, 13 migrasi)

| Tabel | Fungsi | RLS |
|---|---|---|
| `profiles` | 1:1 `auth.users`; `is_pro`/`is_admin`/`tier` (free/founding/lifetime/pro_annual)/`founder_number`/`role` (user/supervisor)/`banned` | SELECT scoped `auth.uid()=id`; **tidak ada UPDATE policy untuk user** (mencegah self-escalation) |
| `orders` | Audit trail pembayaran; `method` (ipaymu/manual/promo), `status` (pending→paid/approved/rejected), `promo_code`, `referred_by` | SELECT/INSERT scoped `user_id`; UPDATE hanya service-role |
| `carousels` | `input`/`output` jsonb, soft-delete (`deleted_at`), full-text search (`search_text` + pg_trgm GIN index), `slide_count` generated. View `carousel_list` untuk history cepat | Full CRUD scoped `user_id` |
| `brand_profiles` | Preset brand per-user, termasuk `brand_dna` jsonb (AI-generated) | Full CRUD scoped `user_id` |
| `ai_provider_keys` + `ai_key_health` | BYOK key terenkripsi + log kesehatan/rotasi (Redis-backed di app layer) | SELECT scoped `user_id` (catatan: kolom ciphertext tetap ikut ter-return ke row miliknya sendiri — low-risk, sudah didokumentasikan di audit) |
| `app_settings` | Config k/v (tutorial, announcement) | SELECT publik (`true`) — sengaja, konten non-sensitif; write service-role only |
| `promo_codes` | Kode diskon fixed/percentage/trial/upgrade | RLS enabled, **tanpa policy** — hanya service-role yang bisa akses |
| `affiliates`, `affiliate_earnings`, `pending_referrals` | Sistem referral/komisi | SELECT scoped per user/affiliate; write service-role only |

**Storage buckets**: `transfer-proofs` (privat, scoped per-uid folder), `brand-logos` (publik sengaja — logo non-sensitif, tapi write dibatasi per-uid).

**RPC penting**: `claim_founding_number()` — `SECURITY DEFINER`, `search_path` di-fix, EXECUTE dibatasi ke `service_role` saja (migrasi 0011, hardening eksplisit).

---

## 7. Alur Bisnis Utama

### 7.1 AI Gateway (BYOK Multi-Provider)
- **Entry point**: `app/api/generate/route.ts` → `runGateway()` di `lib/ai/gateway.ts`
- Rotasi round-robin antar provider (**Gemini, OpenRouter, Groq**) dan antar key per provider, diurutkan berdasarkan health score (`lib/ai/health.ts`, Redis-backed, key `cc:health:{userId}:{provider}:{keyId}` — di-scope per row UUID, tidak bocor antar key)
- Batas waktu keras 52 detik (di bawah limit fungsi Vercel 60 detik: `maxDuration = 60`)
- Fallback: cache → key darurat bisnis kalau semua key user gagal
- Dua jalur provider:
  - **Gemini** (`lib/ai/providers/gemini.ts`): model chain `gemini-2.5-flash → gemini-2.0-flash → gemini-2.5-flash-lite`
  - **OpenAI-compatible** (`lib/ai/providers/openai-compat.ts`, dipakai OpenRouter & Groq): `max_tokens` capped **6144** (diturunkan dari 8192 — lihat §9 riwayat perbaikan) untuk menghindari 413 di tier gratis Groq
- **Klasifikasi error** (`lib/ai/errors.ts`): `invalid_key`, `rate_limit`, `request_too_large` (baru, dipisah dari rate_limit), `model_not_found`, `parse_error`, `network`, `timeout`, `unknown`
- **Jalur legacy** (`lib/gemini/generate-carousel.ts`): client-only, single-key, aktif kalau flag `NEXT_PUBLIC_USE_GATEWAY=off` (default di `.env.example` — **kemungkinan masih jalur produksi kecuali sudah di-set eksplisit `on` di Vercel**)

### 7.2 Lisensi (Self-Validating, Tanpa Perlu DB)
- `lib/license/token.ts`: token = `base64url(payload) + "." + base64url(HMAC-SHA256(payload))`, verifikasi pakai `crypto.timingSafeEqual` (constant-time)
- `signRef()`/`verifyRef()`: referenceId iPaymu membawa email+plan+promo code, di-sign HMAC, dipakai untuk mengaitkan pembayaran ke pembeli tanpa perlu session/login duluan ("Beli = Daftar")
- `OWNER_LICENSE_KEY`: bypass key pemilik, selalu valid

### 7.3 Pembayaran (iPaymu)
- `app/api/checkout/route.ts`: harga dihitung **selalu di server** (tidak pernah dipercaya dari client); rate-limited per-IP
- `app/api/ipaymu/notify/route.ts` (webhook publik, tanpa auth): re-query status transaksi ke iPaymu (`checkTransaction`) sebelum grant apa pun; **referenceId HARUS diambil dari `transactionReferenceId(tx)` — bukan dari body request** (fixed, lihat §9)
- `grantEntitlementByEmail()` (`lib/license/entitlement.ts`): idempotent via `trx_id`, insert `orders` row (audit trail), set `is_pro`, assign tier/founding slot, extend annual, apply referral reward

### 7.4 Dashboard & History
- Feature-flagged: `USE_HISTORY_V2` — search/filter/soft-delete/recycle-bin/virtualized list (`@tanstack/react-virtual`) kalau on; grid sederhana kalau off

---

## 8. Feature Flags (`lib/config/flags.ts`, semua `NEXT_PUBLIC_*`, default **off**)

| Flag | Fungsi | Catatan |
|---|---|---|
| `USE_GATEWAY` | AI Gateway multi-provider vs jalur legacy client-side Gemini | Instant rollback switch |
| `USE_HISTORY_V2` | Dashboard history v2 (search/recycle-bin) | Migrasi 0007 aman terlepas dari flag |
| `USE_BRAND_PROFILES` | Brand Profile + logo management | — |
| `USE_PRICING_V2` | Tier/Founding counter/Founder Wall pricing UI | Migrasi 0010 aman terlepas dari flag |
| `USE_AFFILIATE` | Program afiliasi/referral | Migrasi 0013 aman terlepas dari flag |

**Penting**: cek nilai aktual flag ini di **Vercel → Settings → Environment Variables** untuk tahu jalur mana yang benar-benar hidup di produksi — jangan asumsikan dari `.env.example` saja.

---

## 9. Riwayat Perbaikan Penting (Sesi Ini)

| Tanggal | Perbaikan | File Utama |
|---|---|---|
| 2026-07-13 | `next lint` dihapus di Next.js 16 → migrasi ke ESLint 9 + `eslint-config-next` (flat config) | `eslint.config.mjs`, `package.json` |
| 2026-07-18 | Tooling lokal: Node/npm PATH, Git/GitHub CLI/Vercel CLI/Supabase CLI ter-install & terautentikasi | — (environment, bukan kode) |
| 2026-07-18 | **[KRITIS]** Fix celah entitlement fraud di webhook iPaymu — referenceId sekarang hanya dari `transactionReferenceId(tx)`, tidak lagi dipercaya dari body request | `app/api/ipaymu/notify/route.ts` |
| 2026-07-19 | Fix false "kena limit/quota habis" pada key BYOK baru — pisah kode error `request_too_large` (413) dari `rate_limit` (429); turunkan `max_tokens` Groq/OpenRouter 8192→6144; perkaya pesan quota | `lib/ai/errors.ts`, `lib/ai/providers/openai-compat.ts`, `lib/gemini/generate-carousel.ts`, `app/api/generate/route.ts` |

---

## 10. Postur Keamanan (Ringkasan Audit)

Audit menyeluruh (secret handling, RLS Supabase, otorisasi API routes) sudah dilakukan. Status saat ini:

**✅ Sudah diperbaiki**: celah kritis webhook iPaymu (lihat §9).

**🟡 Belum diperbaiki (medium, disengaja/perlu keputusan produk)**:
1. Sentry client-side (`instrumentation-client.ts`) belum pakai `beforeSend: scrubEvent` seperti server/edge config — risiko rendah-menengah kalau ada exception JS yang membawa raw API key.
2. Tidak ada Content-Security-Policy (`next.config.mjs`) — sengaja diomit karena banyak script pihak ketiga (GTM/GA4/Meta/TikTok Pixel/Clarity/PostHog/Tidio).
3. Validasi input `/api/generate` dan `/api/checkout` masih manual (bukan Zod schema) — belum ada eksploitasi terkonfirmasi, tapi lebih rapuh.

**🔵 Low-risk (dengan justifikasi, tidak mendesak)**:
4. Passphrase enkripsi BYOK key di client (`lib/storage/crypto.ts`) diturunkan dari `navigator.userAgent` + origin — obfuscation terhadap localStorage inspection, bukan proteksi XSS aktif.
5. Kolom `key_ciphertext` di `ai_provider_keys` ikut ter-return ke `select('*')` milik row sendiri (RLS Postgres row-level, bukan column-level) — tetap ciphertext AES-256-GCM, tetap milik user sendiri.
6. `/api/track` tanpa auth/rate-limit — risiko rendah (tidak sentuh DB/entitlement).

**✅ Sudah diverifikasi aman**: RLS lengkap di semua tabel, semua admin routes gated, tidak ada IDOR, license token HMAC dengan constant-time compare, tidak ada secret hardcoded/ter-commit, `lib/supabase/admin.ts` dilindungi `server-only`.

---

## 11. Known Issues / Technical Debt

- **18 lint issues** pre-existing (14 error, 4 warning) — antara lain: `interface` kosong di `components/ui/input.tsx` & `textarea.tsx`, `require()` style import di `tailwind.config.ts`, beberapa `setState` di dalam `useEffect` (`ThemeToggle.tsx`, `BrandProfilesPanel.tsx`), warning `useVirtualizer` tidak kompatibel React Compiler (`HistoryPanel.tsx`).
- **`npm audit`**: ~6–9 kerentanan transitif (dompurify via jspdf, @opentelemetry/core via Sentry) — pre-existing, belum ditindaklanjuti.
- **Tidak ada test suite** untuk kode aplikasi (hanya test bawaan library di `node_modules`) — verifikasi perubahan selama ini mengandalkan `typecheck`/`lint`/`build` + review manual.
- **Dokumentasi vs realita**: `README.md`/`project_instruction.md` mendeskripsikan versi awal "tanpa database", padahal implementasi sekarang sudah pakai Supabase penuh (auth, storage, admin dashboard, riwayat) — dokumen tersebut sudah agak usang.
- **Jalur ganda AI**: ada dua implementasi paralel (gateway baru vs `lib/gemini/generate-carousel.ts` legacy) yang harus di-maintain bersamaan selama `USE_GATEWAY` belum firmly "on" di produksi — technical debt yang disengaja untuk rollback instan, tapi perlu diperhatikan kalau menambah fitur error-handling (harus diterapkan di 2 tempat, seperti fix §9 tanggal 2026-07-19).

---

## 12. Dev Environment & Tooling

Semua tool berikut sudah terinstall & terautentikasi di mesin development (per sesi 2026-07-18/19):
- **Node.js** v24.18.0 + npm — di `C:\Program Files\nodejs\`
- **Git** 2.55 — login sebagai `Soldigital` (`Soldigital.id@gmail.com`), `safe.directory` sudah dikonfigurasi
- **GitHub CLI** (`gh`) 2.96.0 — login akun `Soldigital`, akses admin/push penuh ke repo `Soldigital/banana-carousel`
- **Vercel CLI** 56.3.1 — login `soldigital`, project `banana-carousel` di team `soldigitals-projects`
- **Supabase CLI** — diinstall sebagai **devDependency lokal** (bukan global — Supabase tidak resmi menyediakan installer global npm/winget di Windows), dijalankan via `npx supabase ...`. Terautentikasi, tapi **belum di-`link`** ke project (`hdqjkqpuczhzyjiifjkc` / "Banana Carousel")

**Catatan penting**: kalau kamu buka terminal/VSCode BARU setelah tanggal instalasi di atas, semua tool ini seharusnya langsung terdeteksi tanpa langkah tambahan (PATH sudah permanen). Kalau muncul "command not found" lagi, kemungkinan sesi terminal itu dibuka SEBELUM instalasi — cukup restart terminal.

### Scripts npm
```
npm run dev              # next dev (Turbopack)
npm run build             # next build
npm run start              # next start (production)
npm run lint                # eslint .
npm run typecheck        # tsc --noEmit
npm run compress:examples  # compress asset gallery (assets-raw/ → public/examples/)
```

---

## 13. Rekomendasi Area Pengembangan Selanjutnya

1. **Tuntaskan migrasi ke AI Gateway** — pastikan `NEXT_PUBLIC_USE_GATEWAY=on` di Vercel produksi, lalu pertimbangkan menghapus jalur legacy (`lib/gemini/generate-carousel.ts`) untuk menghilangkan duplikasi maintenance.
2. **Tambah Zod validation** di `/api/generate` dan `/api/checkout` untuk konsistensi dengan pola validasi di endpoint lain.
3. **Lengkapi Sentry client-side scrubbing** (`instrumentation-client.ts`) agar konsisten dengan server/edge.
4. **Pertimbangkan test suite minimal** untuk alur kritis (license token verify/sign, klasifikasi error AI gateway, entitlement grant idempotency) — saat ini nol test coverage jadi satu-satunya jaring pengaman adalah review manual + typecheck.
5. **Bersihkan 18 lint issue pre-existing** kalau ada waktu luang (low priority, tidak mempengaruhi fungsi).
6. **Evaluasi CSP** — kalau daftar script pihak ketiga sudah stabil, pertimbangkan CSP dengan whitelist domain daripada tidak sama sekali.
