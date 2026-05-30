"use client";

import { motion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";
import { BuyButton } from "./BuyButton";

const BENEFITS = [
  "Akses generator selamanya (lifetime)",
  "Master prompt Gemini-ready 600-1500 kata",
  "Caption Instagram siap copy-paste",
  "8 style preset premium + EN/ID",
  "Export .txt / .pdf",
  "Pakai API key Gemini gratis Anda sendiri (BYOK)",
];

export function PricingSection() {
  return (
    <section id="pricing" className="container py-16 sm:py-24 scroll-mt-20">
      <div className="mx-auto max-w-xl text-center space-y-3">
        <div className="inline-flex items-center gap-2 text-xs font-semibold text-banana">
          <Sparkles className="size-3.5" />
          HARGA LAUNCH
        </div>
        <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">
          Sekali bayar, pakai selamanya.
        </h2>
        <p className="text-muted-foreground">
          Tanpa langganan. Tanpa biaya bulanan. Lisensi lifetime.
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mx-auto mt-10 max-w-md rounded-3xl border border-banana/40 bg-gradient-to-br from-banana/10 to-transparent p-6 sm:p-8"
      >
        <div className="flex items-end justify-center gap-3">
          <span className="text-xl text-muted-foreground line-through">
            Rp199.000
          </span>
          <span className="font-display text-5xl font-bold leading-none">
            Rp99.000
          </span>
        </div>
        <p className="mt-2 text-center text-sm text-banana font-semibold">
          Hemat Rp100.000 — lifetime, sekali bayar
        </p>

        <ul className="mt-6 space-y-2.5">
          {BENEFITS.map((b) => (
            <li key={b} className="flex items-start gap-2.5 text-sm">
              <Check className="mt-0.5 size-4 shrink-0 text-banana" />
              <span>{b}</span>
            </li>
          ))}
        </ul>

        <div className="mt-7">
          <BuyButton size="xl" className="w-full" />
        </div>
        <p className="mt-3 text-center text-xs text-muted-foreground">
          Pembayaran aman via iPaymu. License key dikirim ke email Anda.
        </p>
      </motion.div>
    </section>
  );
}
