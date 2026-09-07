"use client";

import * as React from "react";
import { Loader2, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { track } from "@/lib/analytics/track";
import { USE_PRICING_V2 } from "@/lib/config/flags";
import {
  FOUNDING_PRICE,
  ANNUAL_FOUNDING_PRICE,
  ANNUAL_DAYS,
  formatIDR,
} from "@/lib/config/payment";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

interface Props extends Omit<ButtonProps, "onClick"> {
  label?: string;
  plan?: "lifetime" | "annual";
}

// Self-contained: a button that opens a small dialog to collect the buyer's
// email, then creates an iPaymu payment session and redirects to the payment
// page. Used both on the landing pricing section and the locked generator.
// When pricing v2 is on, it shows the live Founding/Lifetime price.
export function BuyButton({
  label = "Beli Akses Lifetime",
  plan = "lifetime",
  ...rest
}: Props) {
  const [open, setOpen] = React.useState(false);
  const [email, setEmail] = React.useState("");
  const [name, setName] = React.useState("");
  const [whatsapp, setWhatsapp] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  // Optimistic first paint at the founding price for both plans; the effect
  // below corrects it from the server once /api/founding responds.
  const [price, setPrice] = React.useState(
    plan === "annual" ? ANNUAL_FOUNDING_PRICE : FOUNDING_PRICE,
  );
  const [code, setCode] = React.useState("");
  const [checking, setChecking] = React.useState(false);
  const [discount, setDiscount] = React.useState<{ price: number; label: string } | null>(
    null,
  );

  React.useEffect(() => {
    // Annual is founding-aware too now, so it no longer short-circuits here.
    // This only affects the DISPLAYED figure — the charged amount is always
    // recomputed server-side in /api/checkout and never sent from here.
    if (!USE_PRICING_V2) return;
    fetch("/api/founding")
      .then((r) => r.json())
      .then((d) => {
        const next = plan === "annual" ? d.annualPrice : d.price;
        if (typeof next === "number") setPrice(next);
      })
      .catch(() => {});
  }, [plan]);

  const isAnnual = plan === "annual";
  const effectivePrice = discount?.price ?? price;
  const priceLabel = formatIDR(effectivePrice) + (plan === "annual" ? "/tahun" : "");

  async function applyCode() {
    const clean = email.trim().toLowerCase();
    if (!EMAIL_RE.test(clean)) return toast.error("Masukkan email dulu.");
    if (!code.trim()) return;
    setChecking(true);
    try {
      const res = await fetch("/api/promo/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim(), email: clean, plan }),
      });
      const d = await res.json();
      if (d.ok && typeof d.discountedPrice === "number") {
        setDiscount({ price: d.discountedPrice, label: d.label || code.trim() });
        toast.success("Kode promo dipakai!");
      } else {
        setDiscount(null);
        toast.error(d.reason || "Kode tidak valid.");
      }
    } catch {
      toast.error("Gagal cek kode.");
    } finally {
      setChecking(false);
    }
  }

  async function handleCheckout() {
    const clean = email.trim().toLowerCase();
    if (!EMAIL_RE.test(clean)) {
      toast.error("Masukkan email yang valid — lisensi & resi dikirim ke sini.");
      return;
    }
    setBusy(true);
    track("begin_checkout", { method: "ipaymu" });
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: clean,
          name: name.trim(),
          whatsapp: whatsapp.trim(),
          plan,
          code: discount ? code.trim().toUpperCase() : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error || "Gagal memulai pembayaran.");
      }
      // Redirect to iPaymu hosted payment page.
      window.location.href = data.url;
    } catch (err) {
      console.error(err);
      toast.error(
        err instanceof Error ? err.message : "Gagal memulai pembayaran.",
      );
      setBusy(false);
    }
  }

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)} {...rest}>
        <ShoppingCart className="size-4" />
        {label}
      </Button>

      <Dialog open={open} onOpenChange={(o) => !busy && setOpen(o)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {isAnnual ? "Langganan Pro Annual" : "Beli Akses Lifetime"}
            </DialogTitle>
            <DialogDescription>
              {isAnnual ? (
                <>
                  Bayar{" "}
                  <span className="font-semibold text-foreground">{priceLabel}</span>{" "}
                  untuk akses {ANNUAL_DAYS} hari. Perpanjangan manual, tanpa
                  langganan otomatis. License key dikirim ke email Anda &
                  langsung aktif setelah bayar.
                </>
              ) : (
                <>
                  Bayar sekali{" "}
                  <span className="font-semibold text-foreground">{priceLabel}</span>
                  , akses selamanya. License key dikirim ke email Anda & langsung
                  aktif setelah bayar.
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="buyer-email">Email *</Label>
              <Input
                id="buyer-email"
                type="email"
                inputMode="email"
                placeholder="kamu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="buyer-name">Nama (opsional)</Label>
              <Input
                id="buyer-name"
                placeholder="Nama kamu"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="buyer-wa">No. WhatsApp (opsional)</Label>
              <Input
                id="buyer-wa"
                type="tel"
                inputMode="tel"
                placeholder="0812xxxxxxxx"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
              />
            </div>
            {USE_PRICING_V2 && (
              <div className="space-y-1.5">
                <Label htmlFor="buyer-promo">Kode Promo (opsional)</Label>
                <div className="flex gap-2">
                  <Input
                    id="buyer-promo"
                    placeholder="HEMAT20"
                    value={code}
                    onChange={(e) => {
                      setCode(e.target.value.toUpperCase());
                      setDiscount(null);
                    }}
                    className="font-mono"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={applyCode}
                    disabled={checking || !code.trim()}
                    className="shrink-0"
                  >
                    {checking ? <Loader2 className="size-4 animate-spin" /> : "Pakai"}
                  </Button>
                </div>
                {discount && (
                  <p className="text-xs font-semibold text-emerald-500">
                    Diskon diterapkan: {discount.label} → {formatIDR(discount.price)}
                  </p>
                )}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Pembayaran diproses aman lewat iPaymu (transfer bank, e-wallet,
              QRIS, kartu).
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={busy}
            >
              Batal
            </Button>
            <Button type="button" onClick={handleCheckout} disabled={busy}>
              {busy ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Mengarahkan...
                </>
              ) : (
                `Lanjut Bayar ${priceLabel}`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
