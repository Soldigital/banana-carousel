import { redirect } from "next/navigation";
import { FounderControl } from "@/components/dashboard/FounderControl";
import { getEntitlement } from "@/lib/license/status";
import { USE_PRICING_V2 } from "@/lib/config/flags";

export const dynamic = "force-dynamic";

export default async function DashboardFoundingPage() {
  const status = await getEntitlement();
  if (!USE_PRICING_V2 || status.founderNumber == null) redirect("/dashboard");
  return <FounderControl founderNumber={status.founderNumber} />;
}
