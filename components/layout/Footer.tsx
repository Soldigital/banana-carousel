import { Send } from "lucide-react";
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
        <div className="flex flex-col items-center gap-2 sm:items-end">
          <a
            href="https://t.me/BananaCarousel"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground hover:text-banana transition-colors"
          >
            <Send className="size-3.5" />
            Join channel Telegram
          </a>
          <p className="text-xs text-center sm:text-right">
            Powered by Gemini AI · BYOK · No data stored on our servers
          </p>
        </div>
      </div>
    </footer>
  );
}
