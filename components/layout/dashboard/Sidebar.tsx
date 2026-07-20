"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/lib/store/sidebar-store";
import type { EntitlementStatus } from "@/lib/license/status";
import { SidebarContent } from "./SidebarContent";

interface SidebarProps {
  variant: "user" | "admin";
  status: EntitlementStatus;
  isSuper?: boolean;
}

// Desktop/laptop inline sidebar (hidden below `lg`; mobile/tablet use the
// Sheet-based drawer rendered from Topbar instead).
export function Sidebar({ variant, status, isSuper }: SidebarProps) {
  const collapsed = useSidebarStore((s) => s.collapsed);
  const toggle = useSidebarStore((s) => s.toggle);
  const setCollapsed = useSidebarStore((s) => s.setCollapsed);
  const [mounted, setMounted] = React.useState(false);
  const appliedDefault = React.useRef(false);

  React.useEffect(() => {
    setMounted(true);
    if (appliedDefault.current) return;
    appliedDefault.current = true;
    // First-ever visit (no persisted preference yet): default collapsed on
    // laptop widths only, per the responsive spec.
    try {
      const stored = localStorage.getItem("sidebar-ui");
      if (!stored) {
        const isLaptopOnly = window.matchMedia(
          "(min-width: 1024px) and (max-width: 1279px)",
        ).matches;
        if (isLaptopOnly) setCollapsed(true);
      }
    } catch {
      /* localStorage unavailable — keep default */
    }
  }, [setCollapsed]);

  const width = mounted && collapsed ? 72 : 280;

  return (
    <motion.aside
      animate={{ width }}
      initial={false}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="sticky top-0 hidden h-svh shrink-0 flex-col border-r border-border bg-card lg:flex"
    >
      <div className="flex-1 overflow-hidden">
        <SidebarContent
          variant={variant}
          status={status}
          isSuper={isSuper}
          collapsed={mounted && collapsed}
        />
      </div>
      <button
        type="button"
        onClick={toggle}
        aria-label={collapsed ? "Perluas sidebar" : "Ciutkan sidebar"}
        className={cn(
          "flex items-center justify-center gap-2 border-t border-border py-2.5 text-xs text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
        )}
      >
        {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
        {!collapsed && mounted && "Ciutkan"}
      </button>
    </motion.aside>
  );
}
