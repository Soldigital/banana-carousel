"use client";

import { KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUIStore } from "@/lib/store/ui-store";
import { useApiKeyHydration } from "@/components/api-key/ApiKeyModal";

// Extracted verbatim from the former app/dashboard/DashboardClient.tsx
// legacy (non-gateway) API key box — logic unchanged, only relocated.
// Rendered only when USE_GATEWAY is off (single client-side key, no BYOK
// multi-provider rotation).
export function LegacyApiKeyCard() {
  useApiKeyHydration();
  const hasApiKey = useUIStore((s) => s.hasApiKey);
  const openApiKeyModal = useUIStore((s) => s.openApiKeyModal);

  return (
    <section className="rounded-2xl border border-border bg-card/40 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold">API Key Gemini</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {hasApiKey
              ? "API key tersimpan terenkripsi di browser ini."
              : "Belum diatur. Diperlukan untuk men-generate carousel."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              hasApiKey
                ? "bg-emerald-500/15 text-emerald-500"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {hasApiKey ? "Aktif" : "Belum diatur"}
          </span>
          <Button variant="outline" size="sm" onClick={openApiKeyModal}>
            <KeyRound className="size-4" />
            {hasApiKey ? "Ganti / Hapus" : "Atur API Key"}
          </Button>
        </div>
      </div>
    </section>
  );
}
