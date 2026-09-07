import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ADMIN_WHATSAPP } from "@/lib/config/payment";

// Server component — static marketing copy, no interactivity.
//
// Claim accuracy matters here. Two things this section deliberately does NOT
// say, because they are no longer true:
//   1. "privasi 100% browser-side / tidak ada data ke server" — with the AI
//      Gateway enabled, BYOK keys are stored server-side (encrypted) and
//      decrypted on the server to call providers.
//   2. "tersedia di Android / iOS / Desktop App" — there are no native apps.
//      It is a web app that is installable as a PWA (app/manifest.ts).
const POINTS = [
  {
    title: "Kunci Anda tetap milik Anda",
    body: "BYOK — pakai API key Gemini, OpenRouter, atau Groq milik sendiri, jadi tidak ada langganan token bulanan. Key disimpan terenkripsi (AES-256-GCM) dan hanya dipakai untuk menjalankan generate Anda. Bisa dihapus kapan saja dari dashboard.",
  },
  {
    title: "Konsisten dari hook sampai CTA",
    body: "Output-nya bukan sekadar teks panjang. Setiap slide punya peran, arahan visual, dan tipografi yang saling menyambung, sehingga satu carousel terbaca sebagai satu cerita utuh.",
  },
  {
    title: "Jalan di mana saja",
    body: "Aplikasi web yang bisa dipasang ke home screen sebagai PWA — di desktop maupun ponsel, tanpa perlu install dari store.",
  },
] as const;

export function AboutSection() {
  const waHref = ADMIN_WHATSAPP ? `https://wa.me/${ADMIN_WHATSAPP}` : null;

  return (
    <section id="about" className="container py-16 sm:py-20 scroll-mt-20">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-start max-w-5xl mx-auto">
        <div className="space-y-4">
          <p className="text-xs font-bold tracking-[0.2em] text-banana">TENTANG KAMI</p>
          <h2 className="font-display font-black text-3xl sm:text-4xl tracking-tight text-balance">
            Lahir dari rasa lelah menyusun prompt satu per satu.
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Banana Carousel dimulai pada 2025 dengan satu tujuan sederhana:
            menghentikan berjam-jam waktu yang habis untuk merangkai prompt
            carousel secara manual. Kami percaya kreator tidak perlu jadi prompt
            engineer dulu untuk bisa menghasilkan konten yang rapi.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Button asChild size="lg">
              <Link href="#pricing">Mulai sekarang</Link>
            </Button>
            {waHref && (
              <Button asChild variant="outline" size="lg">
                <a href={waHref} target="_blank" rel="noopener noreferrer">
                  Chat WhatsApp
                </a>
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {POINTS.map((p) => (
            <div key={p.title} className="rounded-2xl border border-border bg-card p-5 space-y-2">
              <h3 className="font-display font-bold text-base leading-tight">{p.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{p.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
