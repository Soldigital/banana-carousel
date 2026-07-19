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
  Sparkles,
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
import { uploadLogo, logoPublicUrl } from "@/lib/brand/logo";
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
  // Phase A additions
  secondary_color: string;
  target_audience: string;
  tone_of_voice: string;
  default_language: string;
  default_slide_count: string; // kept as string for the input; sent as-is
  username_position: string;
  username_size: string;
  username_style: string;
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
  secondary_color: "",
  target_audience: "",
  tone_of_voice: "",
  default_language: "",
  default_slide_count: "",
  username_position: "",
  username_size: "",
  username_style: "",
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
    secondary_color: p.secondary_color ?? "",
    target_audience: p.target_audience ?? "",
    tone_of_voice: p.tone_of_voice ?? "",
    default_language: p.default_language ?? "",
    default_slide_count:
      p.default_slide_count != null ? String(p.default_slide_count) : "",
    username_position: p.username_position ?? "",
    username_size: p.username_size ?? "",
    username_style: p.username_style ?? "",
  };
}

const POS_OPTS = [
  ["", "—"],
  ["top-left", "Atas Kiri"],
  ["top-center", "Atas Tengah"],
  ["top-right", "Atas Kanan"],
  ["bottom-left", "Bawah Kiri"],
  ["bottom-center", "Bawah Tengah"],
  ["bottom-right", "Bawah Kanan"],
];
const SIZE_OPTS = [
  ["", "—"],
  ["small", "Kecil"],
  ["medium", "Sedang"],
  ["large", "Besar"],
];
const USTYLE_OPTS = [
  ["", "—"],
  ["plain", "Plain"],
  ["minimal", "Minimal Label"],
  ["rounded", "Rounded Badge"],
  ["premium", "Premium Badge"],
];
const LANG_OPTS = [
  ["", "—"],
  ["id", "Indonesia"],
  ["en", "English"],
  ["mix", "Kombinasi (ID/EN)"],
];

export function BrandProfilesPanel() {
  const [profiles, setProfiles] = React.useState<BrandProfile[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [editing, setEditing] = React.useState<BrandProfile | "new" | null>(null);
  const [draft, setDraft] = React.useState<Draft>(EMPTY_DRAFT);
  const [saving, setSaving] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<BrandProfile | null>(null);
  const [dnaBusy, setDnaBusy] = React.useState(false);
  const [dna, setDna] = React.useState<Record<string, string> | null>(null);
  const fileRef = React.useRef<HTMLInputElement>(null);

  async function generateDNA() {
    if (editing === "new" || !editing) return;
    setDnaBusy(true);
    try {
      const res = await fetch("/api/brand-profiles/dna", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId: editing.id }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Gagal.");
      setDna(d.dna);
      setDraft((dr) => ({
        ...dr,
        tone_of_voice: dr.tone_of_voice || d.dna.tone_of_voice || "",
        target_audience: dr.target_audience || d.dna.audience_persona || "",
      }));
      toast.success("Brand DNA dibuat & diisi ke profil.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal generate Brand DNA.");
    } finally {
      setDnaBusy(false);
    }
  }

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
    setDna(null);
    setEditing("new");
  }
  function startEdit(p: BrandProfile) {
    setDraft(toDraft(p));
    setDna((p.brand_dna as Record<string, string> | null) ?? null);
    setEditing(p);
  }
  function cancel() {
    setEditing(null);
    setDraft(EMPTY_DRAFT);
    setDna(null);
  }

  async function onUploadLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const path = await uploadLogo(file, "profile", draft.logo_path);
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
            <Field label="Warna Sekunder">
              <Input
                value={draft.secondary_color}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, secondary_color: e.target.value }))
                }
                placeholder="Putih, abu muda"
              />
            </Field>
            <Field label="Target Audience">
              <Input
                value={draft.target_audience}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, target_audience: e.target.value }))
                }
                placeholder="Anak muda 18-30, urban"
              />
            </Field>
            <Field label="Tone of Voice">
              <Input
                value={draft.tone_of_voice}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, tone_of_voice: e.target.value }))
                }
                placeholder="Santai, kredibel, memotivasi"
              />
            </Field>
            <DraftSelect
              label="Bahasa Default"
              value={draft.default_language}
              opts={LANG_OPTS}
              onChange={(v) => setDraft((d) => ({ ...d, default_language: v }))}
            />
            <Field label="Jumlah Slide Default">
              <Input
                type="number"
                min={3}
                max={10}
                value={draft.default_slide_count}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, default_slide_count: e.target.value }))
                }
                placeholder="7"
              />
            </Field>
            <DraftSelect
              label="Posisi Username"
              value={draft.username_position}
              opts={POS_OPTS}
              onChange={(v) => setDraft((d) => ({ ...d, username_position: v }))}
            />
            <DraftSelect
              label="Ukuran Username"
              value={draft.username_size}
              opts={SIZE_OPTS}
              onChange={(v) => setDraft((d) => ({ ...d, username_size: v }))}
            />
            <DraftSelect
              label="Gaya Username"
              value={draft.username_style}
              opts={USTYLE_OPTS}
              onChange={(v) => setDraft((d) => ({ ...d, username_style: v }))}
            />
          </div>

          {/* AI Brand DNA (Pro) — only for a saved profile */}
          {editing !== "new" && (
            <div className="rounded-xl border border-banana/40 bg-banana/5 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="size-4 text-banana" />
                  <span className="text-sm font-semibold">AI Brand DNA</span>
                  <span className="rounded-full bg-banana/15 px-2 py-0.5 text-[10px] font-bold text-banana">
                    PRO
                  </span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={generateDNA}
                  disabled={dnaBusy}
                >
                  {dnaBusy ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="size-3.5" />
                  )}
                  {dna ? "Generate Ulang" : "Generate Brand DNA"}
                </Button>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Pakai API key Anda sendiri (BYOK). Hasil otomatis mengisi Tone of
                Voice & Target Audience.
              </p>
              {dna && (
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {(
                    [
                      ["Brand Voice", "brand_voice"],
                      ["Tone of Voice", "tone_of_voice"],
                      ["CTA Style", "cta_style"],
                      ["Audience Persona", "audience_persona"],
                      ["Visual Direction", "visual_direction"],
                      ["Content Style", "content_style"],
                    ] as const
                  ).map(([label, key]) => (
                    <div
                      key={key}
                      className="rounded-lg border border-border bg-background/40 p-2"
                    >
                      <p className="text-[10px] font-semibold uppercase text-muted-foreground">
                        {label}
                      </p>
                      <p className="text-xs">{dna[key]}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

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

function DraftSelect({
  label,
  value,
  opts,
  onChange,
}: {
  label: string;
  value: string;
  opts: string[][];
  onChange: (v: string) => void;
}) {
  return (
    <Field label={label}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
      >
        {opts.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </Field>
  );
}
