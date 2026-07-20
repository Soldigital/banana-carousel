import { redirect } from "next/navigation";
import { AffiliatePanel } from "@/components/dashboard/AffiliatePanel";
import { getEntitlement } from "@/lib/license/status";
import { USE_AFFILIATE } from "@/lib/config/flags";

export const dynamic = "force-dynamic";

export default async function DashboardAffiliatePage() {
  const status = await getEntitlement();
  if (!USE_AFFILIATE || !status.entitled) redirect("/dashboard");
  return <AffiliatePanel />;
}
