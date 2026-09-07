import { PenLine, Palette, MessageSquareQuote } from "lucide-react";

// Server component — static marketing copy, no interactivity.

const SERVICES = [
  {
    icon: PenLine,
    title: "Carousel Master Prompt",
    desc: "Inti produknya. Topik sederhana masuk, master prompt siap eksekusi keluar — struktur slide, hook, dan storyline tersusun otomatis.",
  },
  {
    icon: Palette,
    title: "Visual Style Studio",
    desc: "Kurasi preset visual siap pakai, dari aesthetic minimalis sampai editorial magazine. Semuanya dirancang agar konsisten antar slide.",
  },
  {
    icon: MessageSquareQuote,
    title: "Caption Instagram",
    desc: "Caption yang nyambung dengan topik carousel, ikut bahasa yang Anda pilih, dan siap disalin langsung ke postingan.",
  },
] as const;

export function ServicesSection() {
  return (
    <section id="services" className="container py-16 sm:py-20 scroll-mt-20">
      <div className="max-w-2xl mx-auto text-center space-y-3">
        <p className="text-xs font-bold tracking-[0.2em] text-banana">LAYANAN UTAMA</p>
        <h2 className="font-display font-black text-3xl sm:text-4xl tracking-tight text-balance">
          Satu tempat untuk seluruh kebutuhan carousel.
        </h2>
      </div>

      <div className="mt-10 sm:mt-12 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 max-w-5xl mx-auto">
        {SERVICES.map((s) => (
          <div
            key={s.title}
            className="rounded-2xl border border-border bg-card p-6 text-center space-y-3 hover:border-banana/40 transition-colors"
          >
            <div className="mx-auto inline-flex size-12 items-center justify-center rounded-xl bg-banana/15">
              <s.icon className="size-5 text-banana" />
            </div>
            <h3 className="font-display font-bold text-lg leading-tight">{s.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
