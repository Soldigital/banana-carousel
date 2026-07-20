import { redirect } from "next/navigation";
import { getAdminUser } from "@/lib/auth/admin";
import { isOwnerEmail } from "@/lib/config/app";
import { USE_PRICING_V2 } from "@/lib/config/flags";
import { PromotionsTab } from "@/components/admin/PromotionsTab";

export const dynamic = "force-dynamic";

export default async function AdminPromoCodesPage() {
  const admin = await getAdminUser();
  if (!isOwnerEmail(admin?.email) || !USE_PRICING_V2) redirect("/admin/users");
  return <PromotionsTab />;
}
