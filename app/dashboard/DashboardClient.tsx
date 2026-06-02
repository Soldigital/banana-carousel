"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Banknote,
  CheckCircle2,
  KeyRound,
  Loader2,
  Lock,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CopyButton } from "@/components/generator/CopyButton";
import { BuyButton } from "@/components/pricing/BuyButton";
import { useFormStore } from "@/lib/store/form-store";
import type { EntitlementStatus } from "@/lib/license/status";
import type { CarouselRecord } from "@/types/db";

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

export function DashboardClient({
  status,
  carousels,
}: {
  status: EntitlementStatus;
  carousels: CarouselRecord[];
}) {
  const router = useRouter();
  const loadFromHistory = useFormStore((s) => s.loadFromHistory);

  function openCarousel(rec: CarouselRecord) {
    loadFromHistory(rec.input, rec.output);
    router.push("/generate");
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">{status.email}</p>
      </div>

      {/* Account / license status */}
      <section className="rounded-2xl border border-border bg-card/40 p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-lg font-semibold">Status Akses</h2>
          {status.entitled ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-500">
              <CheckCircle2 className="size-3.5" />
              {status.owner ? "Owner" : "Pro — Lifetime"}
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
                  <CopyButton
                    text={status.accessCode}
                    label="Salin Kode"
                    className="shrink-0"
                  />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              Aktifkan akses lifetime untuk membuka generator.
            </p>
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
          </div>
        )}
      </section>

      {/* Carousel history */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">
            Riwayat Carousel
          </h2>
          <span className="text-xs text-muted-foreground">
            {carousels.length} tersimpan
          </span>
        </div>

        {carousels.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            Belum ada carousel tersimpan. Carousel yang Anda buat akan otomatis
            muncul di sini.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {carousels.map((rec) => (
              <motion.button
                key={rec.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => openCarousel(rec)}
                className="group rounded-2xl border border-border bg-card/40 p-4 text-left transition-colors hover:border-banana/50 hover:bg-card"
              >
                <p className="line-clamp-2 font-semibold">
                  {rec.title || rec.output?.carousel_title || "Tanpa judul"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {rec.input?.slideCount ?? rec.output?.slides?.length ?? 0} slide
                  {" · "}
                  {formatDate(rec.created_at)}
                </p>
                <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-banana opacity-0 transition-opacity group-hover:opacity-100">
                  Buka di generator →
                </span>
              </motion.button>
            ))}
          </div>
        )}
      </section>
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
        <Button
          variant="outline"
          onClick={handleClaim}
          disabled={busy}
          className="shrink-0"
        >
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
