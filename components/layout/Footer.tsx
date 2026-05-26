import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="border-t border-border/60 mt-16 sm:mt-24">
      <div className="container py-8 sm:py-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Logo className="size-6" />
          <span className="font-display font-semibold text-foreground">
            Banana Carousel
          </span>
          <span className="opacity-60">· Built for Indonesian creators</span>
        </div>
        <p className="text-xs text-center sm:text-right">
          Powered by Gemini AI · BYOK · No data stored on our servers
        </p>
      </div>
    </footer>
  );
}
