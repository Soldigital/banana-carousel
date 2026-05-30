"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Sparkles, ExternalLink, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CopyButton } from "./CopyButton";
import { SlideCard } from "./SlideCard";
import { DownloadButtons } from "./DownloadButtons";
import { composeAllSlides } from "@/lib/export/compose-carousel";
import type { CarouselOutput } from "@/types/carousel";

interface Props {
  output: CarouselOutput;
}

export function OutputViewer({ output }: Props) {
  return (
    <div id="output-viewer" className="space-y-6 scroll-mt-8">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-banana/40 bg-gradient-to-br from-banana/10 to-transparent p-5 sm:p-6"
      >
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="space-y-1.5 min-w-0">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-banana">
              <Sparkles className="size-3.5" />
              CAROUSEL READY
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold leading-tight">
              {output.carousel_title}
            </h2>
            <p className="text-sm text-muted-foreground max-w-2xl">
              {output.hook.body}
            </p>
          </div>
          <DownloadButtons output={output} />
        </div>
      </motion.div>

      <Tabs defaultValue="gemini" className="w-full">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="gemini">Gemini-Ready Prompt</TabsTrigger>
          <TabsTrigger value="slides">Per Slide ({output.slides.length})</TabsTrigger>
          <TabsTrigger value="style">Global Style</TabsTrigger>
        </TabsList>

        <TabsContent value="gemini" className="space-y-3">
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="flex items-center justify-between gap-3 p-4 sm:p-5 border-b border-border flex-wrap">
              <div>
                <p className="font-semibold">Master prompt — paste to Gemini</p>
                <p className="text-xs text-muted-foreground">
                  Salin & paste ke{" "}
                  <a
                    href="https://gemini.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-banana hover:underline inline-flex items-center gap-0.5"
                  >
                    gemini.google.com <ExternalLink className="size-3" />
                  </a>
                  {" "}atau Google AI Studio
                </p>
              </div>
              <CopyButton
                text={output.gemini_ready_prompt}
                label="Copy Master Prompt"
                variant="default"
                size="default"
              />
            </div>
            <pre className="p-4 sm:p-5 text-xs sm:text-sm font-mono whitespace-pre-wrap break-words max-h-[600px] overflow-y-auto leading-relaxed">
              {output.gemini_ready_prompt}
            </pre>
          </div>
        </TabsContent>

        <TabsContent value="slides" className="space-y-3">
          <div className="flex items-center justify-between gap-3 flex-wrap pb-1">
            <p className="text-sm text-muted-foreground">
              {output.slides.length} slide structure dengan visual + typography + layout
            </p>
            <CopyButton
              text={composeAllSlides(output)}
              label="Copy All Slides"
              variant="default"
            />
          </div>
          <div className="space-y-3">
            {output.slides.map((slide, i) => (
              <SlideCard key={slide.slide_num} slide={slide} index={i} />
            ))}
          </div>

          <div className="rounded-2xl border border-banana/30 bg-banana/5 p-4 sm:p-5 space-y-2">
            <p className="text-[10px] font-bold tracking-wider text-banana">
              FINAL CTA
            </p>
            <p className="font-display text-lg sm:text-xl font-bold leading-tight">
              {output.cta.headline}
            </p>
            <p className="text-sm text-muted-foreground">→ {output.cta.action}</p>
          </div>
        </TabsContent>

        <TabsContent value="style" className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Palette className="size-4 text-banana" />
              <h3 className="font-display font-bold text-lg">Visual System</h3>
            </div>

            <div className="space-y-3 text-sm">
              <DetailRow
                label="Mood"
                value={output.global_style.mood}
              />
              <DetailRow
                label="Typography"
                value={output.global_style.typography_family}
              />
              <DetailRow
                label="Aspect Ratio"
                value={output.global_style.aspect_ratio}
              />
              <div className="space-y-1.5">
                <p className="text-xs font-bold tracking-wider text-muted-foreground">
                  COLOR PALETTE
                </p>
                <div className="flex flex-wrap gap-2">
                  {output.global_style.color_palette.map((c, i) => (
                    <div
                      key={i}
                      className="inline-flex items-center gap-1.5 rounded-md border border-border bg-secondary/50 px-2 py-1"
                    >
                      <span
                        className="size-4 rounded border border-border"
                        style={{ background: c }}
                      />
                      <code className="text-[11px] font-mono">{c}</code>
                    </div>
                  ))}
                </div>
              </div>
              <DetailRow
                label="Consistency Notes"
                value={output.global_style.consistency_notes}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-bold tracking-wider text-muted-foreground">
        {label.toUpperCase()}
      </p>
      <p className="text-sm leading-relaxed">{value}</p>
    </div>
  );
}
