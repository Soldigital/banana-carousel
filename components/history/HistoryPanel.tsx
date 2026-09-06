"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useVirtualizer } from "@tanstack/react-virtual";
import { toast } from "sonner";
import {
  Search,
  Trash2,
  RotateCcw,
  Loader2,
  History,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";
import { useFormStore } from "@/lib/store/form-store";
import { STYLE_PRESETS, getPresetById } from "@/lib/prompts/style-presets";
import type { CarouselSummary, CarouselRecord, CarouselStatus } from "@/types/db";

type Sort = "newest" | "oldest" | "most_used";
type DateRange = "all" | "today" | "7d" | "30d" | "custom";

function fmtDate(iso: string): string {
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

function startOfTodayISO(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}
function daysAgoISO(n: number): string {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();
}

const STATUS_BADGE: Record<CarouselStatus, string> = {
  success: "bg-emerald-500/15 text-emerald-500",
  failed: "bg-red-500/15 text-red-500",
  draft: "bg-amber-500/15 text-amber-500",
};
const STATUS_LABEL: Record<CarouselStatus, string> = {
  success: "Sukses",
  failed: "Gagal",
  draft: "Draft",
};

export function HistoryPanel() {
  const router = useRouter();
  const loadFromHistory = useFormStore((s) => s.loadFromHistory);

  const [tab, setTab] = React.useState<"active" | "bin">("active");

  // filters
  const [searchInput, setSearchInput] = React.useState("");
  const q = useDebouncedValue(searchInput, 250);
  const [dateRange, setDateRange] = React.useState<DateRange>("all");
  const [customFrom, setCustomFrom] = React.useState("");
  const [customTo, setCustomTo] = React.useState("");
  const [style, setStyle] = React.useState("");
  const [status, setStatus] = React.useState<"" | CarouselStatus>("");
  const [sort, setSort] = React.useState<Sort>("newest");

  // list state
  const [rows, setRows] = React.useState<CarouselSummary[]>([]);
  const [cursor, setCursor] = React.useState<string | null>(null);
  const [hasMore, setHasMore] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [loadingMore, setLoadingMore] = React.useState(false);
  // Latched pagination failure. Without it a failed page request retries on
  // every render (see loadMore below).
  const [loadMoreError, setLoadMoreError] = React.useState(false);
  const [opening, setOpening] = React.useState<string | null>(null);
  const [confirm, setConfirm] = React.useState<
    null | { kind: "permanent"; id: string; title: string } | { kind: "empty" }
  >(null);

  const reqId = React.useRef(0);

  const buildUrl = React.useCallback(
    (nextCursor: string | null): string => {
      if (tab === "bin") {
        const p = new URLSearchParams();
        if (nextCursor) p.set("cursor", nextCursor);
        return `/api/carousels/recycle-bin?${p.toString()}`;
      }
      const p = new URLSearchParams();
      if (q.trim()) p.set("q", q.trim());
      if (style) p.set("style", style);
      if (status) p.set("status", status);
      if (sort) p.set("sort", sort);
      if (dateRange === "today") p.set("dateFrom", startOfTodayISO());
      else if (dateRange === "7d") p.set("dateFrom", daysAgoISO(7));
      else if (dateRange === "30d") p.set("dateFrom", daysAgoISO(30));
      else if (dateRange === "custom") {
        if (customFrom) p.set("dateFrom", new Date(customFrom).toISOString());
        if (customTo) {
          const to = new Date(customTo);
          to.setHours(23, 59, 59, 999);
          p.set("dateTo", to.toISOString());
        }
      }
      if (nextCursor) p.set("cursor", nextCursor);
      return `/api/carousels?${p.toString()}`;
    },
    [tab, q, style, status, sort, dateRange, customFrom, customTo],
  );

  // (Re)load from scratch whenever filters/tab change.
  React.useEffect(() => {
    const id = ++reqId.current;
    setLoading(true);
    setLoadMoreError(false);
    fetch(buildUrl(null))
      .then((r) => r.json())
      .then((data) => {
        if (id !== reqId.current) return;
        setRows(data.rows ?? []);
        setCursor(data.nextCursor ?? null);
        setHasMore(Boolean(data.nextCursor));
      })
      .catch(() => {
        if (id !== reqId.current) return;
        setRows([]);
        setCursor(null);
        setHasMore(false);
        toast.error("Gagal memuat riwayat.");
      })
      .finally(() => {
        if (id === reqId.current) setLoading(false);
      });
  }, [buildUrl]);

  const loadMore = React.useCallback(() => {
    if (!hasMore || loadingMore || loadMoreError || !cursor) return;
    const id = reqId.current;
    setLoadingMore(true);
    fetch(buildUrl(cursor))
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        if (id !== reqId.current) return;
        setRows((prev) => [...prev, ...(data.rows ?? [])]);
        setCursor(data.nextCursor ?? null);
        setHasMore(Boolean(data.nextCursor));
      })
      .catch(() => {
        // Swallowing this used to spin: cursor/hasMore stayed untouched, so the
        // scroll effect below (which re-runs every render, because
        // getVirtualItems() returns a fresh array identity) called loadMore()
        // again immediately and hammered /api/carousels. Latch the failure and
        // surface a retry instead.
        if (id !== reqId.current) return;
        setLoadMoreError(true);
      })
      .finally(() => setLoadingMore(false));
  }, [hasMore, loadingMore, loadMoreError, cursor, buildUrl]);

  const retryLoadMore = React.useCallback(() => {
    setLoadMoreError(false);
  }, []);

  // Virtualized list.
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 92,
    overscan: 8,
  });
  const items = virtualizer.getVirtualItems();

  // Infinite scroll: fetch the next page as we approach the end.
  React.useEffect(() => {
    const last = items[items.length - 1];
    if (last && last.index >= rows.length - 5) loadMore();
  }, [items, rows.length, loadMore]);

  async function openCarousel(id: string) {
    setOpening(id);
    try {
      const res = await fetch(`/api/carousels/${id}`);
      if (!res.ok) throw new Error();
      const { record } = (await res.json()) as { record: CarouselRecord };
      loadFromHistory(record.input, record.output);
      void fetch(`/api/carousels/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reuse" }),
      });
      router.push("/generate");
    } catch {
      toast.error("Gagal membuka carousel.");
      setOpening(null);
    }
  }

  async function action(id: string, act: "delete" | "restore" | "permanent-delete") {
    const res = await fetch(`/api/carousels/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: act }),
    });
    return res.ok;
  }

  async function softDelete(row: CarouselSummary) {
    setRows((prev) => prev.filter((r) => r.id !== row.id)); // optimistic
    const ok = await action(row.id, "delete");
    if (!ok) {
      toast.error("Gagal menghapus.");
      setRows((prev) => [row, ...prev]);
      return;
    }
    toast.success("Dipindahkan ke Recycle Bin.", {
      action: {
        label: "Urungkan",
        onClick: async () => {
          if (await action(row.id, "restore")) {
            setRows((prev) => [row, ...prev]);
          }
        },
      },
    });
  }

  async function restore(row: CarouselSummary) {
    setRows((prev) => prev.filter((r) => r.id !== row.id));
    if (await action(row.id, "restore")) toast.success("Dipulihkan.");
    else {
      toast.error("Gagal memulihkan.");
      setRows((prev) => [row, ...prev]);
    }
  }

  async function permanentDelete(id: string) {
    setRows((prev) => prev.filter((r) => r.id !== id));
    setConfirm(null);
    if (await action(id, "permanent-delete")) toast.success("Dihapus permanen.");
    else toast.error("Gagal menghapus permanen.");
  }

  async function emptyBin() {
    setConfirm(null);
    const res = await fetch("/api/carousels/empty-bin", { method: "POST" });
    if (res.ok) {
      setRows([]);
      setHasMore(false);
      toast.success("Recycle Bin dikosongkan.");
    } else {
      toast.error("Gagal mengosongkan.");
    }
  }

  const showFilters = tab === "active";

  return (
    <section>
      <div className="mb-4 flex items-center gap-2">
        <History className="size-5 text-banana" />
        <h2 className="font-display text-lg font-semibold">Riwayat Carousel</h2>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as "active" | "bin")}>
        <TabsList className="mb-4">
          <TabsTrigger value="active">Riwayat</TabsTrigger>
          <TabsTrigger value="bin">Recycle Bin</TabsTrigger>
        </TabsList>

        {showFilters && (
          <div className="mb-3 space-y-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari judul, premis, brand, style, CTA…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as DateRange)}
                className="rounded-lg border border-border bg-background px-2 py-2 text-sm"
              >
                <option value="all">Semua tanggal</option>
                <option value="today">Hari ini</option>
                <option value="7d">7 hari terakhir</option>
                <option value="30d">30 hari terakhir</option>
                <option value="custom">Rentang khusus…</option>
              </select>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                className="rounded-lg border border-border bg-background px-2 py-2 text-sm"
              >
                <option value="">Semua style</option>
                {STYLE_PRESETS.filter((p) => !p.hidden).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as "" | CarouselStatus)}
                className="rounded-lg border border-border bg-background px-2 py-2 text-sm"
              >
                <option value="">Semua status</option>
                <option value="success">Sukses</option>
                <option value="failed">Gagal</option>
                <option value="draft">Draft</option>
              </select>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as Sort)}
                className="rounded-lg border border-border bg-background px-2 py-2 text-sm"
              >
                <option value="newest">Terbaru</option>
                <option value="oldest">Terlama</option>
                <option value="most_used">Paling Sering</option>
              </select>
            </div>
            {dateRange === "custom" && (
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  aria-label="Dari tanggal"
                />
                <Input
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  aria-label="Sampai tanggal"
                />
              </div>
            )}
          </div>
        )}

        {tab === "bin" && rows.length > 0 && (
          <div className="mb-3 flex justify-end">
            <Button variant="outline" size="sm" onClick={() => setConfirm({ kind: "empty" })}>
              <Trash2 className="size-4" />
              Kosongkan Recycle Bin
            </Button>
          </div>
        )}

        <TabsContent value={tab}>
          {loading ? (
            <div className="flex items-center justify-center rounded-2xl border border-dashed border-border p-10 text-sm text-muted-foreground">
              <Loader2 className="mr-2 size-4 animate-spin" /> Memuat…
            </div>
          ) : rows.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
              {tab === "bin"
                ? "Recycle Bin kosong."
                : q || style || status || dateRange !== "all"
                  ? "Tidak ada hasil untuk filter ini."
                  : "Belum ada carousel tersimpan. Carousel yang Anda buat akan otomatis muncul di sini."}
            </div>
          ) : (
            <div
              ref={scrollRef}
              className="max-h-[70vh] overflow-auto rounded-2xl border border-border"
            >
              <div style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
                {items.map((vi) => {
                  const row = rows[vi.index];
                  if (!row) return null;
                  const st = (row.status ?? "success") as CarouselStatus;
                  return (
                    <div
                      key={row.id}
                      ref={virtualizer.measureElement}
                      data-index={vi.index}
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        transform: `translateY(${vi.start}px)`,
                      }}
                      className="flex items-center gap-3 border-b border-border/60 p-3 last:border-b-0"
                    >
                      <button
                        onClick={() => openCarousel(row.id)}
                        disabled={opening === row.id}
                        className="min-w-0 flex-1 text-left"
                      >
                        <p className="line-clamp-1 font-semibold">
                          {row.title || row.carousel_title || "Tanpa judul"}
                        </p>
                        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_BADGE[st]}`}
                          >
                            {STATUS_LABEL[st]}
                          </span>
                          <span>{row.slide_count} slide</span>
                          <span>·</span>
                          <span>{getPresetById(row.style_preset_id ?? "").name}</span>
                          <span>·</span>
                          <span>{fmtDate(row.created_at)}</span>
                        </p>
                      </button>
                      {opening === row.id ? (
                        <Loader2 className="size-4 animate-spin text-muted-foreground" />
                      ) : tab === "active" ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          aria-label="Hapus"
                          onClick={() => softDelete(row)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      ) : (
                        <div className="flex shrink-0 items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            aria-label="Pulihkan"
                            onClick={() => restore(row)}
                          >
                            <RotateCcw className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            aria-label="Hapus permanen"
                            onClick={() =>
                              setConfirm({
                                kind: "permanent",
                                id: row.id,
                                title: row.title || row.carousel_title || "Tanpa judul",
                              })
                            }
                          >
                            <Trash2 className="size-4 text-red-500" />
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {loadingMore && (
                <div className="flex items-center justify-center p-3 text-xs text-muted-foreground">
                  <Loader2 className="mr-2 size-3 animate-spin" /> Memuat lagi…
                </div>
              )}
              {loadMoreError && !loadingMore && (
                <div className="flex items-center justify-center gap-2 p-3 text-xs text-muted-foreground">
                  <span>Gagal memuat halaman berikutnya.</span>
                  <Button variant="outline" size="sm" onClick={retryLoadMore}>
                    Coba lagi
                  </Button>
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Confirm dialogs */}
      <Dialog open={confirm !== null} onOpenChange={(o) => !o && setConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-red-500" />
              {confirm?.kind === "empty"
                ? "Kosongkan Recycle Bin?"
                : "Hapus Permanen?"}
            </DialogTitle>
            <DialogDescription>
              Data yang dihapus permanen tidak dapat dikembalikan.
              {confirm?.kind === "permanent" && (
                <>
                  {" "}
                  <span className="font-semibold">{confirm.title}</span> akan
                  dihapus selamanya.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirm(null)}>
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                confirm?.kind === "empty"
                  ? emptyBin()
                  : confirm && permanentDelete(confirm.id)
              }
            >
              <Trash2 className="size-4" />
              Hapus Permanen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
