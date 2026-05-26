"use client";

import { KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUIStore } from "@/lib/store/ui-store";

export function ApiKeyBanner() {
  const hasKey = useUIStore((s) => s.hasApiKey);
  const openModal = useUIStore((s) => s.openApiKeyModal);

  if (hasKey) return null;

  return (
    <div className="rounded-2xl border border-banana/40 bg-banana/5 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
      <div className="flex items-center gap-3">
        <div className="size-10 rounded-xl bg-banana/15 flex items-center justify-center shrink-0">
          <KeyRound className="size-5 text-banana" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm sm:text-base">
            API Key Gemini diperlukan
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Gratis di Google AI Studio. Disimpan terenkripsi di browser Anda.
          </p>
        </div>
      </div>
      <Button
        onClick={openModal}
        size="sm"
        className="sm:ml-auto whitespace-nowrap"
      >
        Tambahkan API Key
      </Button>
    </div>
  );
}
