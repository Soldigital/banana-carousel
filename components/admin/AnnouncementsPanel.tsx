"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Announcement } from "@/lib/data/settings";

// Extracted verbatim from the former app/admin/AdminClient.tsx
// `AnnouncementTab` — logic unchanged, only relocated to /admin/announcements.
export function AnnouncementsPanel({ current }: { current: Announcement | null }) {
  const router = useRouter();
  const [title, setTitle] = React.useState(current?.title ?? "");
  const [message, setMessage] = React.useState(current?.message ?? "");
  const [active, setActive] = React.useState(current?.active ?? false);
  const [busy, setBusy] = React.useState(false);

  async function save() {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/announcement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, message, active }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast.success("Pengumuman disimpan.");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-md space-y-3 rounded-2xl border border-border bg-card/40 p-6">
      <p className="text-sm text-muted-foreground">
        Banner pengumuman (mis. maintenance) tampil di dashboard & generator saat
        aktif.
      </p>
      <div className="space-y-1.5">
        <Label htmlFor="an-title">Judul</Label>
        <Input id="an-title" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="an-msg">Pesan</Label>
        <Textarea id="an-msg" rows={3} value={message} onChange={(e) => setMessage(e.target.value)} />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={active}
          onChange={(e) => setActive(e.target.checked)}
          className="size-4"
        />
        Aktifkan banner
      </label>
      <Button onClick={save} disabled={busy} className="w-full">
        {busy ? <Loader2 className="size-4 animate-spin" /> : <Megaphone className="size-4" />}
        Simpan Pengumuman
      </Button>
    </div>
  );
}
