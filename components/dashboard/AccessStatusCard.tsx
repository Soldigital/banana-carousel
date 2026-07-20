"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Banknote, CheckCircle2, KeyRound, Loader2, Lock, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CopyButton } from "@/components/generator/CopyButton";
import { BuyButton } from "@/components/pricing/BuyButton";
import { USE_PRICING_V2 } from "@/lib/config/flags";
import type { EntitlementStatus } from "@/lib/license/status";

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

// Extracted verbatim from the former app/dashboard/DashboardClient.tsx
// "Status Akses" section — logic unchanged, only relocated.
export function AccessStatusCard({ status }: { status: EntitlementStatus }) {
  const router = useRouter();

  return (
    <section className="rounded-2xl border border-border bg-card/40 p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-lg font-semibold">Status Akses</h2>
        {status.entitled ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-500">
            <CheckCircle2 className="size-3.5" />
            {status.owner
              ? "Owner"
              : status.tier === "pro_annual"
                ? "Pro — Annual"
                : status.tier === "founding"
                  ? "Founding Member"
                  : "Pro — Lifetime"}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
            <Lock className="size-3.5" />
            Belum Aktif
          </span>
        )}
      </div>

      {status.entitled ? (
        <div className="mt-4 space-y-4">
          {status.tier === "pro_annual" && status.tierExpiresAt && (
            <div className="flex flex-col gap-2 rounded-lg border border-border bg-background/40 p-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                Pro Annual aktif sampai{" "}
                <span className="font-semibold text-foreground">
                  {formatDate(status.tierExpiresAt)}
                </span>
              </p>
              {USE_PRICING_V2 && (
                <BuyButton plan="annual" label="Perpanjang" variant="outline" size="sm" />
              )}
            </div>
          )}
          <Button asChild>
            <Link href="/generate">
              <Sparkles className="size-4" />
              Buka Generator
            </Link>
          </Button>

          {status.accessCode && (
            <div>
              <p className="mb-1.5 text-xs font-semibold text-muted-foreground">
                Kode Akses (lisensi Anda)
              </p>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <code className="block flex-1 overflow-x-auto rounded-lg border border-border bg-background px-3 py-2 font-mono text-xs">
                  {status.accessCode}
                </code>
                <CopyButton text={status.accessCode} label="Salin Kode" className="shrink-0" />
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          {USE_PRICING_V2 && status.tier === "pro_annual" ? (
            <p className="text-sm text-muted-foreground">
              Langganan Pro Annual Anda sudah berakhir. Perpanjang untuk membuka
              generator lagi.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Aktifkan akses lifetime untuk membuka generator.
            </p>
          )}
          {USE_PRICING_V2 && status.tier === "pro_annual" && (
            <BuyButton plan="annual" label="Perpanjang Pro Annual" className="w-full sm:w-auto" />
          )}
          <div className="flex flex-col gap-2 sm:flex-row">
            <BuyButton />
            <Button asChild variant="outline">
              <Link href="/transfer">
                <Banknote className="size-4" />
                Transfer Bank Manual
              </Link>
            </Button>
          </div>
          <ClaimLicense onClaimed={() => router.refresh()} />
          {USE_PRICING_V2 && <PromoRedeem onRedeemed={() => router.refresh()} />}
        </div>
      )}
    </section>
  );
}

function PromoRedeem({ onRedeemed }: { onRedeemed: () => void }) {
  const [code, setCode] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  async function redeem() {
    const c = code.trim();
    if (!c) return toast.error("Masukkan kode promo dulu.");
    setBusy(true);
    try {
      const res = await fetch("/api/promo/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: c }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Kode tidak valid.");
      toast.success(
        data.type === "trial" ? "Trial aktif! Selamat mencoba." : "Akses diaktifkan!",
      );
      onRedeemed();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal klaim.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="border-t border-border pt-4">
      <p className="mb-2 text-xs font-semibold text-muted-foreground">
        Punya kode promo / trial? Klaim di sini:
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          placeholder="COBA30"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          className="font-mono text-xs"
        />
        <Button variant="outline" onClick={redeem} disabled={busy} className="shrink-0">
          {busy ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
          Klaim Kode
        </Button>
      </div>
    </div>
  );
}

function ClaimLicense({ onClaimed }: { onClaimed: () => void }) {
  const [token, setToken] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  async function handleClaim() {
    const raw = token.trim();
    if (!raw) return toast.error("Tempel kode akses / lisensi Anda dulu.");
    setBusy(true);
    try {
      const res = await fetch("/api/license/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: raw }),
      });
      const data = await res.json();
      if (!res.ok || !data.claimed) {
        throw new Error(data.error || "Gagal mengklaim lisensi.");
      }
      toast.success("Lisensi diklaim ke akun Anda!");
      onClaimed();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengklaim.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="border-t border-border pt-4">
      <p className="mb-2 text-xs font-semibold text-muted-foreground">
        Sudah punya kode akses lama? Klaim ke akun ini:
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          placeholder="Tempel kode akses / lisensi"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          className="font-mono text-xs"
        />
        <Button variant="outline" onClick={handleClaim} disabled={busy} className="shrink-0">
          {busy ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <KeyRound className="size-4" />
          )}
          Klaim
        </Button>
      </div>
    </div>
  );
}
