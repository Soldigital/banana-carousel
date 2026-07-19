"use client";

import * as React from "react";
import { Plus, Trash2, Loader2, Tag } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Promo {
  id: string;
  code: string;
  name: string | null;
  type: "fixed" | "percentage" | "trial" | "upgrade";
  value: number;
  starts_at: string | null;
  ends_at: string | null;
  max_usage: number | null;
  per_user_limit: number;
  active: boolean;
  used: number;
}

const TYPE_LABEL: Record<Promo["type"], string> = {
  fixed: "Potongan Rp",
  percentage: "Diskon %",
  trial: "Trial (hari)",
  upgrade: "Upgrade (lifetime gratis)",
};

const EMPTY = {
  code: "",
  name: "",
  type: "percentage" as Promo["type"],
  value: "",
  max_usage: "",
  per_user_limit: "1",
  ends_at: "",
};

export function PromotionsTab() {
  const [codes, setCodes] = React.useState<Promo[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [draft, setDraft] = React.useState(EMPTY);
  const [saving, setSaving] = React.useState(false);

  const load = React.useCallback(() => {
    setLoading(true);
    fetch("/api/admin/promo")
      .then((r) => r.json())
      .then((d) => setCodes(d.codes ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);
  React.useEffect(load, [load]);

  async function create() {
    if (!draft.code.trim()) return toast.error("Kode wajib diisi.");
    setSaving(true);
    try {
      const res = await fetch("/api/admin/promo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...draft,
          ends_at: draft.ends_at ? new Date(draft.ends_at).toISOString() : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal.");
      toast.success("Kode promo dibuat.");
      setDraft(EMPTY);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal.");
    } finally {
      setSaving(false);
    }
  }

  async function toggle(p: Promo) {
    await fetch(`/api/admin/promo/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !p.active }),
    });
    load();
  }

  async function remove(p: Promo) {
    if (!confirm(`Hapus kode ${p.code}?`)) return;
    await fetch(`/api/admin/promo/${p.id}`, { method: "DELETE" });
    setCodes((prev) => prev.filter((x) => x.id !== p.id));
  }

  return (
    <div className="space-y-6">
      {/* Create */}
      <section className="rounded-2xl border border-border bg-card/40 p-5">
        <div className="mb-3 flex items-center gap-2">
          <Tag className="size-4 text-banana" />
          <h3 className="font-semibold">Buat Kode Promo</h3>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Fld label="Kode">
            <Input
              value={draft.code}
              onChange={(e) => setDraft({ ...draft, code: e.target.value.toUpperCase() })}
              placeholder="HEMAT20"
            />
          </Fld>
          <Fld label="Nama">
            <Input
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              placeholder="Diskon 20%"
            />
          </Fld>
          <Fld label="Tipe">
            <select
              value={draft.type}
              onChange={(e) => setDraft({ ...draft, type: e.target.value as Promo["type"] })}
              className="flex h-11 w-full rounded-lg border border-input bg-background px-3 text-sm"
            >
              {Object.entries(TYPE_LABEL).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </Fld>
          <Fld
            label={
              draft.type === "percentage"
                ? "Nilai (%)"
                : draft.type === "fixed"
                  ? "Nilai (Rp)"
                  : draft.type === "trial"
                    ? "Durasi (hari)"
                    : "Nilai (—)"
            }
          >
            <Input
              type="number"
              value={draft.value}
              onChange={(e) => setDraft({ ...draft, value: e.target.value })}
              placeholder="20"
              disabled={draft.type === "upgrade"}
            />
          </Fld>
          <Fld label="Maks. pemakaian (kosong = ∞)">
            <Input
              type="number"
              value={draft.max_usage}
              onChange={(e) => setDraft({ ...draft, max_usage: e.target.value })}
              placeholder="100"
            />
          </Fld>
          <Fld label="Per user">
            <Input
              type="number"
              value={draft.per_user_limit}
              onChange={(e) => setDraft({ ...draft, per_user_limit: e.target.value })}
            />
          </Fld>
          <Fld label="Berakhir (opsional)">
            <Input
              type="date"
              value={draft.ends_at}
              onChange={(e) => setDraft({ ...draft, ends_at: e.target.value })}
            />
          </Fld>
        </div>
        <Button className="mt-3" onClick={create} disabled={saving} size="sm">
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
          Buat
        </Button>
      </section>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center p-6 text-sm text-muted-foreground">
          <Loader2 className="mr-2 size-4 animate-spin" /> Memuat…
        </div>
      ) : codes.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          Belum ada kode promo.
        </p>
      ) : (
        <div className="space-y-2">
          {codes.map((p) => (
            <div
              key={p.id}
              className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-background/40 p-3"
            >
              <code className="rounded bg-banana/15 px-2 py-0.5 font-mono text-sm font-bold text-banana">
                {p.code}
              </code>
              <span className="text-xs text-muted-foreground">{TYPE_LABEL[p.type]}</span>
              <span className="text-xs">
                {p.type === "fixed"
                  ? `Rp${p.value.toLocaleString("id-ID")}`
                  : p.type === "percentage"
                    ? `${p.value}%`
                    : p.type === "trial"
                      ? `${p.value} hari`
                      : "lifetime"}
              </span>
              <span className="text-xs text-muted-foreground">
                {p.used}
                {p.max_usage != null ? `/${p.max_usage}` : ""} dipakai
              </span>
              <div className="ml-auto flex items-center gap-2">
                <button
                  onClick={() => toggle(p)}
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    p.active
                      ? "bg-emerald-500/15 text-emerald-500"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {p.active ? "Aktif" : "Nonaktif"}
                </button>
                <Button variant="ghost" size="sm" onClick={() => remove(p)} aria-label="Hapus">
                  <Trash2 className="size-4 text-red-500" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Fld({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
