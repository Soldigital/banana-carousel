"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/generator/CopyButton";
import { ActivateKeyForm } from "@/components/license/ActivateKeyForm";
import { saveLicense } from "@/lib/license/storage";
import { useLicenseStore } from "@/lib/store/license-store";

type State =
  | { phase: "verifying" }
  | { phase: "paid"; token: string; email: string }
  | { phase: "unpaid" }
  | { phase: "error"; message: string };

export function ActivateClient() {
  const params = useSearchParams();
  const unlock = useLicenseStore((s) => s.unlock);
  const [state, setState] = React.useState<State>({ phase: "verifying" });

  const trxId =
    params.get("trx_id") ||
    params.get("transactionId") ||
    params.get("trxid") ||
    "";

  React.useEffect(() => {
    if (!trxId) {
      setState({ phase: "unpaid" });
      return;
    }
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/activate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ trxId }),
        });
        const data = await res.json();
        if (!active) return;
        if (res.ok && data.paid && data.token) {
          saveLicense(data.token);
          unlock(false);
          setState({ phase: "paid", token: data.token, email: data.email });
        } else if (res.ok && data.paid === false) {
          setState({ phase: "unpaid" });
        } else {
          setState({ phase: "error", message: data.error || "Gagal memverifikasi." });
        }
      } catch {
        if (active) setState({ phase: "error", message: "Gagal terhubung ke server." });
      }
    })();
    return () => {
      active = false;
    };
  }, [trxId, unlock]);

  return (
    <div className="mx-auto max-w-md">
      {state.phase === "verifying" && (
        <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
          <Loader2 className="size-7 animate-spin text-banana" />
          <p>Memverifikasi pembayaran Anda...</p>
        </div>
      )}

      {state.phase === "paid" && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-banana/40 bg-gradient-to-br from-banana/10 to-transparent p-6 sm:p-8 text-center"
        >
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-banana/20 text-banana">
            <CheckCircle2 className="size-7" />
          </div>
          <h1 className="mt-4 font-display text-2xl font-bold">
            Pembayaran berhasil! 🎉
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Akses lifetime Anda sudah aktif di browser ini. Simpan license key
            di bawah — juga kami kirim ke{" "}
            <span className="font-semibold text-foreground">{state.email}</span>.
          </p>

          <div className="mt-5 rounded-xl border border-border bg-card p-3 text-left">
            <p className="mb-1.5 text-[10px] font-bold tracking-wider text-muted-foreground">
              LICENSE KEY
            </p>
            <p className="break-all font-mono text-xs leading-relaxed">
              {state.token}
            </p>
            <div className="mt-3">
              <CopyButton text={state.token} label="Copy License Key" />
            </div>
          </div>

          <Button asChild size="lg" className="mt-6 w-full">
            <Link href="/generate">Mulai Generate →</Link>
          </Button>
        </motion.div>
      )}

      {state.phase === "unpaid" && (
        <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 text-center">
          <Loader2 className="mx-auto size-7 text-muted-foreground" />
          <h1 className="mt-4 font-display text-xl font-bold">
            Pembayaran belum terkonfirmasi
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Jika Anda baru saja membayar, tunggu sebentar lalu muat ulang
            halaman ini. License key juga dikirim ke email Anda begitu
            pembayaran masuk.
          </p>
          <div className="mt-5 border-t border-border pt-5 text-left">
            <p className="mb-2 text-xs font-semibold text-muted-foreground">
              Sudah dapat key via email? Tempel di sini:
            </p>
            <ActivateKeyForm />
          </div>
        </div>
      )}

      {state.phase === "error" && (
        <div className="rounded-3xl border border-destructive/40 bg-destructive/5 p-6 sm:p-8 text-center">
          <XCircle className="mx-auto size-7 text-destructive" />
          <h1 className="mt-4 font-display text-xl font-bold">
            Terjadi kesalahan
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{state.message}</p>
          <Button asChild variant="outline" className="mt-5">
            <Link href="/#pricing">Kembali ke harga</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
