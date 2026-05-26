"use client";

import Link from "next/link";
import { KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./ThemeToggle";
import { Logo } from "./Logo";
import { useUIStore } from "@/lib/store/ui-store";

export function Header({ showApiKey = true }: { showApiKey?: boolean }) {
  const hasKey = useUIStore((s) => s.hasApiKey);
  const openModal = useUIStore((s) => s.openApiKeyModal);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-14 sm:h-16 items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-2 group">
          <Logo className="size-7" />
          <span className="font-display font-bold text-base sm:text-lg tracking-tight">
            Banana<span className="text-banana">Carousel</span>
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          {showApiKey && (
            <Button
              variant={hasKey ? "ghost" : "outline"}
              size="sm"
              onClick={openModal}
              className="hidden sm:inline-flex"
            >
              <KeyRound className="size-4" />
              {hasKey ? "API Key" : "Set API Key"}
            </Button>
          )}
          {showApiKey && (
            <Button
              variant={hasKey ? "ghost" : "outline"}
              size="icon"
              onClick={openModal}
              className="sm:hidden"
              aria-label="API Key"
            >
              <KeyRound className="size-4" />
            </Button>
          )}
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
