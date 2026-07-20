import { listPendingManualOrders } from "@/lib/data/admin-orders";
import { OrdersPanel } from "@/components/admin/OrdersPanel";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const orders = await listPendingManualOrders();
  return <OrdersPanel orders={orders} />;
}
