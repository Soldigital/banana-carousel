// Server component. Providers listed here must match MODEL_CHAINS in
// lib/ai/types.ts — these are the three the gateway actually rotates across.
const PROVIDERS = ["Google Gemini", "OpenRouter", "Groq", "Instagram"] as const;

export function IntegrationsBand() {
  return (
    <section className="border-y border-border/60 bg-card/30">
      <div className="container py-10 sm:py-12 text-center">
        <p className="text-xs font-bold tracking-[0.2em] text-muted-foreground">
          BEKERJA DENGAN
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 sm:gap-x-12">
          {PROVIDERS.map((p) => (
            <span
              key={p}
              className="font-display font-bold text-base sm:text-lg text-foreground/60 hover:text-foreground transition-colors"
            >
              {p}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
