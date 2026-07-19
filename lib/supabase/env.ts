// Centralized Supabase env access. The public URL/anon key are safe to expose;
// the service-role key is server-only and must NEVER be imported into a
// "use client" module. `hasSupabaseEnv` lets callers (e.g. middleware) degrade
// gracefully before Supabase is configured, so the site keeps working.

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export function hasSupabaseEnv(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}
