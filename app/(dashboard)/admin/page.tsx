import { redirect } from "next/navigation";
import { getAdminUser } from "@/lib/auth/admin";
import { isOwnerEmail } from "@/lib/config/app";
import { getStats } from "@/lib/data/admin-stats";
import { StatsGrid } from "@/components/admin/StatsGrid";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const admin = await getAdminUser();
  const isSuper = isOwnerEmail(admin?.email);
  // Non-super ("Supervisor") users never saw the Overview tab in the old UI
  // (it only rendered `{isSuper && <TabsTrigger value="overview">}`) — same
  // default-destination behavior as before, now enforced as a route redirect.
  if (!isSuper) redirect("/admin/users");

  const stats = await getStats();

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold">Super Admin</h1>
      <StatsGrid stats={stats} />
    </div>
  );
}
