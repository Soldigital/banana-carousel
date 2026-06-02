import { redirect } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { reconcileOnLogin } from "@/lib/license/entitlement";
import { getEntitlement } from "@/lib/license/status";
import { listCarousels } from "@/lib/data/carousels";
import { DashboardClient } from "./DashboardClient";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  if (!hasSupabaseEnv()) redirect("/");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/dashboard");

  // Pick up any payment made before this account existed.
  await reconcileOnLogin(user.id, user.email ?? "");

  const [status, carousels] = await Promise.all([
    getEntitlement(),
    listCarousels(),
  ]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header showApiKey={false} />
      <main className="flex-1 container py-10 sm:py-14">
        <DashboardClient status={status} carousels={carousels} />
      </main>
      <Footer />
    </div>
  );
}
