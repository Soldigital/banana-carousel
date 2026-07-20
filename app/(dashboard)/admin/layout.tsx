import { redirect } from "next/navigation";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { getAdminUser } from "@/lib/auth/admin";
import { isOwnerEmail } from "@/lib/config/app";
import { getEntitlement } from "@/lib/license/status";
import { DashboardShell } from "@/components/layout/dashboard/DashboardShell";

export const dynamic = "force-dynamic";

// Shared shell for every /admin/* sub-route — same gate (getAdminUser(),
// redirect to "/" if absent) as the pre-redesign page, now cached so it's a
// free dedup across this subtree instead of a fresh query per page.
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!hasSupabaseEnv()) redirect("/");

  const admin = await getAdminUser();
  if (!admin) redirect("/");
  const isSuper = isOwnerEmail(admin.email);

  const status = await getEntitlement();

  return (
    <DashboardShell variant="admin" status={status} isSuper={isSuper}>
      {children}
    </DashboardShell>
  );
}
