"use client";

import * as React from "react";
import { Sparkles, Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { StylePresetGrid } from "./StylePresetGrid";
import { SlideCountSlider } from "./SlideCountSlider";
import { SegmentedControl } from "./SegmentedControl";
import { useFormStore } from "@/lib/store/form-store";
import { useUIStore } from "@/lib/store/ui-store";
import { loadApiKey, hasApiKey } from "@/lib/storage/api-key";
import { generateCarousel, GeminiError } from "@/lib/gemini/generate-carousel";
import type { CtaStyle, Language } from "@/types/carousel";

const CTA_OPTIONS: { value: CtaStyle; label: string }[] = [
  { value: "engagement", label: "Engagement" },
  { value: "follow", label: "Follow" },
  { value: "save", label: "Save" },
  { value: "share", label: "Share" },
  { value: "comment", label: "Comment" },
  { value: "dm", label: "DM" },
  { value: "link", label: "Link" },
];

export function GeneratorForm() {
  const f = useFormStore();
  const openApiModal = useUIStore((s) => s.openApiKeyModal);
  const setHasKey = useUIStore((s) => s.setHasApiKey);

  async function handleGenerate() {
    if (!f.topic.trim()) {
      toast.error("Isi minimal topik konten dulu.");
      return;
    }
    if (!f.audience.trim()) {
      toast.error("Isi target audience.");
      return;
    }
    if (!hasApiKey()) {
      toast.info("Masukkan API key Gemini Anda dulu.");
      openApiModal();
      return;
    }

    f.setIsGenerating(true);
    f.setError(null);
    f.setOutput(null);

    try {
      const apiKey = await loadApiKey();
      if (!apiKey) {
        toast.error("API key tidak ditemukan. Masukkan ulang.");
        setHasKey(false);
        openApiModal();
        f.setIsGenerating(false);
        return;
      }

      const output = await generateCarousel(
        {
          title: f.title,
          topic: f.topic,
          audience: f.audience,
          goal: f.goal,
          stylePresetId: f.stylePresetId,
          customStyleNotes: f.customStyleNotes,
          dominantColors: f.dominantColors,
          slideCount: f.slideCount,
          language: f.language,
          ctaStyle: f.ctaStyle,
        },
        apiKey,
      );

      f.setOutput(output);
      toast.success("Carousel prompt siap! Scroll ke bawah untuk lihat.");
      setTimeout(() => {
        document
          .getElementById("output-viewer")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch (err) {
      const message =
        err instanceof GeminiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Terjadi kesalahan tidak terduga.";
      f.setError(message);
      toast.error(message);
      if (err instanceof GeminiError && err.code === "invalid_key") {
        openApiModal();
      }
    } finally {
      f.setIsGenerating(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="title">Judul Konten</Label>
            <Input
              id="title"
              placeholder="5 Mindset Orang Kaya"
              value={f.title}
              onChange={(e) => f.setField("title", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="goal">Tujuan Konten</Label>
            <Input
              id="goal"
              placeholder="Engagement & shareable"
              value={f.goal}
              onChange={(e) => f.setField("goal", e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="topic">
            Topik <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="topic"
            placeholder="Mindset orang sukses yang anak muda jarang tahu — fokus ke aset vs liabilitas, compound learning, dan ego."
            value={f.topic}
            onChange={(e) => f.setField("topic", e.target.value)}
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="audience">
            Target Audience <span className="text-destructive">*</span>
          </Label>
          <Input
            id="audience"
            placeholder="Anak muda 18-30 tahun, urban, ambisius secara karier"
            value={f.audience}
            onChange={(e) => f.setField("audience", e.target.value)}
          />
        </div>
      </section>

      <section className="space-y-3">
        <Label>Style Visual</Label>
        <StylePresetGrid />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="colors" className="text-xs text-muted-foreground">
              Warna Dominan (opsional)
            </Label>
            <Input
              id="colors"
              placeholder="Hitam, kuning, oranye"
              value={f.dominantColors || ""}
              onChange={(e) => f.setField("dominantColors", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="custom" className="text-xs text-muted-foreground">
              Catatan Style Tambahan (opsional)
            </Label>
            <Input
              id="custom"
              placeholder="Tambahkan elemen tipografi neon"
              value={f.customStyleNotes || ""}
              onChange={(e) => f.setField("customStyleNotes", e.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <SlideCountSlider />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Bahasa Output</Label>
            <SegmentedControl<Language>
              value={f.language}
              onChange={f.setLanguage}
              options={[
                { value: "id", label: "Indonesia" },
                { value: "en", label: "English" },
              ]}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cta-style">CTA Style</Label>
            <select
              id="cta-style"
              value={f.ctaStyle}
              onChange={(e) => f.setCtaStyle(e.target.value as CtaStyle)}
              className="flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {CTA_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <Button
          size="xl"
          onClick={handleGenerate}
          disabled={f.isGenerating}
          className="flex-1"
        >
          {f.isGenerating ? (
            <>
              <Loader2 className="size-5 animate-spin" />
              Membuat carousel...
            </>
          ) : (
            <>
              <Sparkles className="size-5" />
              Generate Carousel Prompt
            </>
          )}
        </Button>
        <Button
          size="xl"
          variant="outline"
          onClick={() => {
            if (confirm("Reset semua field?")) f.reset();
          }}
          disabled={f.isGenerating}
        >
          <RotateCcw className="size-4" />
          Reset
        </Button>
      </div>

      {f.error && !f.isGenerating && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          {f.error}
        </div>
      )}
    </div>
  );
}
