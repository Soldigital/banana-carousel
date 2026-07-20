"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Settings as SettingsIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/layout/Logo";
import { Separator } from "@/components/ui/separator";
import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/components/providers/auth-provider";
import type { EntitlementStatus } from "@/lib/license/status";
import { USER_NAV_ALL, ADMIN_NAV_ALL, type NavItem, type AdminNavItem } from "./nav-config";

const TIER_LABEL: Record<EntitlementStatus["tier"], string> = {
  free: "Free",
  founding: "Founding",
  lifetime: "Lifetime",
  pro_annual: "Pro Annual",
};

interface SidebarContentProps {
  variant: "user" | "admin";
  status: EntitlementStatus;
  isSuper?: boolean;
  collapsed: boolean;
  onNavigate?: () => void;
}

export function SidebarContent({
  variant,
  status,
  isSuper = false,
  collapsed,
  onNavigate,
}: SidebarContentProps) {
  const pathname = usePathname();

  const items = React.useMemo<(NavItem | AdminNavItem)[]>(() => {
    return variant === "admin"
      ? ADMIN_NAV_ALL.filter((item) => item.show(isSuper))
      : USER_NAV_ALL.filter((item) => item.show(status));
  }, [variant, status, isSuper]);

  const initial = (status.email || "?").charAt(0).toUpperCase();

  return (
    <div className="flex h-full flex-col">
      <div className={cn("flex items-center gap-2 px-4 py-4", collapsed && "justify-center px-2")}>
        <Logo className="size-8 shrink-0" />
        {!collapsed && (
          <div className="flex min-w-0 flex-col">
            <span className="truncate font-display font-bold text-sm leading-tight">
              Banana<span className="text-banana">Carousel</span>
            </span>
            <span className="truncate text-[11px] font-medium text-muted-foreground">
              {TIER_LABEL[status.tier]}
              {variant === "admin" && (isSuper ? " · Super Admin" : " · Supervisor")}
            </span>
          </div>
        )}
      </div>

      <Separator />

      <nav className="flex-1 overflow-y-auto px-2 py-3">
        <ul className="flex flex-col gap-0.5">
          {items.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/dashboard" && item.href !== "/admin" && pathname.startsWith(item.href + "/"));
            const Icon = item.icon;
            const link = (
              <Link
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  collapsed && "justify-center px-0",
                  active
                    ? "bg-secondary font-semibold text-foreground"
                    : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                )}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 h-5 -translate-y-1/2 w-0.5 rounded-full bg-banana" />
                )}
                <Icon className="size-4 shrink-0" />
                {!collapsed && (
                  <span className="truncate">{item.label}</span>
                )}
                {!collapsed && item.comingSoon && (
                  <span className="ml-auto rounded-full bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                    Segera
                  </span>
                )}
              </Link>
            );

            return (
              <li key={item.href}>
                {collapsed ? (
                  <Tooltip delayDuration={200}>
                    <TooltipTrigger asChild>{link}</TooltipTrigger>
                    <TooltipContent side="right">
                      {item.label}
                      {item.comingSoon ? " (Segera)" : ""}
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  link
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      <Separator />

      <div className={cn("p-2", collapsed && "flex justify-center")}>
        <SidebarUserMenu collapsed={collapsed} initial={initial} email={status.email} />
      </div>
    </div>
  );
}

export function SidebarUserMenu({
  collapsed,
  initial,
  email,
}: {
  collapsed: boolean;
  initial: string;
  email: string | null;
}) {
  const { signOut } = useAuth();
  const router = useRouter();
  const [signingOut, setSigningOut] = React.useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    await signOut();
    router.push("/");
    router.refresh();
  }

  const trigger = (
    <button
      type="button"
      className={cn(
        "flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-secondary/60",
        collapsed && "w-auto justify-center px-0",
      )}
    >
      <Avatar className="size-8">
        <AvatarFallback>{initial}</AvatarFallback>
      </Avatar>
      {!collapsed && (
        <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
          {email ?? "Akun"}
        </span>
      )}
    </button>
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent align={collapsed ? "center" : "start"} side="top">
        <DropdownMenuItem asChild>
          <Link href="/dashboard/settings">
            <SettingsIcon className="size-4" />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleSignOut} disabled={signingOut}>
          <LogOut className="size-4" />
          {signingOut ? "Keluar..." : "Keluar"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
