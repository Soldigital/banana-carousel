"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { TutorialConfig } from "@/lib/data/settings";

// Extracted verbatim from the former app/admin/AdminClient.tsx `TutorialTab`
// — logic unchanged, only relocated to /admin/tutorials.
export function TutorialsPanel({ current }: { current: TutorialConfig }) {
  const router = useRouter();
  const [youtubeId, setYoutubeId] = React.useState(current.youtubeId);
  const [steps, setSteps] = React.useState(
    current.steps.length ? current.steps : [{ title: "", body: "" }],
  );
  const [busy, setBusy] = React.useState(false);

  function update(i: number, field: "title" | "body", val: string) {
    setSteps((s) => s.map((x, idx) => (idx === i ? { ...x, [field]: val } : x)));
  }
  function addStep() {
    setSteps((s) => [...s, { title: "", body: "" }]);
  }
  function removeStep(i: number) {
    setSteps((s) => s.filter((_, idx) => idx !== i));
  }

  async function save() {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/tutorial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ youtubeId, steps }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast.success("Tutorial diperbarui.");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-4 rounded-2xl border border-border bg-card/40 p-6">
      <div className="space-y-1.5">
        <Label htmlFor="tut-yt">YouTube Video ID</Label>
        <Input
          id="tut-yt"
          placeholder="contoh: L6A0Kh0Iz0U"
          value={youtubeId}
          onChange={(e) => setYoutubeId(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          ID saja (bagian setelah watch?v= atau youtu.be/).
        </p>
      </div>

      <div className="space-y-3">
        <Label>Langkah Tutorial</Label>
        {steps.map((s, i) => (
          <div key={i} className="space-y-2 rounded-lg border border-border p-3">
            <div className="flex items-center gap-2">
              <Input
                placeholder={`Judul langkah ${i + 1}`}
                value={s.title}
                onChange={(e) => update(i, "title", e.target.value)}
              />
              <Button
                size="icon"
                variant="ghost"
                onClick={() => removeStep(i)}
                aria-label="Hapus langkah"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
            <Textarea
              rows={2}
              placeholder="Isi langkah"
              value={s.body}
              onChange={(e) => update(i, "body", e.target.value)}
            />
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={addStep}>
          <Plus className="size-4" /> Tambah Langkah
        </Button>
      </div>

      <Button onClick={save} disabled={busy} className="w-full">
        {busy ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
        Simpan Tutorial
      </Button>
    </div>
  );
}
