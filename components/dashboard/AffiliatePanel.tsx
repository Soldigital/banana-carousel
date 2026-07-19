"use client";

import * as React from "react";
import { Share2, Loader2, Wallet, Gift } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CopyButton } from "@/components/generator/CopyButton";
import { formatIDR } from "@/lib/config/payment";

interface Affiliate {
  id: string;
  code: string;
  reward_type: "commission" | "bonus";
  commission_rate: number;
  referral_count: number;
  balance: number;
}

export function AffiliatePanel() {
  const [aff, setAff] = React.useState<Affiliate | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState(false);
  const [origin, setOrigin] = React.useState("");

  React.useEffect(() => {
    setOrigin(window.location.origin);
    fetch("/api/affiliate")
      .then((r) => r.json())
      .then((d) => setAff(d.affiliate ?? null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function enroll() {
    setBusy(true);
    try {
      const res = await fetch("/api/affiliate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "enroll" }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setAff(d.affiliate);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal mendaftar.");
    } finally {
      setBusy(false);
    }
  }

  async function setReward(reward_type: "commission" | "bonus", rate: number) {
    if (!aff) return;
    setBusy(true);
    try {
      const res = await fetch("/api/affiliate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reward", reward_type, commission_rate: rate }),
      });
      if (!res.ok) throw new Error();
      setAff({ ...aff, reward_type, commission_rate: rate });
      toast.success("Reward affiliate diperbarui.");
    } catch {
      toast.error("Gagal menyimpan.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return null;

  return (
    <section className="rounded-2xl border border-border bg-card/40 p-6">
      <div className="mb-1 flex items-center gap-2">
        <Share2 className="size-5 text-banana" />
        <h2 className="font-display text-lg font-semibold">Affiliate</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        Ajak teman, dapat komisi atau perpanjangan masa aktif.
      </p>

      {!aff ? (
        <Button className="mt-4" onClick={enroll} disabled={busy} size="sm">
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Share2 className="size-4" />}
          Daftar Affiliate
        </Button>
      ) : (
        <div className="mt-4 space-y-4">
          {/* Referral link */}
          <div>
            <Label className="text-xs text-muted-foreground">Link referral Anda</Label>
            <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-center">
              <code className="block flex-1 overflow-x-auto rounded-lg border border-border bg-background px-3 py-2 font-mono text-xs">
                {origin}/ref/{aff.code}
              </code>
              <CopyButton text={`${origin}/ref/${aff.code}`} label="Salin Link" className="shrink-0" />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-border bg-background/40 p-3">
              <p className="text-xs text-muted-foreground">Referral</p>
              <p className="font-display text-2xl font-bold">{aff.referral_count}</p>
            </div>
            <div className="rounded-lg border border-border bg-background/40 p-3">
              <p className="text-xs text-muted-foreground">
                {aff.reward_type === "commission" ? "Saldo komisi" : "Reward"}
              </p>
              <p className="font-display text-2xl font-bold">
                {aff.reward_type === "commission"
                  ? formatIDR(aff.balance)
                  : `${aff.referral_count * 30} hari`}
              </p>
            </div>
          </div>

          {/* Reward type — pick ONE */}
          <div>
            <Label className="text-xs text-muted-foreground">
              Tipe Reward (pilih salah satu)
            </Label>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <button
                onClick={() => setReward("commission", aff.commission_rate || 0.2)}
                disabled={busy}
                className={`flex items-center gap-2 rounded-xl border p-3 text-left text-sm ${
                  aff.reward_type === "commission"
                    ? "border-banana bg-banana/10"
                    : "border-border bg-background/40"
                }`}
              >
                <Wallet className="size-4 text-banana" />
                <span>
                  <b>Komisi</b> — {Math.round((aff.commission_rate || 0.2) * 100)}% per pembelian
                </span>
              </button>
              <button
                onClick={() => setReward("bonus", aff.commission_rate)}
                disabled={busy}
                className={`flex items-center gap-2 rounded-xl border p-3 text-left text-sm ${
                  aff.reward_type === "bonus"
                    ? "border-banana bg-banana/10"
                    : "border-border bg-background/40"
                }`}
              >
                <Gift className="size-4 text-banana" />
                <span>
                  <b>Bonus Masa Aktif</b> — +30 hari / referral
                </span>
              </button>
            </div>
            {aff.reward_type === "commission" && (
              <div className="mt-2 flex gap-2">
                {[0.2, 0.25, 0.3].map((r) => (
                  <button
                    key={r}
                    onClick={() => setReward("commission", r)}
                    disabled={busy}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${
                      aff.commission_rate === r
                        ? "border-banana bg-banana/10 text-banana"
                        : "border-border"
                    }`}
                  >
                    {Math.round(r * 100)}%
                  </button>
                ))}
              </div>
            )}
            <p className="mt-2 text-xs text-muted-foreground">
              Komisi dibayarkan manual oleh admin. Bonus masa aktif berlaku untuk
              langganan Pro Annual.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
