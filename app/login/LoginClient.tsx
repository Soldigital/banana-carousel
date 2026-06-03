"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { KeyRound, Loader2, LogIn, Mail } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

  const [tab, setTab] = React.useState("signin");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [licenseKey, setLicenseKey] = React.useState("");
  const [forgot, setForgot] = React.useState(false);
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
      window.location.assign(redirectTo);
      return;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal masuk.");
    } finally {
      setBusy(false);
    }
  }

  async function handleForgot() {
    const clean = validEmail();
    if (!clean || !supabase) return;
    setBusy(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(clean, {
        redirectTo: `${window.location.origin}/auth/callback?redirect=/reset-password`,
      });
      if (error) throw error;
      toast.success("Link reset password dikirim ke email Anda.");
      setForgot(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengirim link.");
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

  async function handleLicenseLogin() {
    const key = licenseKey.trim();
    if (!key) return toast.error("Tempel license key Anda dulu.");
    setBusy(true);
    try {
      const res = await fetch("/api/auth/license-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ licenseKey: key }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Gagal masuk.");
      toast.success("Berhasil masuk dengan license key.");
      window.location.assign("/dashboard");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal masuk.");
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

      <Tabs value={tab} onValueChange={setTab} className="mt-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="signin">Masuk</TabsTrigger>
          <TabsTrigger value="magic">Magic Link</TabsTrigger>
          <TabsTrigger value="license">License Key</TabsTrigger>
        </TabsList>

        <div className="mt-5 space-y-3">
          {tab !== "license" && (
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
          )}

          <TabsContent value="signin" className="mt-0 space-y-3">
            {forgot ? (
              <>
                <p className="text-xs text-muted-foreground">
                  Masukkan email Anda, kami kirim link untuk atur ulang password.
                </p>
                <Button className="w-full" onClick={handleForgot} disabled={busy}>
                  {busy ? <Loader2 className="size-4 animate-spin" /> : <Mail className="size-4" />}
                  Kirim Link Reset
                </Button>
                <button
                  type="button"
                  onClick={() => setForgot(false)}
                  className="w-full text-center text-xs text-muted-foreground hover:underline"
                >
                  ← Kembali ke login
                </button>
              </>
            ) : (
              <>
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
                <button
                  type="button"
                  onClick={() => setForgot(true)}
                  className="w-full text-center text-xs text-banana hover:underline"
                >
                  Lupa password?
                </button>
              </>
            )}
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

          <TabsContent value="license" className="mt-0 space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="login-key">License Key</Label>
              <Textarea
                id="login-key"
                rows={3}
                placeholder="Tempel license key dari email pembelian Anda"
                value={licenseKey}
                onChange={(e) => setLicenseKey(e.target.value)}
                className="font-mono text-xs"
              />
            </div>
            <Button className="w-full" onClick={handleLicenseLogin} disabled={busy}>
              {busy ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
              Masuk dengan Key
            </Button>
            <p className="text-xs text-muted-foreground">
              Kami akan masuk ke akun pada email yang terdaftar di key tersebut.
            </p>
          </TabsContent>
        </div>
      </Tabs>
    </motion.div>
  );
}
