import { redirect } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { getAdminUser } from "@/lib/auth/admin";
import { listPendingManualOrders } from "@/lib/data/admin-orders";
import { listUsers, getStats, salesSeries } from "@/lib/data/admin-stats";
import { getTutorial, getAnnouncementRaw } from "@/lib/data/settings";
import { AdminClient } from "./AdminClient";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!hasSupabaseEnv()) redirect("/");

  const admin = await getAdminUser();
  if (!admin) redirect("/");

  const [orders, users, stats, sales, tutorial, announcement] = await Promise.all([
    listPendingManualOrders(),
    listUsers(),
    getStats(),
    salesSeries(),
    getTutorial(),
    getAnnouncementRaw(),
  ]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header showApiKey={false} />
      <main className="flex-1 container py-10 sm:py-14">
        <AdminClient
          stats={stats}
          sales={sales}
          users={users}
          orders={orders}
          tutorial={tutorial}
          announcement={announcement}
        />
      </main>
      <Footer />
    </div>
  );
}
