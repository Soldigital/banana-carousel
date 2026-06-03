import { redirect } from "next/navigation";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { getEntitlement } from "@/lib/license/status";
import { getAnnouncement } from "@/lib/data/settings";
import { GenerateClient } from "./GenerateClient";

export const dynamic = "force-dynamic";

export default async function GeneratePage() {
  // Server-side paywall: only logged-in, entitled (paid) users reach the
  // generator. Defense-in-depth on top of the client LicenseGate.
  if (hasSupabaseEnv()) {
    const status = await getEntitlement();
    if (!status.loggedIn) redirect("/login?redirect=/generate");
    if (!status.entitled) redirect("/dashboard");
  }

  const announcement = await getAnnouncement();
  return <GenerateClient announcement={announcement} />;
}
