"use client";

import { formatIDR } from "@/lib/config/payment";
import type { SeriesPoint } from "@/lib/data/admin-stats";

// Lightweight dependency-free bar chart.
export function SalesChart({ data }: { data: SeriesPoint[] }) {
  const max = Math.max(1, ...data.map((d) => d.total));
  return (
    <div className="flex h-52 items-end gap-1.5">
      {data.map((d, i) => (
        <div
          key={i}
          className="group flex flex-1 flex-col items-center justify-end gap-1"
        >
          <span className="whitespace-nowrap text-[9px] text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
            {d.total > 0 ? formatIDR(d.total) : ""}
          </span>
          <div
            className="w-full rounded-t bg-banana/70 transition-all group-hover:bg-banana"
            style={{
              height: `${(d.total / max) * 100}%`,
              minHeight: d.total > 0 ? 4 : 2,
            }}
            title={`${d.label}: ${formatIDR(d.total)}`}
          />
          <span className="w-full truncate text-center text-[9px] text-muted-foreground">
            {d.label}
          </span>
        </div>
      ))}
    </div>
  );
}
