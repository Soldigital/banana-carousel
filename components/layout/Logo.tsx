import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center rounded-lg gradient-banana shadow-[0_0_18px_-4px_rgba(250,204,21,0.6)]",
        className,
      )}
      aria-hidden
    >
      <span className="font-display font-black text-black text-[60%] leading-none select-none">
        BC
      </span>
    </div>
  );
}
