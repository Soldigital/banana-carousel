import { redirect } from "next/navigation";
import { BrandProfilesPanel } from "@/components/dashboard/BrandProfilesPanel";
import { USE_BRAND_PROFILES } from "@/lib/config/flags";

export default function DashboardBrandProfilesPage() {
  if (!USE_BRAND_PROFILES) redirect("/dashboard");
  return <BrandProfilesPanel />;
}
