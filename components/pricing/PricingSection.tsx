"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";
import { BuyButton } from "./BuyButton";
import { FoundingBanner } from "./FoundingBanner";
import { USE_PRICING_V2 } from "@/lib/config/flags";
import {
  FOUNDING_PRICE,
  LIFETIME_PRICE,
  ANNUAL_PRICE,
  ANNUAL_FOUNDING_PRICE,
  formatIDR,
} from "@/lib/config/payment";
import { STYLE_PRESETS } from "@/lib/prompts/style-presets";
import { cn } from "@/lib/utils";

// Every figure comes from lib/config/payment.ts, so the cards, BuyButton and
// the amount the server actually charges cannot disagree.
const PRESET_COUNT = STYLE_PRESETS.filter((p) => !p.hidden).length;

const BENEFITS = [
  "Akses generator selamanya (lifetime)",
  "Master prompt Gemini-ready 600-1500 kata",
  "Caption Instagram siap copy-paste",
  `${PRESET_COUNT} style preset premium + output EN/ID`,
  "Export .txt / .pdf",
  "Pakai API key Gemini gratis Anda sendiri (BYOK)",
];

const ANNUAL_BENEFITS = [
  "Semua fitur Pro selama 1 tahun",
  `${PRESET_COUNT} style preset premium + output EN/ID`,
  "Perpanjang manual — tanpa langganan otomatis",
];

export function PricingSection() {
  // The founding window decides which cards are purchasable. The optimistic
  // default matches BuyButton's first paint and is corrected from the server
  // on mount, so a sold-out state never advertises a price nobody can get.
  const [founding, setFounding] = React.useState(true);

  React.useEffect(() => {
    if (!USE_PRICING_V2) return;
    fetch("/api/founding")
      .then((r) => r.json())
      .then((d) => typeof d.founding === "boolean" && setFounding(d.founding))
      .catch(() => {});
  }, []);

  const lifetimePrice = founding ? FOUNDING_PRICE : LIFETIME_PRICE;

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
          Bandingkan sendiri: bayar tiap tahun, atau sekali untuk selamanya.
        </p>
      </div>

      <div
        className={cn(
          "mx-auto mt-10 grid gap-5 items-start",
          // Flag off = the single lifetime card, exactly as before.
          USE_PRICING_V2
            ? founding
              ? "max-w-5xl md:grid-cols-3"
              : "max-w-3xl md:grid-cols-2"
            : "max-w-md",
        )}
      >
        {/* Pro Annual at the launch price. Purchasable. */}
        {USE_PRICING_V2 && founding && (
          <div className="rounded-2xl border border-border bg-card p-6 flex flex-col">
            <p className="font-display text-lg font-bold">Pro Annual</p>
            {/* Deliberately NOT "100 pembeli pertama": an annual purchase never
                consumes a founding slot (setProfilePro skips assignTier for
                annual), so the honest framing is the founding window itself. */}
            <p className="text-xs text-muted-foreground mt-0.5">
              Harga launch — selama slot Founding tersedia
            </p>
            <div className="mt-4 flex items-end gap-2">
              <span className="text-base text-muted-foreground line-through">
                {formatIDR(ANNUAL_PRICE)}
              </span>
              <span className="font-display text-3xl font-bold leading-none">
                {formatIDR(ANNUAL_FOUNDING_PRICE)}
              </span>
              <span className="text-sm text-muted-foreground">/tahun</span>
            </div>
            <ul className="mt-5 space-y-2 flex-1">
              {ANNUAL_BENEFITS.map((b) => (
                <li key={b} className="flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 size-4 shrink-0 text-banana" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6">
              <BuyButton
                plan="annual"
                label="Langganan Pro Annual"
                variant="outline"
                className="w-full"
              />
            </div>
          </div>
        )}

        {/* Lifetime — the recommended plan. */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-3xl border border-banana/40 bg-gradient-to-br from-banana/10 to-transparent p-6 sm:p-8 relative flex flex-col"
        >
          {USE_PRICING_V2 && founding && (
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center rounded-full bg-banana px-3 py-0.5 text-[11px] font-bold text-black">
              PALING HEMAT
            </span>
          )}
          <p className="font-display text-lg font-bold text-center">Lifetime</p>
          <p className="text-xs text-muted-foreground mt-0.5 text-center">
            {founding ? "Khusus 100 orang pertama" : "Akses selamanya"}
          </p>

          <div className="mt-4 flex items-end justify-center gap-3">
            {founding && (
              <span className="text-xl text-muted-foreground line-through">
                {formatIDR(LIFETIME_PRICE)}
              </span>
            )}
            <span className="font-display text-5xl font-bold leading-none">
              {formatIDR(lifetimePrice)}
            </span>
          </div>
          <p className="mt-2 text-center text-sm text-banana font-semibold">
            {founding
              ? `Hemat ${formatIDR(LIFETIME_PRICE - FOUNDING_PRICE)} — sekali bayar`
              : "Sekali bayar, tanpa perpanjangan"}
          </p>

          {USE_PRICING_V2 && <FoundingBanner />}

          <ul className="mt-6 space-y-2.5 flex-1">
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

        {/* Pro Annual at the normal price. Reference only while founding is
            open, because the server would charge the launch price today — a buy
            button here would take less money than the card states. Once the
            slots run out this becomes the real purchasable card. */}
        {USE_PRICING_V2 && (
          <div
            className={cn(
              "rounded-2xl border border-border p-6 flex flex-col",
              founding ? "bg-card/40 opacity-70" : "bg-card",
            )}
          >
            <p className="font-display text-lg font-bold">Pro Annual</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {founding
                ? "Harga normal setelah slot Founding habis"
                : "Perpanjang tiap tahun"}
            </p>
            <div className="mt-4 flex items-end gap-2">
              <span className="font-display text-3xl font-bold leading-none">
                {formatIDR(ANNUAL_PRICE)}
              </span>
              <span className="text-sm text-muted-foreground">/tahun</span>
            </div>
            <ul className="mt-5 space-y-2 flex-1">
              {ANNUAL_BENEFITS.map((b) => (
                <li key={b} className="flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <span className="text-muted-foreground">{b}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6">
              {founding ? (
                <p className="text-center text-xs text-muted-foreground">
                  Berlaku otomatis begitu 100 slot Founding habis. Ambil harga
                  launch selagi masih tersedia.
                </p>
              ) : (
                <BuyButton
                  plan="annual"
                  label="Langganan Pro Annual"
                  variant="outline"
                  className="w-full"
                />
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
