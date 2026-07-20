import { redirect } from "next/navigation";
import { getAdminUser } from "@/lib/auth/admin";
import { isOwnerEmail } from "@/lib/config/app";
import { getAnnouncementRaw } from "@/lib/data/settings";
import { AnnouncementsPanel } from "@/components/admin/AnnouncementsPanel";

export const dynamic = "force-dynamic";

export default async function AdminAnnouncementsPage() {
  const admin = await getAdminUser();
  if (!isOwnerEmail(admin?.email)) redirect("/admin/users");

  const announcement = await getAnnouncementRaw();
  return <AnnouncementsPanel current={announcement} />;
}
