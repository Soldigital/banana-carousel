import { redirect } from "next/navigation";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { getEntitlement } from "@/lib/license/status";
import { getAnnouncement } from "@/lib/data/settings";
import { AnnouncementBanner } from "@/components/AnnouncementBanner";
import { DashboardShell } from "@/components/layout/dashboard/DashboardShell";
import { ApiKeyModal } from "@/components/api-key/ApiKeyModal";

export const dynamic = "force-dynamic";

// Shared shell for every /dashboard/* sub-route — auth check + entitlement
// fetch happen once here (cache()-deduped if a page below also calls
// getEntitlement()), same redirect condition as the pre-redesign page.
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!hasSupabaseEnv()) redirect("/");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/dashboard");

  const [status, announcement] = await Promise.all([
    getEntitlement(),
    getAnnouncement(),
  ]);

  return (
    <DashboardShell variant="user" status={status}>
      <AnnouncementBanner announcement={announcement} />
      <div className="mt-4">{children}</div>
      <ApiKeyModal />
    </DashboardShell>
  );
}
