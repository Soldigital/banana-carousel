import { createClient } from "@/lib/supabase/server";
import { reconcileOnLogin } from "@/lib/license/entitlement";
import { getEntitlement } from "@/lib/license/status";
import { AccessStatusCard } from "@/components/dashboard/AccessStatusCard";

export const dynamic = "force-dynamic";

export default async function DashboardOverviewPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  // Pick up any payment made before this account existed.
  if (user) await reconcileOnLogin(user.id, user.email ?? "");

  const status = await getEntitlement();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">{status.email}</p>
      </div>
      <AccessStatusCard status={status} />
    </div>
  );
}
