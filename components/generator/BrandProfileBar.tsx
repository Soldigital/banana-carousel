"use client";

import * as React from "react";
import Link from "next/link";
import { ImageIcon, Upload, Loader2, X, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useFormStore } from "@/lib/store/form-store";
import { uploadLogo, logoPublicUrl } from "@/lib/brand/logo";
import type { BrandProfile } from "@/types/db";

export function BrandProfileBar() {
  const f = useFormStore();
  const selectBrandProfile = useFormStore((s) => s.selectBrandProfile);
  const setField = useFormStore((s) => s.setField);

  const [profiles, setProfiles] = React.useState<BrandProfile[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [uploading, setUploading] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    fetch("/api/brand-profiles")
      .then((r) => r.json())
      .then((d) => setProfiles(d.profiles ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const selected = profiles.find((p) => p.id === f.brandProfileId) ?? null;

  // Effective logo per the priority rule: override > profile default > none.
  const effectivePath =
    f.logoMode === "custom"
      ? f.logoOverridePath
      : f.logoMode === "default"
        ? selected?.logo_path ?? null
        : null;
  const previewUrl = logoPublicUrl(effectivePath);
  const badge =
    f.logoMode === "custom" && f.logoOverridePath
      ? "CUSTOM"
      : f.logoMode === "default" && selected?.logo_path
        ? "DEFAULT"
        : null;

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const path = await uploadLogo(file, "override", f.logoOverridePath);
      setField("logoOverridePath", path);
      setField("logoMode", "custom");
      toast.success("Logo khusus untuk project ini dipasang.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal upload logo.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-border bg-card/40 p-4 space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="brand-profile">Brand Profile</Label>
          <select
            id="brand-profile"
            value={f.brandProfileId ?? ""}
            onChange={(e) =>
              selectBrandProfile(
                profiles.find((p) => p.id === e.target.value) ?? null,
              )
            }
            disabled={loading}
            className="flex h-11 min-w-[200px] rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">Tanpa brand profile</option>
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <Link
          href="/dashboard"
          className="text-xs font-semibold text-banana hover:underline"
        >
          Kelola brand profile →
        </Link>
      </div>

      {/* Logo area */}
      <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-background/40 p-3">
        <div className="relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-background">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt="Logo brand"
              className="size-full object-contain"
            />
          ) : (
            <ImageIcon className="size-6 text-muted-foreground" />
          )}
          {badge && (
            <span className="absolute bottom-0 left-0 right-0 bg-black/60 py-0.5 text-center text-[9px] font-bold text-white">
              {badge}
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">
            {f.logoMode === "none"
              ? "Tanpa logo"
              : effectivePath
                ? f.logoMode === "custom"
                  ? "Logo khusus project ini"
                  : "Logo default dari brand profile"
                : "Belum ada logo"}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!selected?.logo_path}
              onClick={() => {
                setField("logoMode", "default");
                setField("logoOverridePath", null);
              }}
            >
              <RotateCcw className="size-3.5" />
              Logo Default
            </Button>
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
              Upload Logo Baru
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={f.logoMode === "none"}
              onClick={() => {
                setField("logoMode", "none");
                setField("logoOverridePath", null);
              }}
            >
              <X className="size-3.5" />
              Tanpa Logo
            </Button>
          </div>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onUpload}
        />
      </div>

      {/* Username (@watermark) position control — overrides per project. */}
      <div className="grid grid-cols-3 gap-2">
        <UsernameSelect
          label="Posisi @"
          value={f.usernamePosition ?? ""}
          opts={POS_OPTS}
          onChange={(v) =>
            setField("usernamePosition", (v || undefined) as typeof f.usernamePosition)
          }
        />
        <UsernameSelect
          label="Ukuran"
          value={f.usernameSize ?? ""}
          opts={SIZE_OPTS}
          onChange={(v) =>
            setField("usernameSize", (v || undefined) as typeof f.usernameSize)
          }
        />
        <UsernameSelect
          label="Gaya"
          value={f.usernameStyle ?? ""}
          opts={USTYLE_OPTS}
          onChange={(v) =>
            setField("usernameStyle", (v || undefined) as typeof f.usernameStyle)
          }
        />
      </div>
    </section>
  );
}

const POS_OPTS = [
  ["", "Default"],
  ["top-left", "Atas Kiri"],
  ["top-center", "Atas Tengah"],
  ["top-right", "Atas Kanan"],
  ["bottom-left", "Bawah Kiri"],
  ["bottom-center", "Bawah Tengah"],
  ["bottom-right", "Bawah Kanan"],
];
const SIZE_OPTS = [
  ["", "Default"],
  ["small", "Kecil"],
  ["medium", "Sedang"],
  ["large", "Besar"],
];
const USTYLE_OPTS = [
  ["", "Default"],
  ["plain", "Plain"],
  ["minimal", "Minimal"],
  ["rounded", "Rounded"],
  ["premium", "Premium"],
];

function UsernameSelect({
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
    <div className="space-y-1">
      <Label className="text-[10px] text-muted-foreground">{label}</Label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex h-9 w-full rounded-lg border border-input bg-background px-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {opts.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </div>
  );
}
