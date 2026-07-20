"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useFormStore } from "@/lib/store/form-store";
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

// Extracted verbatim from the former app/dashboard/DashboardClient.tsx legacy
// (non-v2) history grid — logic unchanged, only relocated. Rendered only when
// USE_HISTORY_V2 is off.
export function LegacyHistoryGrid({ carousels }: { carousels: CarouselRecord[] }) {
  const router = useRouter();
  const loadFromHistory = useFormStore((s) => s.loadFromHistory);

  function openCarousel(rec: CarouselRecord) {
    loadFromHistory(rec.input, rec.output);
    router.push("/generate");
  }

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold">
          Riwayat Carousel{" "}
          <span className="text-sm font-normal text-muted-foreground">
            (30 hari terakhir)
          </span>
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
  );
}
