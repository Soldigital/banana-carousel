"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { SalesChart } from "@/components/admin/SalesChart";
import type { SalesSeries } from "@/lib/data/admin-stats";

// Extracted verbatim from the former app/admin/AdminClient.tsx `Overview()`
// SalesChart half — logic unchanged, only relocated to /admin/analytics.
export function SalesOverview({ sales }: { sales: SalesSeries }) {
  const [period, setPeriod] = React.useState<"daily" | "weekly" | "monthly">(
    "daily",
  );
  const series =
    period === "daily" ? sales.daily : period === "weekly" ? sales.weekly : sales.monthly;

  return (
    <div className="rounded-2xl border border-border bg-card/40 p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h3 className="font-display font-semibold">Grafik Penjualan</h3>
        <div className="flex gap-1">
          {(["daily", "weekly", "monthly"] as const).map((p) => (
            <Button
              key={p}
              size="sm"
              variant={period === p ? "default" : "outline"}
              onClick={() => setPeriod(p)}
            >
              {p === "daily" ? "Harian" : p === "weekly" ? "Mingguan" : "Bulanan"}
            </Button>
          ))}
        </div>
      </div>
      <SalesChart data={series} />
    </div>
  );
}
