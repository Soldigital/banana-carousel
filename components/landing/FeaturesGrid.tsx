import {
  BookOpenText,
  Download,
  Fingerprint,
  Languages,
  Palette,
  Shuffle,
} from "lucide-react";
import { STYLE_PRESETS, STYLE_CATEGORIES } from "@/lib/prompts/style-presets";

// Server component — static marketing copy, no interactivity.

// Derived from the real preset table rather than written as a literal, so the
// number can never drift from what the generator actually offers. (The landing
// page previously advertised "8 style preset" while 25 were shipping.)
const PRESET_COUNT = STYLE_PRESETS.filter((p) => !p.hidden).length;
const CATEGORY_COUNT = STYLE_CATEGORIES.length;

const FEATURES = [
  {
    icon: BookOpenText,
    title: "Master prompt ultra-detail",
    desc: "Satu topik jadi prompt 600–1500 kata siap tempel ke Gemini — lengkap dengan hook, storyline per slide, visual direction, arahan tipografi, dan CTA yang nyambung antar slide.",
  },
  {
    icon: Palette,
    title: `${PRESET_COUNT} preset visual terkurasi`,
    desc: `Dari Cinematic Luxury sampai Swiss Style, tersebar di ${CATEGORY_COUNT} kategori. Tiap preset mengunci mood, palet, dan tipografi supaya seluruh slide terlihat satu keluarga.`,
  },
  {
    icon: Fingerprint,
    title: "Brand Profile",
    desc: "Simpan logo, warna, dan gaya brand Anda sekali. Setiap carousel berikutnya otomatis mengikuti identitas itu tanpa perlu diketik ulang.",
  },
  {
    icon: Shuffle,
    title: "Multi-provider + rotasi key",
    desc: "Gemini, OpenRouter, dan Groq dalam satu gerbang. Kalau satu key kena limit atau lambat, sistem otomatis pindah ke key berikutnya — bukan gagal di depan Anda.",
  },
  {
    icon: Languages,
    title: "Output ID / EN",
    desc: "Hasilkan carousel berbahasa Indonesia atau Inggris dengan kualitas natural, plus caption Instagram yang sudah menyesuaikan bahasanya.",
  },
  {
    icon: Download,
    title: "Riwayat & ekspor",
    desc: "Semua hasil tersimpan lengkap dengan pencarian, filter, dan recycle bin. Ekspor ke .txt atau .pdf saat perlu dibagikan ke tim atau klien.",
  },
] as const;

export function FeaturesGrid() {
  return (
    <section id="features" className="container py-16 sm:py-20 scroll-mt-20">
      <div className="max-w-2xl mx-auto text-center space-y-3">
        <p className="text-xs font-bold tracking-[0.2em] text-banana">FITUR UTAMA</p>
        <h2 className="font-display font-black text-3xl sm:text-4xl tracking-tight text-balance">
          Semua yang dibutuhkan untuk carousel premium.
        </h2>
        <p className="text-muted-foreground text-balance">
          Dirancang untuk content creator, digital marketer, dan solopreneur yang
          perlu konsisten memproduksi carousel berkualitas — bukan sekali dua kali.
        </p>
      </div>

      <div className="mt-10 sm:mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className="rounded-2xl border border-border bg-card p-5 space-y-3 hover:border-banana/40 transition-colors"
          >
            <div className="inline-flex size-11 items-center justify-center rounded-xl bg-banana/15">
              <f.icon className="size-5 text-banana" />
            </div>
            <h3 className="font-display font-bold text-lg leading-tight">{f.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
