// One-off: ensure the super-admin accounts exist with a password (confirmed,
// not banned), so they can log in via the password tab without email.
// Run: ADMIN_PASSWORD='...' node --env-file=.env.local scripts/set-admin-passwords.mjs
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const password = process.env.ADMIN_PASSWORD;
const EMAILS = ["admin@nusantaracreative.com", "soldigital.id@gmail.com"];

if (!url || !key || !password) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / ADMIN_PASSWORD");
  process.exit(1);
}

const admin = createClient(url, key, { auth: { persistSession: false } });
const { data, error } = await admin.auth.admin.listUsers({ perPage: 1000 });
if (error) {
  console.error("listUsers failed:", error.message);
  process.exit(1);
}
const users = data.users;

for (const email of EMAILS) {
  const existing = users.find((u) => (u.email || "").toLowerCase() === email);
  if (existing) {
    const { error: e } = await admin.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
      ban_duration: "none",
    });
    console.log(e ? `ERR update ${email}: ${e.message}` : `updated ${email}`);
  } else {
    const { error: e } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    console.log(e ? `ERR create ${email}: ${e.message}` : `created ${email}`);
  }
}
console.log("done");
