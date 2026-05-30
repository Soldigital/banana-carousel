"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CtaSection() {
  return (
    <section className="container py-16 sm:py-20">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-3xl border border-banana/40 bg-gradient-to-br from-banana/10 via-banana/5 to-transparent p-8 sm:p-12 text-center"
      >
        <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />

        <div className="relative max-w-2xl mx-auto space-y-5">
          <div className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.2em] text-banana">
            <Sparkles className="size-3.5" />
            PREMIUM · BYOK · NO SIGN-UP
          </div>
          <h2 className="font-display font-black text-3xl sm:text-4xl md:text-5xl leading-tight tracking-tight text-balance">
            Carousel viral berikutnya tinggal{" "}
            <span className="gradient-banana-text">satu generate lagi.</span>
          </h2>
          <p className="text-base text-muted-foreground max-w-xl mx-auto">
            Cukup tempelkan API key Gemini gratis Anda — semua data tetap di
            browser Anda. Tidak ada server kami yang menyimpan apapun.
          </p>
          <Button asChild size="xl" className="mt-2">
            <Link href="/generate">
              <Sparkles className="size-5" />
              Mulai Generate Sekarang
            </Link>
          </Button>
        </div>
      </motion.div>
    </section>
  );
}
