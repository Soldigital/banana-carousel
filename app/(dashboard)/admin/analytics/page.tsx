import { redirect } from "next/navigation";
import { getAdminUser } from "@/lib/auth/admin";
import { isOwnerEmail } from "@/lib/config/app";
import { salesSeries } from "@/lib/data/admin-stats";
import { SalesOverview } from "@/components/admin/SalesOverview";

export const dynamic = "force-dynamic";

export default async function AdminAnalyticsPage() {
  const admin = await getAdminUser();
  if (!isOwnerEmail(admin?.email)) redirect("/admin/users");

  const sales = await salesSeries();
  return <SalesOverview sales={sales} />;
}
