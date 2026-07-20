import type { EntitlementStatus } from "@/lib/license/status";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

interface DashboardShellProps {
  variant: "user" | "admin";
  status: EntitlementStatus;
  isSuper?: boolean;
  children: React.ReactNode;
}

// Shared shell for both the User and Admin dashboards — sidebar + topbar
// chrome, differing only in which nav items render (see nav-config.ts).
export function DashboardShell({
  variant,
  status,
  isSuper,
  children,
}: DashboardShellProps) {
  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex min-h-svh w-full bg-background">
        <Sidebar variant={variant} status={status} isSuper={isSuper} />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar variant={variant} status={status} isSuper={isSuper} />
          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </TooltipProvider>
  );
}
