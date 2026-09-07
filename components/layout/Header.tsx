"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { KeyRound, LayoutDashboard, LogIn, LogOut, Menu, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ThemeToggle } from "./ThemeToggle";
import { Wordmark } from "./Wordmark";
import { useUIStore } from "@/lib/store/ui-store";
import { useAuth } from "@/components/providers/auth-provider";

// Marketing anchors. Opt-in via `showNav` so the four non-landing pages that
// also render this header (/login, /activate, /transfer, /reset-password) keep
// their current minimal chrome — anchors like #pricing would be dead there.
const NAV_LINKS = [
  { href: "/#features", label: "Fitur" },
  { href: "/#services", label: "Layanan" },
  { href: "/#pricing", label: "Harga" },
  { href: "/#hasil", label: "Contoh Hasil" },
  { href: "/#faq", label: "FAQ" },
  { href: "/#about", label: "Tentang" },
] as const;

export function Header({
  showApiKey = true,
  showNav = false,
}: {
  showApiKey?: boolean;
  showNav?: boolean;
}) {
  const hasKey = useUIStore((s) => s.hasApiKey);
  const openModal = useUIStore((s) => s.openApiKeyModal);
  const { user, profile, loading, signOut } = useAuth();
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-14 sm:h-16 items-center justify-between gap-3">
        <Link href="/" className="flex items-center group" aria-label="Banana Carousel">
          <Wordmark priority className="h-7 sm:h-8" />
        </Link>

        {showNav && (
          <nav className="hidden lg:flex items-center gap-6 mx-auto" aria-label="Navigasi utama">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        )}

        <nav className="flex items-center gap-1">
          {showApiKey && (
            <>
              <Button
                variant={hasKey ? "ghost" : "outline"}
                size="sm"
                onClick={openModal}
                className="hidden sm:inline-flex"
              >
                <KeyRound className="size-4" />
                {hasKey ? "API Key" : "Set API Key"}
              </Button>
              <Button
                variant={hasKey ? "ghost" : "outline"}
                size="icon"
                onClick={openModal}
                className="sm:hidden"
                aria-label="API Key"
              >
                <KeyRound className="size-4" />
              </Button>
            </>
          )}

          {!loading && profile?.is_admin && (
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link href="/admin">
                <ShieldCheck className="size-4" />
                Admin
              </Link>
            </Button>
          )}

          {!loading && user && (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/dashboard">
                  <LayoutDashboard className="size-4" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                aria-label="Keluar"
              >
                <LogOut className="size-4" />
                <span className="hidden sm:inline">Keluar</span>
              </Button>
            </>
          )}

          {!loading && !user && (
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">
                <LogIn className="size-4" />
                <span className="hidden sm:inline">Masuk</span>
              </Link>
            </Button>
          )}

          <ThemeToggle />

          {showNav && (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Buka menu">
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72">
                <SheetHeader>
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                <div className="mt-6 flex flex-col gap-1">
                  {NAV_LINKS.map((l) => (
                    <SheetClose asChild key={l.href}>
                      <Link
                        href={l.href}
                        className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                      >
                        {l.label}
                      </Link>
                    </SheetClose>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          )}
        </nav>
      </div>
    </header>
  );
}
