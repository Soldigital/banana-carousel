import { redirect } from "next/navigation";
import { getAdminUser } from "@/lib/auth/admin";
import { isOwnerEmail } from "@/lib/config/app";
import { getTutorial } from "@/lib/data/settings";
import { TutorialsPanel } from "@/components/admin/TutorialsPanel";

export const dynamic = "force-dynamic";

export default async function AdminTutorialsPage() {
  const admin = await getAdminUser();
  if (!isOwnerEmail(admin?.email)) redirect("/admin/users");

  const tutorial = await getTutorial();
  return <TutorialsPanel current={tutorial} />;
}
