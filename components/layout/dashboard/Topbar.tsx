"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { Menu, Search, Bell, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { SidebarContent, SidebarUserMenu } from "./SidebarContent";
import { getRouteTitle } from "./route-titles";
import type { EntitlementStatus } from "@/lib/license/status";

interface TopbarProps {
  variant: "user" | "admin";
  status: EntitlementStatus;
  isSuper?: boolean;
}

export function Topbar({ variant, status, isSuper }: TopbarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const { title, breadcrumb } = getRouteTitle(pathname);
  const initial = (status.email || "?").charAt(0).toUpperCase();

  // Auto-close the mobile drawer after navigating to a new page.
  React.useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-xl sm:px-6">
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          aria-label="Buka menu"
          onClick={() => setMobileOpen(true)}
        >
          <Menu className="size-5" />
        </Button>
        <SheetContent side="left" className="w-72">
          <SheetTitle className="sr-only">Menu navigasi</SheetTitle>
          <SidebarContent
            variant={variant}
            status={status}
            isSuper={isSuper}
            collapsed={false}
            onNavigate={() => setMobileOpen(false)}
          />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <nav className="hidden items-center gap-1 text-xs text-muted-foreground sm:flex">
          {breadcrumb.map((crumb, i) => (
            <span key={crumb} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="size-3" />}
              {crumb}
            </span>
          ))}
        </nav>
        <h1 className="truncate text-base font-semibold leading-tight sm:text-lg">
          {title}
        </h1>
      </div>

      <div className="hidden max-w-xs flex-1 md:flex">
        <div className="relative w-full">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari..."
            disabled
            className="h-9 pl-9 text-sm"
            aria-label="Pencarian (segera hadir)"
          />
        </div>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          disabled
          aria-label="Notifikasi (segera hadir)"
        >
          <Bell className="size-4" />
        </Button>
        <ThemeToggle />
        <div className="lg:hidden">
          <SidebarUserMenu collapsed={false} initial={initial} email={status.email} />
        </div>
      </div>
    </header>
  );
}
