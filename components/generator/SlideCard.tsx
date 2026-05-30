"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { ChevronDown, ChevronUp, Layout, Type, Image as ImageIcon } from "lucide-react";
import { CopyButton } from "./CopyButton";
import { Button } from "@/components/ui/button";
import { composeSlidePrompt } from "@/lib/export/compose-carousel";
import type { SlidePrompt } from "@/types/carousel";

const ROLE_BADGE: Record<string, { label: string; cls: string }> = {
  hook: { label: "HOOK", cls: "bg-banana text-black" },
  context: { label: "CONTEXT", cls: "bg-blue-500/15 text-blue-300 dark:text-blue-300" },
  value: { label: "VALUE", cls: "bg-emerald-500/15 text-emerald-400" },
  story: { label: "STORY", cls: "bg-purple-500/15 text-purple-400" },
  cta: { label: "CTA", cls: "bg-rose-500/15 text-rose-400" },
};

interface Props {
  slide: SlidePrompt;
  index: number;
}

export function SlideCard({ slide, index }: Props) {
  const [expanded, setExpanded] = React.useState(index === 0);
  const badge = ROLE_BADGE[slide.role] ?? ROLE_BADGE.value;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="rounded-2xl border border-border bg-card overflow-hidden"
    >
      <div className="p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-secondary flex items-center justify-center font-display font-bold text-sm tabular-nums">
              {slide.slide_num}
            </div>
            <span
              className={`text-[10px] font-bold tracking-wider px-2 py-1 rounded-md ${badge.cls}`}
            >
              {badge.label}
            </span>
          </div>
          <CopyButton
            text={composeSlidePrompt(slide)}
            label={`Copy Slide ${slide.slide_num}`}
            successMessage={`Slide ${slide.slide_num} tersalin!`}
          />
        </div>

        <div>
          <p className="font-display text-xl sm:text-2xl font-bold leading-tight text-balance">
            {slide.headline}
          </p>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            {slide.body}
          </p>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded((v) => !v)}
          className="w-full justify-between"
        >
          <span className="text-xs font-medium text-muted-foreground">
            {expanded ? "Sembunyikan" : "Lihat"} prompt detail
          </span>
          {expanded ? (
            <ChevronUp className="size-4" />
          ) : (
            <ChevronDown className="size-4" />
          )}
        </Button>

        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="space-y-3 pt-1"
          >
            <PromptBlock
              icon={<ImageIcon className="size-3.5" />}
              label="VISUAL PROMPT (English)"
              text={slide.visual_prompt}
            />
            <PromptBlock
              icon={<Type className="size-3.5" />}
              label="TYPOGRAPHY"
              text={slide.typography_instruction}
            />
            <PromptBlock
              icon={<Layout className="size-3.5" />}
              label="LAYOUT"
              text={slide.layout_instruction}
            />
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

function PromptBlock({
  icon,
  label,
  text,
}: {
  icon: React.ReactNode;
  label: string;
  text: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-secondary/30 p-3 space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-muted-foreground">
          {icon}
          {label}
        </span>
        <CopyButton
          text={text}
          label="Copy"
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs"
        />
      </div>
      <p className="text-xs text-foreground/90 leading-relaxed font-mono whitespace-pre-wrap break-words">
        {text}
      </p>
    </div>
  );
}
