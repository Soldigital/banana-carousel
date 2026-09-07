"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, Zap, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 gradient-dark-radial pointer-events-none" />
      <div className="absolute inset-0 bg-grid opacity-40 pointer-events-none [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />

      <div className="container relative pt-12 sm:pt-20 pb-12 sm:pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">
        <div className="text-center lg:text-left space-y-5 sm:space-y-7">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 rounded-full border border-banana/40 bg-banana/5 px-3 py-1 text-xs font-semibold"
          >
            <Sparkles className="size-3.5 text-banana" />
            <span>Powered by Gemini AI · Premium · BYOK</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="font-display font-black text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-[1.05] tracking-tight text-balance"
          >
            Dari ide jadi <span className="gradient-banana-text">prompt carousel</span> Instagram premium dalam hitungan detik.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0 leading-relaxed text-balance"
          >
            Banana Carousel mengubah ide sederhana menjadi prompt ultra-detail siap copy-paste ke Gemini AI — lengkap dengan hook, storyline, visual direction, typography, dan CTA yang konsisten antar slide.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start items-center pt-2"
          >
            <Button asChild size="xl" className="w-full sm:w-auto">
              <Link href="/generate">
                <Zap className="size-5" />
                Generate Sekarang
                <ArrowRight className="size-5" />
              </Link>
            </Button>
            <p className="text-xs text-muted-foreground">
              Sekali bayar · Pakai API key sendiri
            </p>
          </motion.div>

          <TrustIndicators />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="lg:pl-4"
        >
          <CarouselMockup />
        </motion.div>
        </div>
      </div>
    </section>
  );
}

function TrustIndicators() {
  // Every item here must be literally true. "Tanpa langganan" is accurate
  // (one-time payment + your own provider key); "tidak perlu daftar" is NOT,
  // because /generate requires login and an active entitlement.
  const items = [
    "BYOK — tanpa langganan token",
    "Hasil dalam ~30 detik",
    "Key tersimpan terenkripsi",
  ];
  return (
    <motion.ul
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="flex flex-wrap gap-x-5 gap-y-2 justify-center lg:justify-start text-xs text-muted-foreground pt-1"
    >
      {items.map((t) => (
        <li key={t} className="flex items-center gap-1.5">
          <Check className="size-3.5 text-banana shrink-0" />
          {t}
        </li>
      ))}
    </motion.ul>
  );
}

function CarouselMockup() {
  const slides = [
    {
      role: "HOOK",
      headline: "Orang miskin fokus terlihat kaya.",
      sub: "Orang kaya fokus membangun aset.",
      bg: "from-banana via-banana-300 to-amber-500",
      text: "text-black",
    },
    {
      role: "VALUE",
      headline: "Aset menghasilkan uang saat kamu tidur.",
      sub: "Liabilitas menguras uang saat kamu bangun.",
      bg: "from-zinc-900 to-zinc-800",
      text: "text-banana",
    },
    {
      role: "INSIGHT",
      headline: "Investasi #1: dirimu sendiri.",
      sub: "Skill compounding beats compound interest.",
      bg: "from-zinc-950 via-zinc-900 to-zinc-800",
      text: "text-white",
    },
    {
      role: "CTA",
      headline: "Save & share carousel ini.",
      sub: "Untuk dirimu satu tahun lagi.",
      bg: "from-amber-500 via-banana to-yellow-300",
      text: "text-black",
    },
  ];

  return (
    <div className="relative">
      <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-4 snap-x snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {slides.map((s, i) => (
          <div
            key={i}
            className={`shrink-0 snap-center w-[70%] sm:w-[46%] aspect-[4/5] rounded-2xl overflow-hidden bg-gradient-to-br ${s.bg} ${s.text} shadow-2xl border border-white/10 relative`}
          >
            <div className="absolute inset-0 bg-grid opacity-10" />
            <div className="relative h-full flex flex-col justify-between p-4 sm:p-5">
              <span className="text-[9px] sm:text-[10px] font-bold tracking-[0.2em] opacity-70">
                / {String(i + 1).padStart(2, "0")} · {s.role}
              </span>
              <div className="space-y-1.5">
                <p className="font-display font-black text-xl sm:text-2xl md:text-2xl leading-[1.1] text-balance">
                  {s.headline}
                </p>
                <p className="text-xs sm:text-sm opacity-80 leading-snug">
                  {s.sub}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="text-center text-xs text-muted-foreground mt-2">
        ← Geser untuk lihat preview carousel →
      </div>
    </div>
  );
}
