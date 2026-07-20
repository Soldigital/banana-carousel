"use client";

import { GeneratorForm } from "@/components/generator/GeneratorForm";
import { OutputViewer } from "@/components/generator/OutputViewer";
import { ApiKeyBanner } from "@/components/api-key/ApiKeyBanner";
import { useApiKeyHydration } from "@/components/api-key/ApiKeyModal";
import { LicenseGate } from "@/components/license/LicenseGate";
import { useFormStore } from "@/lib/store/form-store";

// Chrome (Header/Footer/AnnouncementBanner/ApiKeyModal) now comes from the
// shared dashboard shell (app/(dashboard)/generate/page.tsx) — this component
// keeps only the generator-specific content, logic unchanged otherwise.
export function GenerateClient() {
  useApiKeyHydration();
  const output = useFormStore((s) => s.output);

  return (
    <LicenseGate>
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="space-y-2">
          <p className="text-xs font-bold tracking-[0.2em] text-banana">
            CAROUSEL GENERATOR
          </p>
          <h1 className="font-display font-bold text-3xl sm:text-4xl tracking-tight leading-tight">
            Beri tahu kami soal konten Anda.
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-xl">
            Semakin spesifik, semakin viral hasilnya. AI akan menyusun
            storyline, hook, CTA, dan visual direction yang konsisten.
          </p>
        </div>

        <div className="space-y-6">
          <ApiKeyBanner />
          <GeneratorForm />

          {output && (
            <div className="pt-4">
              <OutputViewer output={output} />
            </div>
          )}
        </div>
      </div>
    </LicenseGate>
  );
}
