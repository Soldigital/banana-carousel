"use client";

import * as React from "react";
import { Rocket } from "lucide-react";
import { formatIDR, LIFETIME_PRICE } from "@/lib/config/payment";

interface FoundingStatus {
  taken: number;
  cap: number;
  remaining: number;
  founding: boolean;
  price: number;
}

// Live Founding Member counter + progress bar. Drives urgency on the pricing
// section. Renders nothing until the status loads (keeps layout calm).
export function FoundingBanner() {
  const [s, setS] = React.useState<FoundingStatus | null>(null);

  React.useEffect(() => {
    fetch("/api/founding")
      .then((r) => r.json())
      .then(setS)
      .catch(() => {});
  }, []);

  if (!s) return null;
  const pct = Math.min(100, Math.round((s.taken / s.cap) * 100));

  return (
    <div className="mx-auto mt-6 max-w-md rounded-2xl border border-banana/40 bg-banana/5 p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-banana/15 px-2.5 py-1 text-xs font-bold text-banana">
          <Rocket className="size-3.5" />
          {s.founding ? "FOUNDING MEMBER" : "LIFETIME"}
        </span>
        <span className="text-sm font-semibold">
          {s.founding ? (
            <>
              {s.taken}/{s.cap} terisi
            </>
          ) : (
            "Slot founding habis"
          )}
        </span>
      </div>

      <div className="mt-2.5 h-2.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-banana transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>

      <p className="mt-2.5 text-center text-sm">
        {s.founding ? (
          <>
            Sisa{" "}
            <span className="font-bold text-banana">{s.remaining} slot</span>{" "}
            harga{" "}
            <span className="font-bold">{formatIDR(s.price)}</span> lifetime —
            setelah penuh naik jadi {formatIDR(LIFETIME_PRICE)}.
          </>
        ) : (
          <>
            Harga lifetime sekarang{" "}
            <span className="font-bold">{formatIDR(s.price)}</span>.
          </>
        )}
      </p>
    </div>
  );
}
