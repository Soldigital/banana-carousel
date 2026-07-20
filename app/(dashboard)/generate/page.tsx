import { redirect } from "next/navigation";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { getEntitlement } from "@/lib/license/status";
import { getAnnouncement } from "@/lib/data/settings";
import { AnnouncementBanner } from "@/components/AnnouncementBanner";
import { DashboardShell } from "@/components/layout/dashboard/DashboardShell";
import { ApiKeyModal } from "@/components/api-key/ApiKeyModal";
import { GenerateClient } from "./GenerateClient";

export const dynamic = "force-dynamic";

export default async function GeneratePage() {
  const status = await getEntitlement();
  // Server-side paywall: only logged-in, entitled (paid) users reach the
  // generator. Defense-in-depth on top of the client LicenseGate. Same
  // condition as before the redesign.
  if (hasSupabaseEnv()) {
    if (!status.loggedIn) redirect("/login?redirect=/generate");
    if (!status.entitled) redirect("/dashboard");
  }

  const announcement = await getAnnouncement();

  return (
    <DashboardShell variant="user" status={status}>
      <AnnouncementBanner announcement={announcement} />
      <div className="mt-4">
        <GenerateClient />
      </div>
      <ApiKeyModal />
    </DashboardShell>
  );
}
