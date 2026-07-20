import { redirect } from "next/navigation";
import { getAdminUser } from "@/lib/auth/admin";
import { isOwnerEmail } from "@/lib/config/app";
import { USE_AFFILIATE } from "@/lib/config/flags";
import { AffiliatesTab } from "@/components/admin/AffiliatesTab";

export const dynamic = "force-dynamic";

export default async function AdminAffiliatesPage() {
  const admin = await getAdminUser();
  if (!isOwnerEmail(admin?.email) || !USE_AFFILIATE) redirect("/admin/users");
  return <AffiliatesTab />;
}
