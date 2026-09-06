import { getAdminUser } from "@/lib/auth/admin";
import { isOwnerEmail } from "@/lib/config/app";
import { listUsers } from "@/lib/data/admin-stats";
import { UsersPanel } from "@/components/admin/UsersPanel";

export const dynamic = "force-dynamic";

// Reachable by the `supervisor` tier as well as the owner — this is the default
// landing page every owner-only admin route redirects to, and UsersPanel already
// hides the privileged actions behind `isSuper`.
//
// What a supervisor must NOT receive is `access_code`: that is a live license
// key, and possession of one is enough to mint a session via
// /api/auth/license-login. It is requested only for a super admin, so the keys
// of up to 500 customers are never serialized into a supervisor's page payload.
export default async function AdminUsersPage() {
  const admin = await getAdminUser();
  const isSuper = isOwnerEmail(admin?.email);
  const users = await listUsers({ includeAccessCode: isSuper });
  return <UsersPanel users={users} isSuper={isSuper} />;
}
