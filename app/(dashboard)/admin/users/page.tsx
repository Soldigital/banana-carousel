import { getAdminUser } from "@/lib/auth/admin";
import { isOwnerEmail } from "@/lib/config/app";
import { listUsers } from "@/lib/data/admin-stats";
import { UsersPanel } from "@/components/admin/UsersPanel";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const admin = await getAdminUser();
  const isSuper = isOwnerEmail(admin?.email);
  const users = await listUsers();
  return <UsersPanel users={users} isSuper={isSuper} />;
}
