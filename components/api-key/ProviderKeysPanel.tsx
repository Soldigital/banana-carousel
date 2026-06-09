"use client";

import * as React from "react";
import {
  Activity,
  Loader2,
  Plus,
  Power,
  Trash2,
  Upload,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  PROVIDER_IDS,
  PROVIDER_LABELS,
  PROVIDER_KEY_URLS,
  type ProviderId,
} from "@/lib/ai/types";
import { loadApiKey, hasApiKey, clearApiKey } from "@/lib/storage/api-key";

interface MaskedKey {
  id: string;
  provider: ProviderId;
  label: string | null;
  key_last4: string;
  enabled: boolean;
  created_at: string;
}

interface KeyHealth {
  ok: number;
  err: number;
  successRate: number;
  lastLatencyMs: number;
  lastOk: boolean | null;
  lastCode: string | null;
}

const MAX_PER_PROVIDER = 5;

export function ProviderKeysPanel() {
  const [keys, setKeys] = React.useState<MaskedKey[]>([]);
  const [health, setHealth] = React.useState<Record<string, KeyHealth | null>>(
    {},
  );
  const [loading, setLoading] = React.useState(true);
  const [canImport, setCanImport] = React.useState(false);

  const refresh = React.useCallback(async () => {
    try {
      const res = await fetch("/api/keys");
      const data = await res.json();
      if (res.ok) setKeys(data.keys ?? []);
    } catch {
      /* ignore */
    }
  }, []);

  const refreshHealth = React.useCallback(async () => {
    try {
      const res = await fetch("/api/keys/health");
      const data = await res.json();
      if (res.ok) setHealth(data.health ?? {});
    } catch {
      /* ignore */
    }
  }, []);

  React.useEffect(() => {
    (async () => {
      await refresh();
      await refreshHealth();
      setLoading(false);
    })();
  }, [refresh, refreshHealth]);

  // Offer one-time import of the legacy browser-stored Gemini key.
  React.useEffect(() => {
    if (!loading && hasApiKey()) {
      const hasGemini = keys.some((k) => k.provider === "gemini");
      setCanImport(!hasGemini);
    } else {
      setCanImport(false);
    }
  }, [loading, keys]);

  async function addKey(provider: ProviderId, key: string, label?: string) {
    const res = await fetch("/api/keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider, key, label }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Gagal menyimpan key.");
    await refresh();
  }

  async function importLegacy() {
    try {
      const k = await loadApiKey();
      if (!k) {
        toast.error("Tidak ada key lama di browser ini.");
        setCanImport(false);
        return;
      }
      await addKey("gemini", k, "imported");
      clearApiKey();
      setCanImport(false);
      toast.success("API key lama berhasil dipindahkan ke akun Anda.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal import.");
    }
  }

  async function toggle(id: string, enabled: boolean) {
    setKeys((prev) => prev.map((k) => (k.id === id ? { ...k, enabled } : k)));
    try {
      const res = await fetch(`/api/keys/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });
      if (!res.ok) throw new Error();
    } catch {
      toast.error("Gagal memperbarui status key.");
      await refresh();
    }
  }

  async function remove(id: string) {
    if (!confirm("Hapus API key ini?")) return;
    const prev = keys;
    setKeys((p) => p.filter((k) => k.id !== id));
    try {
      const res = await fetch(`/api/keys/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
    } catch {
      toast.error("Gagal menghapus key.");
      setKeys(prev);
    }
  }

  return (
    <section className="rounded-2xl border border-border bg-card/40 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold">
            API Keys &amp; Provider AI
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Tambahkan API key Anda sendiri (hingga {MAX_PER_PROVIDER} per
            provider). Saat generate, sistem otomatis berpindah key/provider bila
            satu kena limit. Key disimpan terenkripsi.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={refreshHealth}
          title="Refresh status"
        >
          <Activity className="size-4" />
          Status
        </Button>
      </div>

      {canImport && (
        <div className="mt-4 flex flex-col gap-2 rounded-xl border border-banana/40 bg-banana/5 p-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm">
            Terdeteksi API key Gemini lama di browser ini. Pindahkan ke akun Anda
            agar bisa dipakai lintas perangkat?
          </p>
          <Button size="sm" onClick={importLegacy} className="shrink-0">
            <Upload className="size-4" />
            Import Key Lama
          </Button>
        </div>
      )}

      {loading ? (
        <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Memuat keys...
        </div>
      ) : (
        <div className="mt-5 space-y-5">
          {PROVIDER_IDS.map((pid) => (
            <ProviderBlock
              key={pid}
              provider={pid}
              keys={keys.filter((k) => k.provider === pid)}
              health={health}
              onAdd={addKey}
              onToggle={toggle}
              onRemove={remove}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function ProviderBlock({
  provider,
  keys,
  health,
  onAdd,
  onToggle,
  onRemove,
}: {
  provider: ProviderId;
  keys: MaskedKey[];
  health: Record<string, KeyHealth | null>;
  onAdd: (p: ProviderId, key: string, label?: string) => Promise<void>;
  onToggle: (id: string, enabled: boolean) => void;
  onRemove: (id: string) => void;
}) {
  const [value, setValue] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const atMax = keys.length >= MAX_PER_PROVIDER;

  async function submit() {
    if (!value.trim()) return;
    setBusy(true);
    try {
      await onAdd(provider, value.trim());
      setValue("");
      toast.success(`${PROVIDER_LABELS[provider]}: key ditambahkan.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal menambah key.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-background/40 p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold">{PROVIDER_LABELS[provider]}</h3>
          <span className="text-xs text-muted-foreground">
            {keys.length}/{MAX_PER_PROVIDER}
          </span>
        </div>
        <a
          href={PROVIDER_KEY_URLS[provider]}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs font-semibold text-banana hover:underline"
        >
          Dapatkan key <ExternalLink className="size-3" />
        </a>
      </div>

      {keys.length > 0 && (
        <ul className="mt-3 space-y-2">
          {keys.map((k) => {
            const h = health[k.id];
            return (
              <li
                key={k.id}
                className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card/40 px-3 py-2 text-sm"
              >
                <code className="font-mono text-xs text-muted-foreground">
                  ····{k.key_last4}
                </code>
                <span className="text-xs text-muted-foreground">
                  {k.label}
                </span>
                <HealthBadge enabled={k.enabled} health={h} />
                <div className="ml-auto flex items-center gap-1">
                  <button
                    onClick={() => onToggle(k.id, !k.enabled)}
                    title={k.enabled ? "Nonaktifkan" : "Aktifkan"}
                    className={`rounded-md p-1.5 transition-colors hover:bg-muted ${
                      k.enabled ? "text-emerald-500" : "text-muted-foreground"
                    }`}
                  >
                    <Power className="size-4" />
                  </button>
                  <button
                    onClick={() => onRemove(k.id)}
                    title="Hapus"
                    className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {!atMax && (
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <Input
            type="password"
            placeholder={`Tempel API key ${PROVIDER_LABELS[provider]}`}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            className="font-mono text-xs"
          />
          <Button
            variant="outline"
            onClick={submit}
            disabled={busy || !value.trim()}
            className="shrink-0"
          >
            {busy ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Plus className="size-4" />
            )}
            Tambah
          </Button>
        </div>
      )}
    </div>
  );
}

function HealthBadge({
  enabled,
  health,
}: {
  enabled: boolean;
  health: KeyHealth | null | undefined;
}) {
  if (!enabled) {
    return (
      <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
        Nonaktif
      </span>
    );
  }
  if (!health || health.ok + health.err === 0) {
    return (
      <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
        Belum dipakai
      </span>
    );
  }
  const rate = Math.round(health.successRate * 100);
  const good = rate >= 80;
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
        good
          ? "bg-emerald-500/15 text-emerald-500"
          : "bg-amber-500/15 text-amber-500"
      }`}
      title={`${health.ok} sukses / ${health.err} gagal${
        health.lastLatencyMs ? ` · ${health.lastLatencyMs}ms` : ""
      }${health.lastCode ? ` · ${health.lastCode}` : ""}`}
    >
      {rate}% ok
      {health.lastLatencyMs ? ` · ${health.lastLatencyMs}ms` : ""}
    </span>
  );
}
