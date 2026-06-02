"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Check, ExternalLink, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { formatIDR } from "@/lib/config/payment";
import type { AdminOrder } from "@/lib/data/admin-orders";

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("id-ID", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function AdminClient({ orders }: { orders: AdminOrder[] }) {
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
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Gagal memproses.");
      }
      toast.success(
        action === "approve"
          ? "Order disetujui — akses & email terkirim."
          : "Order ditolak.",
      );
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal memproses.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Admin — Transfer Manual</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {orders.length} order menunggu verifikasi
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          Tidak ada transfer manual yang menunggu approval. 🎉
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((o) => (
            <motion.div
              key={o.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-border bg-card/40 p-5"
            >
              <div className="flex flex-col gap-4 sm:flex-row">
                {o.proofSignedUrl ? (
                  <a
                    href={o.proofSignedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative block shrink-0"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={o.proofSignedUrl}
                      alt="Bukti transfer"
                      className="h-32 w-32 rounded-lg border border-border object-cover"
                    />
                    <span className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                      <ExternalLink className="size-5 text-white" />
                    </span>
                  </a>
                ) : (
                  <div className="flex h-32 w-32 shrink-0 items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted-foreground">
                    Tanpa bukti
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{o.name || "(tanpa nama)"}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {o.email}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    WA: {o.whatsapp || "-"}
                  </p>
                  <p className="mt-1 text-sm">
                    <span className="font-semibold">{formatIDR(o.amount)}</span>
                    <span className="text-muted-foreground">
                      {" · "}
                      {formatDate(o.created_at)}
                    </span>
                  </p>

                  <div className="mt-4 flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => act(o.id, "approve")}
                      disabled={busyId === o.id}
                    >
                      {busyId === o.id ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Check className="size-4" />
                      )}
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => act(o.id, "reject")}
                      disabled={busyId === o.id}
                    >
                      <X className="size-4" />
                      Tolak
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
