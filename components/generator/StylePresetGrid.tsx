"use client";

import { Check } from "lucide-react";
import { motion } from "framer-motion";
import { STYLE_PRESETS, STYLE_CATEGORIES } from "@/lib/prompts/style-presets";
import { useFormStore } from "@/lib/store/form-store";
import { cn } from "@/lib/utils";
import type { StylePreset } from "@/types/carousel";

export function StylePresetGrid() {
  const selected = useFormStore((s) => s.stylePresetId);
  const setStyle = useFormStore((s) => s.setStylePreset);

  return (
    <div className="space-y-6">
      {STYLE_CATEGORIES.map((category) => {
        const presets = STYLE_PRESETS.filter(
          (p) => p.category === category && !p.hidden,
        );
        if (presets.length === 0) return null;
        return (
          <div key={category} className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {category}
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {presets.map((preset) => (
                <PresetCard
                  key={preset.id}
                  preset={preset}
                  isActive={selected === preset.id}
                  onSelect={() => setStyle(preset.id)}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PresetCard({
  preset,
  isActive,
  onSelect,
}: {
  preset: StylePreset;
  isActive: boolean;
  onSelect: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onSelect}
      whileTap={{ scale: 0.97 }}
      title={preset.bestFor ? `Best for: ${preset.bestFor}` : undefined}
      className={cn(
        "group relative rounded-xl border text-left p-3 transition-all overflow-hidden",
        isActive
          ? "border-banana ring-2 ring-banana/40 shadow-[0_0_28px_-12px_rgba(250,204,21,0.7)]"
          : "border-border hover:border-banana/40",
      )}
    >
      <div
        className="h-16 sm:h-20 w-full rounded-lg mb-2.5"
        style={{ background: preset.gradient }}
      />
      <div className="space-y-0.5">
        <p className="font-semibold text-sm leading-tight">{preset.name}</p>
        <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2">
          {preset.description}
        </p>
        {preset.bestFor && (
          <p className="pt-0.5 text-[10px] leading-snug text-muted-foreground/80 line-clamp-1">
            <span className="font-medium text-muted-foreground">Best for:</span>{" "}
            {preset.bestFor}
          </p>
        )}
      </div>
      {isActive && (
        <div className="absolute top-2 right-2 size-6 rounded-full bg-banana flex items-center justify-center">
          <Check className="size-3.5 text-black" strokeWidth={3} />
        </div>
      )}
    </motion.button>
  );
}
