"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Banknote, Check, Loader2, Lock, LogIn } from "lucide-react";
import { BuyButton } from "@/components/pricing/BuyButton";
import { Button } from "@/components/ui/button";
import { ActivateKeyForm } from "./ActivateKeyForm";
import { getLicense, clearLicense } from "@/lib/license/storage";
import { useLicenseStore, verifyLicenseToken } from "@/lib/store/license-store";
import { useAuth } from "@/components/providers/auth-provider";

const LOCKED_BENEFITS = [
  "Master prompt Gemini-ready 600-1500 kata",
  "Caption Instagram siap copy-paste",
  "8 style preset premium + EN/ID + export",
];

// Client gate around the generator. Resolution order:
//   1) Logged-in Supabase account with entitlement (is_pro / owner) → unlock
//   2) Valid HMAC token in localStorage (legacy customers) → unlock
//   3) Locked: buy / login / manual transfer / paste existing key
export function LicenseGate({ children }: { children: React.ReactNode }) {
  const status = useLicenseStore((s) => s.status);
  const setStatus = useLicenseStore((s) => s.setStatus);
  const unlock = useLicenseStore((s) => s.unlock);
  const { user, loading: authLoading } = useAuth();

  React.useEffect(() => {
    if (authLoading) return; // wait for auth state to settle (stays "checking")
    let active = true;

    (async () => {
      // 1) Account-based entitlement.
      if (user) {
        try {
          const res = await fetch("/api/license/status");
          const data = await res.json();
          if (!active) return;
          if (data.entitled) {
            unlock(!!data.owner);
            return;
          }
        } catch {
          /* fall through to token check */
        }
      }

      // 2) Legacy localStorage token.
      const token = getLicense();
      if (token) {
        const { valid, owner } = await verifyLicenseToken(token);
        if (!active) return;
        if (valid) {
          unlock(owner);
          return;
        }
        clearLicense();
      }

      // 3) Locked.
      if (active) setStatus("locked");
    })();

    return () => {
      active = false;
    };
  }, [user, authLoading, setStatus, unlock]);

  if (status === "checking") {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        <Loader2 className="size-5 animate-spin mr-2" />
        Memeriksa lisensi...
      </div>
    );
  }

  if (status === "locked") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-md rounded-3xl border border-banana/40 bg-gradient-to-br from-banana/10 to-transparent p-6 sm:p-8 text-center"
      >
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-banana/20 text-banana">
          <Lock className="size-6" />
        </div>
        <h2 className="mt-4 font-display text-2xl font-bold">Akses Terkunci</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Generator Banana Carousel adalah fitur berbayar lifetime. Beli sekali,
          pakai selamanya.
        </p>

        <ul className="mt-5 space-y-2 text-left text-sm">
          {LOCKED_BENEFITS.map((b) => (
            <li key={b} className="flex items-start gap-2.5">
              <Check className="mt-0.5 size-4 shrink-0 text-banana" />
              <span>{b}</span>
            </li>
          ))}
        </ul>

        <div className="mt-6 flex items-end justify-center gap-2">
          <span className="text-base text-muted-foreground line-through">
            Rp199.000
          </span>
          <span className="font-display text-3xl font-bold leading-none">
            Rp99.000
          </span>
        </div>

        <div className="mt-5 space-y-2">
          <BuyButton size="lg" className="w-full" />
          <Button asChild variant="outline" size="lg" className="w-full">
            <Link href="/transfer">
              <Banknote className="size-4" />
              Bayar via Transfer Bank Manual
            </Link>
          </Button>
        </div>

        {!user && (
          <p className="mt-4 text-xs text-muted-foreground">
            Sudah punya akun?{" "}
            <Link
              href="/login?redirect=/generate"
              className="inline-flex items-center gap-1 font-semibold text-banana hover:underline"
            >
              <LogIn className="size-3.5" />
              Masuk
            </Link>
          </p>
        )}

        <div className="mt-6 border-t border-border pt-5 text-left">
          <p className="mb-2 text-xs font-semibold text-muted-foreground">
            Sudah punya lisensi? Tempel key Anda:
          </p>
          <ActivateKeyForm />
        </div>
      </motion.div>
    );
  }

  return <>{children}</>;
}
