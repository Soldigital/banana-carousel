"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { KeyRound, LayoutDashboard, LogIn, LogOut, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./ThemeToggle";
import { Wordmark } from "./Wordmark";
import { useUIStore } from "@/lib/store/ui-store";
import { useAuth } from "@/components/providers/auth-provider";

export function Header({ showApiKey = true }: { showApiKey?: boolean }) {
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
        </nav>
      </div>
    </header>
  );
}
