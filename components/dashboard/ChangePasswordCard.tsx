"use client";

import * as React from "react";
import { KeyRound, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

// Extracted verbatim from the former app/dashboard/DashboardClient.tsx
// inline `ChangePassword` function — logic unchanged, only relocated.
export function ChangePasswordCard() {
  const supabase = React.useMemo(() => createClient(), []);
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  async function save() {
    if (password.length < 6) return toast.error("Password minimal 6 karakter.");
    if (password !== confirm) return toast.error("Konfirmasi tidak cocok.");
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Password berhasil diubah.");
      setPassword("");
      setConfirm("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal mengubah password.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl border border-border bg-card/40 p-6">
      <h2 className="font-display text-lg font-semibold">Ganti Password</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Atur password agar bisa login cepat via tab Masuk.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="cp-pass">Password Baru</Label>
          <Input
            id="cp-pass"
            type="password"
            placeholder="min. 6 karakter"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cp-confirm">Konfirmasi</Label>
          <Input
            id="cp-confirm"
            type="password"
            placeholder="ulangi password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
            onKeyDown={(e) => e.key === "Enter" && save()}
          />
        </div>
      </div>
      <Button className="mt-3" onClick={save} disabled={busy}>
        {busy ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <KeyRound className="size-4" />
        )}
        Simpan Password
      </Button>
    </section>
  );
}
