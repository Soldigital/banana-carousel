"use client";

import * as React from "react";
import { Loader2, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { formatIDR } from "@/lib/config/payment";

interface Affiliate {
  id: string;
  code: string;
  reward_type: "commission" | "bonus";
  commission_rate: number;
  referral_count: number;
  balance: number;
}

export function AffiliatesTab() {
  const [rows, setRows] = React.useState<Affiliate[]>([]);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(() => {
    setLoading(true);
    fetch("/api/admin/affiliates")
      .then((r) => r.json())
      .then((d) => setRows(d.affiliates ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);
  React.useEffect(load, [load]);

  async function markPaid(a: Affiliate) {
    if (!confirm(`Tandai komisi ${a.code} (${formatIDR(a.balance)}) sudah dibayar?`)) return;
    const res = await fetch("/api/admin/affiliates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ affiliateId: a.id }),
    });
    if (res.ok) {
      toast.success("Ditandai lunas.");
      load();
    } else toast.error("Gagal.");
  }

  if (loading)
    return (
      <div className="flex items-center justify-center p-6 text-sm text-muted-foreground">
        <Loader2 className="mr-2 size-4 animate-spin" /> Memuat…
      </div>
    );

  if (rows.length === 0)
    return (
      <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        Belum ada affiliate.
      </p>
    );

  return (
    <div className="space-y-2">
      {rows.map((a) => (
        <div
          key={a.id}
          className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-background/40 p-3"
        >
          <Share2 className="size-4 text-banana" />
          <code className="font-mono text-sm font-bold">{a.code}</code>
          <span className="text-xs text-muted-foreground">
            {a.referral_count} referral ·{" "}
            {a.reward_type === "commission"
              ? `komisi ${Math.round(a.commission_rate * 100)}%`
              : "bonus masa aktif"}
          </span>
          {a.reward_type === "commission" && (
            <span className="text-sm font-semibold">{formatIDR(a.balance)}</span>
          )}
          {a.reward_type === "commission" && a.balance > 0 && (
            <Button size="sm" variant="outline" className="ml-auto" onClick={() => markPaid(a)}>
              Tandai Dibayar
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}
