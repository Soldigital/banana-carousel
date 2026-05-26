"use client";

import * as React from "react";
import { Eye, EyeOff, ExternalLink, ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUIStore } from "@/lib/store/ui-store";
import {
  clearApiKey,
  hasApiKey,
  loadApiKey,
  saveApiKey,
} from "@/lib/storage/api-key";

export function ApiKeyModal() {
  const open = useUIStore((s) => s.apiKeyModalOpen);
  const setOpen = useUIStore((s) => s.closeApiKeyModal);
  const setHasKey = useUIStore((s) => s.setHasApiKey);
  const [value, setValue] = React.useState("");
  const [showKey, setShowKey] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [keyExists, setKeyExists] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setKeyExists(hasApiKey());
      setValue("");
      setShowKey(false);
    }
  }, [open]);

  async function handleSave() {
    const trimmed = value.trim();
    if (!trimmed) {
      toast.error("API key tidak boleh kosong.");
      return;
    }
    if (trimmed.length < 20) {
      toast.error("API key Gemini biasanya lebih panjang. Cek lagi.");
      return;
    }
    setSaving(true);
    try {
      await saveApiKey(trimmed);
      setHasKey(true);
      toast.success("API key tersimpan & terenkripsi di browser Anda.");
      setOpen();
    } catch (err) {
      console.error(err);
      toast.error("Gagal menyimpan API key. Coba lagi.");
    } finally {
      setSaving(false);
    }
  }

  function handleClear() {
    clearApiKey();
    setHasKey(false);
    setKeyExists(false);
    setValue("");
    toast.success("API key dihapus dari browser.");
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && setOpen()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <ShieldCheck className="size-5 text-banana" />
            Gemini API Key
          </DialogTitle>
          <DialogDescription>
            Banana Carousel pakai API key Gemini Anda sendiri. Key disimpan
            terenkripsi (AES-GCM) di browser Anda — tidak pernah dikirim ke
            server kami.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <Label htmlFor="api-key">API Key</Label>
          <div className="relative">
            <Input
              id="api-key"
              type={showKey ? "text" : "password"}
              placeholder="AIza..."
              value={value}
              onChange={(e) => setValue(e.target.value)}
              autoFocus
              className="pr-10 font-mono"
            />
            <button
              type="button"
              onClick={() => setShowKey((s) => !s)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
              aria-label={showKey ? "Hide key" : "Show key"}
            >
              {showKey ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </button>
          </div>

          <a
            href="https://aistudio.google.com/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-banana hover:underline"
          >
            Dapatkan API key gratis di Google AI Studio
            <ExternalLink className="size-3" />
          </a>

          <div className="rounded-lg border border-border bg-secondary/50 p-3 text-xs text-muted-foreground space-y-1.5">
            <p>
              <span className="font-semibold text-foreground">Keamanan:</span>{" "}
              Key dienkripsi sebelum disimpan ke <code>localStorage</code>.
            </p>
            <p>
              <span className="font-semibold text-foreground">Privasi:</span>{" "}
              Hindari pakai di komputer publik. Klik &quot;Hapus Key&quot; saat
              selesai.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          {keyExists && (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleClear}
              className="sm:mr-auto"
            >
              <Trash2 className="size-4" />
              Hapus Key
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen()}
            disabled={saving}
          >
            Batal
          </Button>
          <Button type="button" onClick={handleSave} disabled={saving}>
            {saving ? "Menyimpan..." : "Simpan API Key"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function useApiKeyHydration() {
  const setHasKey = useUIStore((s) => s.setHasApiKey);
  React.useEffect(() => {
    setHasKey(hasApiKey());
  }, [setHasKey]);
}

export async function getApiKeyOrPrompt(): Promise<string | null> {
  const key = await loadApiKey();
  return key;
}
