"use client";

import { motion } from "framer-motion";
import { ArrowRight, FileText, Wand2 } from "lucide-react";

export function FeatureExample() {
  return (
    <section className="container py-16 sm:py-20">
      <div className="text-center max-w-2xl mx-auto space-y-2 mb-10">
        <p className="text-xs font-bold tracking-[0.2em] text-banana">
          CONTOH NYATA
        </p>
        <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">
          Lihat sendiri kualitas outputnya.
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-4 lg:gap-6 items-stretch max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="rounded-2xl border border-border bg-card p-5 sm:p-6 space-y-3"
        >
          <div className="inline-flex items-center gap-2 text-xs font-bold tracking-wider text-muted-foreground">
            <FileText className="size-3.5" />
            INPUT
          </div>
          <ul className="space-y-2.5 text-sm">
            <li>
              <span className="text-muted-foreground">Judul:</span>{" "}
              <span className="font-medium">5 Mindset Orang Kaya</span>
            </li>
            <li>
              <span className="text-muted-foreground">Audience:</span>{" "}
              <span className="font-medium">
                Anak muda 18-30 tahun, urban, ambisius
              </span>
            </li>
            <li>
              <span className="text-muted-foreground">Goal:</span>{" "}
              <span className="font-medium">Engagement & shareable</span>
            </li>
            <li>
              <span className="text-muted-foreground">Style:</span>{" "}
              <span className="font-medium">Cinematic Luxury (Black + Gold)</span>
            </li>
            <li>
              <span className="text-muted-foreground">Slide:</span>{" "}
              <span className="font-medium">7</span>
            </li>
          </ul>
        </motion.div>

        <div className="flex items-center justify-center">
          <div className="size-12 rounded-full bg-banana/15 flex items-center justify-center">
            <ArrowRight className="size-5 text-banana lg:rotate-0 rotate-90" />
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, x: 16 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="rounded-2xl border border-banana/40 bg-gradient-to-br from-banana/10 to-transparent p-5 sm:p-6 space-y-3"
        >
          <div className="inline-flex items-center gap-2 text-xs font-bold tracking-wider text-banana">
            <Wand2 className="size-3.5" />
            OUTPUT (PREVIEW)
          </div>
          <div className="space-y-3 text-sm">
            <div className="rounded-lg bg-secondary/50 p-3 space-y-1">
              <p className="text-[10px] font-bold tracking-wider text-banana">
                SLIDE 1 — HOOK
              </p>
              <p className="font-display font-bold leading-tight">
                &quot;Orang miskin fokus terlihat kaya. Orang kaya fokus
                membangun aset.&quot;
              </p>
            </div>
            <div className="rounded-lg bg-secondary/50 p-3 space-y-1">
              <p className="text-[10px] font-bold tracking-wider text-muted-foreground">
                + 5 SLIDE VALUE
              </p>
              <p className="text-xs text-muted-foreground">
                Setiap slide dengan headline, body, visual prompt cinematic 4:5,
                typography hint, dan layout instruction yang konsisten.
              </p>
            </div>
            <div className="rounded-lg bg-secondary/50 p-3 space-y-1">
              <p className="text-[10px] font-bold tracking-wider text-banana">
                SLIDE 7 — CTA
              </p>
              <p className="font-display font-bold leading-tight">
                &quot;Save carousel ini untuk dirimu satu tahun lagi.&quot;
              </p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground italic pt-1">
            + 1 master prompt 800+ kata siap paste ke Gemini.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
