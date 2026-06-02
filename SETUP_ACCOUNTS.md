# Setup — Akun, Dashboard, Transfer Manual, Telegram

Panduan mengaktifkan fitur baru (Supabase accounts + manual transfer + admin + riwayat carousel). Lakukan **sebelum** men-deploy branch `feat/accounts-manual-transfer-dashboard` ke production.

## 1. Buat project Supabase
1. Buka https://supabase.com → New Project (region: Singapore paling dekat).
2. Catat dari **Project Settings → API**:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key (RAHASIA) → `SUPABASE_SERVICE_ROLE_KEY`

## 2. Jalankan migrasi database
1. Supabase Dashboard → **SQL Editor** → New query.
2. Tempel seluruh isi [supabase/migrations/0001_init.sql](supabase/migrations/0001_init.sql) → Run.
3. Ini membuat tabel `profiles`, `orders`, `carousels`, RLS, trigger profil otomatis, dan bucket privat `transfer-proofs`.

## 3. Konfigurasi Auth Supabase
1. **Authentication → Providers → Email**: pastikan aktif. (Untuk testing cepat, matikan "Confirm email" agar daftar langsung bisa login.)
2. **Authentication → URL Configuration**:
   - Site URL: `https://www.bananacarousel.click`
   - Redirect URLs: tambahkan `https://www.bananacarousel.click/auth/callback` (dan `http://localhost:3000/auth/callback` untuk dev).

## 4. Dapatkan Telegram chat_id admin
Bot: `@NusaNotif_bot` (token dari @BotFather → `TELEGRAM_BOT_TOKEN`).
1. Kirim pesan apa saja ke bot (atau tambahkan bot ke grup admin & kirim 1 pesan).
2. Buka di browser: `https://api.telegram.org/bot<TOKEN>/getUpdates`
3. Cari `"chat":{"id": ...}` → itulah `TELEGRAM_ADMIN_CHAT_ID` (grup biasanya diawali `-100...`).

## 5. Set environment variables di Vercel
Project `banana-carousel` → Settings → Environment Variables (Production + Preview). Lihat daftar lengkap di [.env.example](.env.example):

| Var | Contoh / sumber |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | dari langkah 1 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | dari langkah 1 |
| `SUPABASE_SERVICE_ROLE_KEY` | dari langkah 1 (rahasia) |
| `OWNER_EMAIL` | email Anda (otomatis jadi admin) |
| `TELEGRAM_BOT_TOKEN` | dari @BotFather (rahasia) |
| `TELEGRAM_ADMIN_CHAT_ID` | dari langkah 4 |
| `NEXT_PUBLIC_ADMIN_WHATSAPP` | nomor WA admin, format `62812xxxx` (tanpa + / spasi) |
| `NEXT_PUBLIC_BANK_NAME` | `Bank Jago Syariah` |
| `NEXT_PUBLIC_BANK_ACCOUNT_NO` | `501697030764` |
| `NEXT_PUBLIC_BANK_ACCOUNT_NAME` | `Husna Muthmainnah` |

Pastikan `IPAYMU_MODE=production` (tanpa spasi) tetap ada.

## 6. Deploy
- Merge branch ke `main` (Vercel auto-deploy), atau `vercel --prod`.
- Daftar dengan `OWNER_EMAIL` → buka `/admin` (harus muncul). Akun lain → `/admin` redirect ke beranda.

## Cara kerja singkat
- **iPaymu (otomatis)**: bayar → webhook `/api/ipaymu/notify` → entitlement + email + notif Telegram.
- **Transfer manual**: user login → `/transfer` → upload bukti → order `pending` + notif Telegram (foto) → user diarahkan ke WA admin → admin `/admin` → Approve → akses aktif + email + kode akses di dashboard.
- **Pelanggan lama**: kode akses lama tetap valid (tempel di gate). Bisa diklaim ke akun via Dashboard → "Klaim lisensi".
- **Riwayat carousel**: tiap generate (saat login) otomatis tersimpan & muncul di Dashboard.

## Verifikasi cepat
1. Daftar akun baru (bukan OWNER_EMAIL) → belum Pro.
2. `/transfer` → upload bukti → cek Telegram admin menerima foto, order `pending` di tabel `orders`.
3. Login OWNER_EMAIL → `/admin` → Approve order → akun pembeli jadi Pro, email terkirim, kode akses muncul di dashboard pembeli, `/generate` terbuka.
4. Generate carousel → muncul di Dashboard → "Buka" mengembalikan ke generator.

## Catatan
- Next 16 menampilkan warning "middleware deprecated → proxy"; aman, masih berfungsi. Bisa diganti ke `proxy.ts` di iterasi berikutnya.
- Bucket `transfer-proofs` **privat** — bukti hanya bisa dilihat admin via signed URL.
