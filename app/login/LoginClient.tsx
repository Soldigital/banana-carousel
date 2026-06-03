"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, LogIn, Mail } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createClient } from "@/lib/supabase/client";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { normalizeEmail } from "@/lib/config/app";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export function LoginClient() {
  const params = useSearchParams();
  const redirectTo = params.get("redirect") || "/dashboard";
  const configured = hasSupabaseEnv();
  const supabase = React.useMemo(
    () => (configured ? createClient() : null),
    [configured],
  );

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const callbackUrl = React.useMemo(() => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirectTo)}`;
  }, [redirectTo]);

  function validEmail() {
    const clean = normalizeEmail(email);
    if (!EMAIL_RE.test(clean)) {
      toast.error("Masukkan email yang valid.");
      return null;
    }
    return clean;
  }

  async function handleSignIn() {
    const clean = validEmail();
    if (!clean || !supabase) return;
    if (!password) return toast.error("Masukkan password.");
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: clean,
        password,
      });
      if (error) throw error;
      toast.success("Berhasil masuk.");
      // Full navigation so the new session cookie is read server-side.
      window.location.assign(redirectTo);
      return;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal masuk.");
    } finally {
      setBusy(false);
    }
  }

  async function handleMagicLink() {
    const clean = validEmail();
    if (!clean || !supabase) return;
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: clean,
        options: { emailRedirectTo: callbackUrl },
      });
      if (error) throw error;
      toast.success("Tautan masuk dikirim ke email Anda.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengirim tautan.");
    } finally {
      setBusy(false);
    }
  }

  if (!configured) {
    return (
      <div className="mx-auto max-w-md rounded-3xl border border-border p-8 text-center text-muted-foreground">
        Sistem akun belum dikonfigurasi. Hubungi admin.
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
        Masuk ke Banana Carousel
      </h1>
      <p className="mt-2 text-center text-sm text-muted-foreground">
        Akses dashboard, riwayat carousel, & status lisensi Anda.
      </p>

      <Tabs defaultValue="signin" className="mt-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="signin">Masuk</TabsTrigger>
          <TabsTrigger value="magic">Magic Link</TabsTrigger>
        </TabsList>

        <div className="mt-5 space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="login-email">Email</Label>
            <Input
              id="login-email"
              type="email"
              inputMode="email"
              placeholder="kamu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <TabsContent value="signin" className="mt-0 space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="login-password">Password</Label>
              <Input
                id="login-password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                onKeyDown={(e) => e.key === "Enter" && handleSignIn()}
              />
            </div>
            <Button className="w-full" onClick={handleSignIn} disabled={busy}>
              {busy ? <Loader2 className="size-4 animate-spin" /> : <LogIn className="size-4" />}
              Masuk
            </Button>
          </TabsContent>

          <TabsContent value="magic" className="mt-0 space-y-3">
            <p className="text-xs text-muted-foreground">
              Kami kirim tautan masuk ke email Anda — tanpa password.
            </p>
            <Button className="w-full" onClick={handleMagicLink} disabled={busy}>
              {busy ? <Loader2 className="size-4 animate-spin" /> : <Mail className="size-4" />}
              Kirim Tautan Masuk
            </Button>
          </TabsContent>
        </div>
      </Tabs>
    </motion.div>
  );
}
