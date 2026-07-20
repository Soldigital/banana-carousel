"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatIDR } from "@/lib/config/payment";
import type { AdminOrder } from "@/lib/data/admin-orders";

// Extracted verbatim from the former app/admin/AdminClient.tsx `ApprovalTab`
// — logic unchanged, only relocated + renamed to /admin/orders.
export function OrdersPanel({ orders }: { orders: AdminOrder[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = React.useState<string | null>(null);

  async function act(orderId: string, action: "approve" | "reject") {
    setBusyId(orderId);
    try {
      const res = await fetch(`/api/admin/orders/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Gagal.");
      toast.success(action === "approve" ? "Disetujui." : "Ditolak.");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal.");
    } finally {
      setBusyId(null);
    }
  }

  if (orders.length === 0)
    return (
      <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
        Tidak ada transfer manual menunggu approval. 🎉
      </div>
    );

  return (
    <div className="space-y-4">
      {orders.map((o) => (
        <div key={o.id} className="rounded-2xl border border-border bg-card/40 p-5">
          <div className="flex flex-col gap-4 sm:flex-row">
            {o.proofSignedUrl ? (
              <a href={o.proofSignedUrl} target="_blank" rel="noopener noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={o.proofSignedUrl}
                  alt="Bukti"
                  className="h-32 w-32 rounded-lg border border-border object-cover"
                />
              </a>
            ) : (
              <div className="flex h-32 w-32 items-center justify-center rounded-lg border border-dashed text-xs text-muted-foreground">
                Tanpa bukti
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{o.name || "(tanpa nama)"}</p>
              <p className="truncate text-sm text-muted-foreground">{o.email}</p>
              <p className="text-sm text-muted-foreground">WA: {o.whatsapp || "-"}</p>
              <p className="mt-1 text-sm font-semibold">{formatIDR(o.amount)}</p>
              <div className="mt-4 flex gap-2">
                <Button size="sm" onClick={() => act(o.id, "approve")} disabled={busyId === o.id}>
                  {busyId === o.id ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                  Approve
                </Button>
                <Button size="sm" variant="outline" onClick={() => act(o.id, "reject")} disabled={busyId === o.id}>
                  <X className="size-4" /> Tolak
                </Button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
