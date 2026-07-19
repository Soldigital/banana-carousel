"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { KeyRound, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export function ResetPasswordClient() {
  const supabase = React.useMemo(
    () => (hasSupabaseEnv() ? createClient() : null),
    [],
  );
  const [ready, setReady] = React.useState(false);
  const [hasSession, setHasSession] = React.useState(false);
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (!supabase) {
      setReady(true);
      return;
    }
    supabase.auth.getUser().then(({ data }) => {
      setHasSession(!!data.user);
      setReady(true);
    });
  }, [supabase]);

  async function save() {
    if (!supabase) return;
    if (password.length < 6) return toast.error("Password minimal 6 karakter.");
    if (password !== confirm) return toast.error("Konfirmasi password tidak cocok.");
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Password berhasil diubah.");
      window.location.assign("/dashboard");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengubah password.");
      setBusy(false);
    }
  }

  if (!ready) {
    return (
      <div className="py-16 text-center text-muted-foreground">
        <Loader2 className="mx-auto size-5 animate-spin" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-md rounded-3xl border border-border bg-card/40 p-6 sm:p-8"
    >
      <h1 className="font-display text-2xl font-bold text-center">
        Atur Ulang Password
      </h1>

      {!hasSession ? (
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Link reset tidak valid atau sudah kedaluwarsa. Silakan minta link baru
          dari halaman <a href="/login" className="text-banana hover:underline">Masuk → Lupa password</a>.
        </p>
      ) : (
        <div className="mt-6 space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="rp-pass">Password Baru (min. 6 karakter)</Label>
            <Input
              id="rp-pass"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="rp-confirm">Konfirmasi Password</Label>
            <Input
              id="rp-confirm"
              type="password"
              placeholder="••••••••"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              onKeyDown={(e) => e.key === "Enter" && save()}
            />
          </div>
          <Button className="w-full" onClick={save} disabled={busy}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
            Simpan Password Baru
          </Button>
        </div>
      )}
    </motion.div>
  );
}
