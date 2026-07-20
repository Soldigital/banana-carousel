import { redirect } from "next/navigation";
import { getAdminUser } from "@/lib/auth/admin";
import { isOwnerEmail } from "@/lib/config/app";
import { ComingSoonPanel } from "@/components/dashboard/ComingSoonPanel";

export const dynamic = "force-dynamic";

export default async function AdminPaymentsPage() {
  const admin = await getAdminUser();
  if (!isOwnerEmail(admin?.email)) redirect("/admin/users");
  return <ComingSoonPanel label="Payments" />;
}
