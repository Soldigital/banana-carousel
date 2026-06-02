import { redirect } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { getAdminUser } from "@/lib/auth/admin";
import { listPendingManualOrders } from "@/lib/data/admin-orders";
import { AdminClient } from "./AdminClient";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!hasSupabaseEnv()) redirect("/");

  const admin = await getAdminUser();
  if (!admin) redirect("/");

  const orders = await listPendingManualOrders();

  return (
    <div className="min-h-screen flex flex-col">
      <Header showApiKey={false} />
      <main className="flex-1 container py-10 sm:py-14">
        <AdminClient orders={orders} />
      </main>
      <Footer />
    </div>
  );
}
