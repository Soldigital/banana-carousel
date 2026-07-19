"use client";

import * as React from "react";
import Link from "next/link";
import { Rocket, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Shown only to Founding Members. Lets them choose how they appear on the public
// /founders wall (name / username / number-only).
export function FounderControl({ founderNumber }: { founderNumber: number }) {
  const [display, setDisplay] = React.useState("name");
  const [alias, setAlias] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  async function save() {
    setBusy(true);
    try {
      const res = await fetch("/api/account/founder-display", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ display, alias: alias.trim() }),
      });
      if (!res.ok) throw new Error();
      toast.success("Tampilan Founder Wall tersimpan.");
    } catch {
      toast.error("Gagal menyimpan.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl border border-banana/40 bg-banana/5 p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Rocket className="size-5 text-banana" />
          <h2 className="font-display text-lg font-semibold">
            Founding Member #{String(founderNumber).padStart(3, "0")}
          </h2>
        </div>
        <Link href="/founders" className="text-xs font-semibold text-banana hover:underline">
          Lihat Founder Wall →
        </Link>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Atur bagaimana Anda tampil di halaman publik 100 Founding Members.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Tampilkan sebagai</Label>
          <select
            value={display}
            onChange={(e) => setDisplay(e.target.value)}
            className="flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="name">Nama</option>
            <option value="username">Username</option>
            <option value="number">Nomor saja (anonim)</option>
          </select>
        </div>
        {display === "username" && (
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Username</Label>
            <Input
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              placeholder="@brandkamu"
            />
          </div>
        )}
      </div>
      <Button className="mt-3" onClick={save} disabled={busy} size="sm">
        {busy && <Loader2 className="size-4 animate-spin" />}
        Simpan
      </Button>
    </section>
  );
}
