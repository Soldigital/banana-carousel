"use client";

import * as React from "react";
import {
  Palette,
  Plus,
  Pencil,
  Trash2,
  Upload,
  Loader2,
  ImageIcon,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { STYLE_PRESETS } from "@/lib/prompts/style-presets";
import { uploadLogo, logoPublicUrl, removeLogo } from "@/lib/brand/logo";
import type { BrandProfile } from "@/types/db";

const CTA_OPTIONS = [
  { value: "", label: "—" },
  { value: "engagement", label: "Engagement" },
  { value: "follow", label: "Follow" },
  { value: "save", label: "Save" },
  { value: "share", label: "Share" },
  { value: "comment", label: "Comment" },
  { value: "dm", label: "DM" },
  { value: "link", label: "Link" },
];

type Draft = {
  name: string;
  website: string;
  instagram_username: string;
  account_name: string;
  cta_style: string;
  brand_color: string;
  default_style_preset_id: string;
  logo_path: string | null;
};

const EMPTY_DRAFT: Draft = {
  name: "",
  website: "",
  instagram_username: "",
  account_name: "",
  cta_style: "",
  brand_color: "",
  default_style_preset_id: "",
  logo_path: null,
};

function toDraft(p: BrandProfile): Draft {
  return {
    name: p.name ?? "",
    website: p.website ?? "",
    instagram_username: p.instagram_username ?? "",
    account_name: p.account_name ?? "",
    cta_style: p.cta_style ?? "",
    brand_color: p.brand_color ?? "",
    default_style_preset_id: p.default_style_preset_id ?? "",
    logo_path: p.logo_path ?? null,
  };
}

export function BrandProfilesPanel() {
  const [profiles, setProfiles] = React.useState<BrandProfile[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [editing, setEditing] = React.useState<BrandProfile | "new" | null>(null);
  const [draft, setDraft] = React.useState<Draft>(EMPTY_DRAFT);
  const [saving, setSaving] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<BrandProfile | null>(null);
  const fileRef = React.useRef<HTMLInputElement>(null);

  const load = React.useCallback(() => {
    setLoading(true);
    fetch("/api/brand-profiles")
      .then((r) => r.json())
      .then((d) => setProfiles(d.profiles ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);
  React.useEffect(load, [load]);

  function startCreate() {
    setDraft(EMPTY_DRAFT);
    setEditing("new");
  }
  function startEdit(p: BrandProfile) {
    setDraft(toDraft(p));
    setEditing(p);
  }
  function cancel() {
    setEditing(null);
    setDraft(EMPTY_DRAFT);
  }

  async function onUploadLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const path = await uploadLogo(file, "profile");
      setDraft((d) => ({ ...d, logo_path: path }));
      toast.success("Logo terpasang. Jangan lupa simpan.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal upload logo.");
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    if (!draft.name.trim()) {
      toast.error("Nama brand wajib diisi.");
      return;
    }
    setSaving(true);
    try {
      const isNew = editing === "new";
      const res = await fetch(
        isNew ? "/api/brand-profiles" : `/api/brand-profiles/${(editing as BrandProfile).id}`,
        {
          method: isNew ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(draft),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan.");
      toast.success(isNew ? "Brand profile dibuat." : "Brand profile diperbarui.");
      cancel();
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan.");
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    const target = deleteTarget;
    if (!target) return;
    setDeleteTarget(null);
    setProfiles((prev) => prev.filter((p) => p.id !== target.id)); // optimistic
    const res = await fetch(`/api/brand-profiles/${target.id}`, { method: "DELETE" });
    if (res.ok) {
      void removeLogo(target.logo_path);
      toast.success("Brand profile dihapus.");
    } else {
      toast.error("Gagal menghapus.");
      load();
    }
  }

  const draftLogoUrl = logoPublicUrl(draft.logo_path);

  return (
    <section className="rounded-2xl border border-border bg-card/40 p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Palette className="size-5 text-banana" />
          <h2 className="font-display text-lg font-semibold">Brand Profile</h2>
        </div>
        {editing === null && (
          <Button size="sm" onClick={startCreate}>
            <Plus className="size-4" />
            Tambah
          </Button>
        )}
      </div>

      {editing !== null ? (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Nama Brand *">
              <Input
                value={draft.name}
                onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                placeholder="Cuan Academy"
              />
            </Field>
            <Field label="Username Instagram">
              <Input
                value={draft.instagram_username}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, instagram_username: e.target.value }))
                }
                placeholder="@cuan.academy"
              />
            </Field>
            <Field label="Nama Akun">
              <Input
                value={draft.account_name}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, account_name: e.target.value }))
                }
                placeholder="Cuan Academy Official"
              />
            </Field>
            <Field label="Website">
              <Input
                value={draft.website}
                onChange={(e) => setDraft((d) => ({ ...d, website: e.target.value }))}
                placeholder="https://cuan.academy"
              />
            </Field>
            <Field label="Brand Color">
              <Input
                value={draft.brand_color}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, brand_color: e.target.value }))
                }
                placeholder="Hitam, kuning, oranye"
              />
            </Field>
            <Field label="CTA Default">
              <select
                value={draft.cta_style}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, cta_style: e.target.value }))
                }
                className="flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              >
                {CTA_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Style Default">
              <select
                value={draft.default_style_preset_id}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, default_style_preset_id: e.target.value }))
                }
                className="flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">—</option>
                {STYLE_PRESETS.filter((p) => !p.hidden).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          {/* Default logo */}
          <Field label="Logo Default">
            <div className="flex items-center gap-3">
              <div className="flex size-16 items-center justify-center overflow-hidden rounded-lg border border-border bg-background">
                {draftLogoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={draftLogoUrl} alt="Logo" className="size-full object-contain" />
                ) : (
                  <ImageIcon className="size-6 text-muted-foreground" />
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={uploading}
                onClick={() => fileRef.current?.click()}
              >
                {uploading ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Upload className="size-3.5" />
                )}
                Upload Logo
              </Button>
              {draft.logo_path && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setDraft((d) => ({ ...d, logo_path: null }))}
                >
                  <X className="size-3.5" />
                  Hapus
                </Button>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onUploadLogo}
              />
            </div>
          </Field>

          <div className="flex gap-2">
            <Button onClick={save} disabled={saving}>
              {saving && <Loader2 className="size-4 animate-spin" />}
              Simpan
            </Button>
            <Button variant="outline" onClick={cancel} disabled={saving}>
              Batal
            </Button>
          </div>
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center p-6 text-sm text-muted-foreground">
          <Loader2 className="mr-2 size-4 animate-spin" /> Memuat…
        </div>
      ) : profiles.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          Belum ada brand profile. Tambahkan untuk mengisi logo, warna, dan style
          brand Anda secara otomatis saat generate.
        </p>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {profiles.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-3 rounded-xl border border-border bg-background/40 p-3"
            >
              <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-background">
                {p.logo_path ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logoPublicUrl(p.logo_path) ?? ""}
                    alt={p.name}
                    className="size-full object-contain"
                  />
                ) : (
                  <ImageIcon className="size-5 text-muted-foreground" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{p.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {p.instagram_username || p.website || "—"}
                </p>
              </div>
              <Button variant="ghost" size="sm" aria-label="Edit" onClick={() => startEdit(p)}>
                <Pencil className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                aria-label="Hapus"
                onClick={() => setDeleteTarget(p)}
              >
                <Trash2 className="size-4 text-red-500" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={deleteTarget !== null} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus brand profile?</DialogTitle>
            <DialogDescription>
              <span className="font-semibold">{deleteTarget?.name}</span> akan
              dihapus. Carousel yang sudah dibuat tidak terpengaruh.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Batal
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              <Trash2 className="size-4" />
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
