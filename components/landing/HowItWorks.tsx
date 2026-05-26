"use client";

import { motion } from "framer-motion";
import { Lightbulb, Settings2, Sparkles, Copy } from "lucide-react";

const STEPS = [
  {
    icon: Lightbulb,
    title: "Tulis ide",
    desc: "Topik, audience, tujuan, dan style — semua field punya placeholder yang membantu.",
  },
  {
    icon: Settings2,
    title: "Pilih style",
    desc: "8 preset visual kurasi: Cinematic, Minimal, Bold, Soft, Cyberpunk, Editorial, 3D, Hand-drawn.",
  },
  {
    icon: Sparkles,
    title: "Generate",
    desc: "AI menyusun storyline, hook, CTA, dan visual prompt per slide — konsisten antar slide.",
  },
  {
    icon: Copy,
    title: "Copy & paste",
    desc: "Salin master prompt ke Gemini AI Studio. Carousel premium langsung jadi.",
  },
];

export function HowItWorks() {
  return (
    <section className="container py-16 sm:py-20">
      <div className="text-center max-w-2xl mx-auto space-y-2 mb-10">
        <p className="text-xs font-bold tracking-[0.2em] text-banana">
          BAGAIMANA CARA KERJANYA
        </p>
        <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">
          4 langkah dari ide ke carousel viral.
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STEPS.map((step, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08, duration: 0.4 }}
            className="rounded-2xl border border-border bg-card p-5 space-y-3 hover:border-banana/40 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="size-10 rounded-xl bg-banana/15 flex items-center justify-center">
                <step.icon className="size-5 text-banana" />
              </div>
              <span className="font-display font-black text-3xl text-banana/30 tabular-nums">
                0{i + 1}
              </span>
            </div>
            <h3 className="font-display font-bold text-lg">{step.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {step.desc}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
