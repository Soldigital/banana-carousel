"use client";

import { motion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";
import { BuyButton } from "./BuyButton";
import { FoundingBanner } from "./FoundingBanner";
import { USE_PRICING_V2 } from "@/lib/config/flags";
import { FOUNDING_PRICE, formatIDR } from "@/lib/config/payment";
import { STYLE_PRESETS } from "@/lib/prompts/style-presets";

// Prices come from lib/config/payment.ts rather than being retyped here, so the
// card and BuyButton (which already uses formatIDR) can never disagree.
//
// NOTE for the owner: three sources currently state different "before" prices —
// this section struck through Rp199.000, payment.ts sets LIFETIME_PRICE=299000,
// and FoundingBanner.tsx hardcodes 299000. The displayed figure is intentionally
// left at 199.000 so a restyle does not silently change advertised pricing.
// Decide which is correct and collapse all three onto LIFETIME_PRICE.
const STRIKE_PRICE = 199_000;
const SAVING = STRIKE_PRICE - FOUNDING_PRICE;

const PRESET_COUNT = STYLE_PRESETS.filter((p) => !p.hidden).length;

const BENEFITS = [
  "Akses generator selamanya (lifetime)",
  "Master prompt Gemini-ready 600-1500 kata",
  "Caption Instagram siap copy-paste",
  `${PRESET_COUNT} style preset premium + output EN/ID`,
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
            {formatIDR(STRIKE_PRICE)}
          </span>
          <span className="font-display text-5xl font-bold leading-none">
            {formatIDR(FOUNDING_PRICE)}
          </span>
        </div>
        <p className="mt-2 text-center text-sm text-banana font-semibold">
          Hemat {formatIDR(SAVING)} — lifetime, sekali bayar
        </p>

        {USE_PRICING_V2 && <FoundingBanner />}

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

      {/* Pro Annual alternative (Phase C) */}
      {USE_PRICING_V2 && (
        <div className="mx-auto mt-5 max-w-md rounded-2xl border border-border bg-card/40 p-5">
          <div className="flex items-center justify-between gap-2">
            <div>
              <span className="inline-flex items-center rounded-full bg-banana/15 px-2.5 py-0.5 text-[11px] font-bold text-banana">
                🔥 PALING POPULER
              </span>
              <p className="mt-1.5 font-display text-lg font-bold">Pro Annual</p>
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">Rp99.000</span>/tahun
                — semua fitur Pro, perpanjang manual tiap tahun.
              </p>
            </div>
          </div>
          <div className="mt-4">
            <BuyButton
              plan="annual"
              label="Langganan Pro Annual"
              variant="outline"
              className="w-full"
            />
          </div>
        </div>
      )}
    </section>
  );
}
