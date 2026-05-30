"use client";

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { GeneratorForm } from "@/components/generator/GeneratorForm";
import { OutputViewer } from "@/components/generator/OutputViewer";
import { ApiKeyBanner } from "@/components/api-key/ApiKeyBanner";
import {
  ApiKeyModal,
  useApiKeyHydration,
} from "@/components/api-key/ApiKeyModal";
import { LicenseGate } from "@/components/license/LicenseGate";
import { useFormStore } from "@/lib/store/form-store";

export function GenerateClient() {
  useApiKeyHydration();
  const output = useFormStore((s) => s.output);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container max-w-3xl py-6 sm:py-10 space-y-6">
        <LicenseGate>
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

          <div className="mt-6 space-y-6">
            <ApiKeyBanner />
            <GeneratorForm />

            {output && (
              <div className="pt-4">
                <OutputViewer output={output} />
              </div>
            )}
          </div>
        </LicenseGate>
      </main>
      <Footer />
      <ApiKeyModal />
    </div>
  );
}
