"use client";

import * as React from "react";
import { ChevronDown, GraduationCap, PlayCircle } from "lucide-react";
import {
  TUTORIAL_STEPS,
  TUTORIAL_YOUTUBE_ID,
  type TutorialStep,
} from "@/lib/config/tutorial";

function TutorialStepItem({
  step,
  index,
}: {
  step: { title: string; body: string };
  index: number;
}) {
  const [open, setOpen] = React.useState(index === 0);
  return (
    <div className="rounded-xl border border-border bg-card/40 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-secondary/40"
        aria-expanded={open}
      >
        <span className="font-semibold text-sm">{step.title}</span>
        <ChevronDown
          className={`size-4 shrink-0 text-muted-foreground transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      {open && (
        <div className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed">
          {step.body}
        </div>
      )}
    </div>
  );
}

export function TutorialSection({
  youtubeId = TUTORIAL_YOUTUBE_ID,
  steps = TUTORIAL_STEPS,
}: {
  youtubeId?: string;
  steps?: TutorialStep[];
} = {}) {
  return (
    <section className="rounded-2xl border border-border bg-card/40 p-6">
      <div className="flex items-center gap-2 mb-4">
        <GraduationCap className="size-5 text-banana" />
        <h2 className="font-display text-lg font-semibold">Tutorial</h2>
      </div>

      {/* Video */}
      <div className="mb-6">
        {youtubeId ? (
          <div className="aspect-video w-full overflow-hidden rounded-2xl border border-border">
            <iframe
              className="h-full w-full"
              src={`https://www.youtube.com/embed/${youtubeId}`}
              title="Tutorial Banana Carousel"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>
        ) : (
          <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-background text-muted-foreground">
            <PlayCircle className="size-10" />
            <p className="text-sm">Video tutorial segera hadir.</p>
          </div>
        )}
      </div>

      {/* Interactive text steps */}
      <div className="space-y-2">
        <p className="mb-1 text-xs font-bold tracking-wider text-muted-foreground">
          PANDUAN LANGKAH DEMI LANGKAH
        </p>
        {steps.map((step, i) => (
          <TutorialStepItem key={i} step={step} index={i} />
        ))}
      </div>
    </section>
  );
}
