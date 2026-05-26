"use client";

import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { useFormStore } from "@/lib/store/form-store";

export function SlideCountSlider() {
  const value = useFormStore((s) => s.slideCount);
  const setValue = useFormStore((s) => s.setSlideCount);

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <Label className="text-sm">Jumlah Slide</Label>
        <span className="text-2xl font-display font-bold text-banana tabular-nums">
          {value}
        </span>
      </div>
      <Slider
        min={3}
        max={10}
        step={1}
        value={[value]}
        onValueChange={(v) => setValue(v[0])}
      />
      <div className="flex justify-between text-[10px] text-muted-foreground tabular-nums px-0.5">
        {[3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
          <span key={n}>{n}</span>
        ))}
      </div>
    </div>
  );
}
