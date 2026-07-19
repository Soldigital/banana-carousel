// Tutorial content for the user dashboard. Edit freely.

// YouTube video ID (the part after watch?v= or youtu.be/). Leave empty to show a
// "coming soon" placeholder. Can be overridden via env without code changes.
export const TUTORIAL_YOUTUBE_ID =
  process.env.NEXT_PUBLIC_TUTORIAL_YOUTUBE_ID || "";

export interface TutorialStep {
  title: string;
  body: string;
}

// Draft — interactive step-by-step guide based on the app flow.
export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    title: "1. Siapkan API Key Gemini (gratis)",
    body: "Buka Google AI Studio (aistudio.google.com), buat API key gratis, lalu klik tombol \"Set API Key\" di pojok kanan atas dan tempel key Anda. Key disimpan aman di browser Anda — tidak dikirim ke server kami.",
  },
  {
    title: "2. Isi ide kontenmu",
    body: "Masuk ke halaman Generator, lalu isi: Judul konten, Topik (paling penting), Target Audience, dan Tujuan. Makin spesifik, makin tajam hasilnya.",
  },
  {
    title: "3. Pilih gaya visual",
    body: "Pilih salah satu dari 8 style preset (Cinematic, Minimal, Bold, Soft, Cyberpunk, Editorial, 3D, Hand-drawn), atur jumlah slide (3–10), bahasa output (ID/EN), dan gaya CTA.",
  },
  {
    title: "4. Generate carousel",
    body: "Klik \"Generate Carousel Prompt\" dan tunggu beberapa detik. AI menyusun storyline, hook, value per slide, CTA, dan instruksi visual yang konsisten antar slide.",
  },
  {
    title: "5. Render jadi gambar",
    body: "Salin \"Master Prompt\" (Gemini-ready) dari hasil, lalu paste ke Gemini / image generator pilihanmu untuk merender tiap slide carousel premium.",
  },
  {
    title: "6. Ambil caption Instagram",
    body: "Salin caption Instagram siap pakai dari tab hasil — tinggal tempel saat upload carousel ke feed.",
  },
  {
    title: "7. Riwayat tersimpan otomatis",
    body: "Setiap carousel yang kamu generate tersimpan otomatis di Dashboard ini selama 30 hari. Klik \"Buka\" pada kartu riwayat untuk memuatnya kembali ke generator.",
  },
];
