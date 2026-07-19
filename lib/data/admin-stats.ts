import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  whatsapp: string | null;
  is_pro: boolean;
  banned: boolean;
  is_admin: boolean;
  role: "user" | "supervisor";
  access_code: string | null;
  created_at: string;
}

export async function listUsers(limit = 500): Promise<AdminUser[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("profiles")
    .select(
      "id,email,name,whatsapp,is_pro,banned,is_admin,role,access_code,created_at",
    )
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data as AdminUser[]) ?? [];
}

export interface AdminStats {
  totalRevenue: number;
  userCount: number;
  proCount: number;
  pendingCount: number;
  paidCount: number;
}

export async function getStats(): Promise<AdminStats> {
  const admin = createAdminClient();
  const [paidRes, users, pros, pending] = await Promise.all([
    admin.from("orders").select("amount").in("status", ["paid", "approved"]),
    admin.from("profiles").select("*", { count: "exact", head: true }),
    admin.from("profiles").select("*", { count: "exact", head: true }).eq("is_pro", true),
    admin
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("method", "manual")
      .eq("status", "pending"),
  ]);
  const paid = (paidRes.data ?? []) as { amount: number }[];
  return {
    totalRevenue: paid.reduce((s, o) => s + (o.amount || 0), 0),
    paidCount: paid.length,
    userCount: users.count ?? 0,
    proCount: pros.count ?? 0,
    pendingCount: pending.count ?? 0,
  };
}

export interface SeriesPoint {
  label: string;
  total: number;
}
export interface SalesSeries {
  daily: SeriesPoint[];
  weekly: SeriesPoint[];
  monthly: SeriesPoint[];
}

function weekStartUTC(d: Date): Date {
  const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = (x.getUTCDay() + 6) % 7; // Monday = 0
  x.setUTCDate(x.getUTCDate() - day);
  return x;
}

export async function salesSeries(): Promise<SalesSeries> {
  const admin = createAdminClient();
  const since = new Date(Date.now() - 370 * 24 * 3600 * 1000).toISOString();
  const { data } = await admin
    .from("orders")
    .select("amount,created_at")
    .in("status", ["paid", "approved"])
    .gte("created_at", since);
  const rows = (data ?? []) as { amount: number; created_at: string }[];

  // Daily — last 14 days
  const daily: (SeriesPoint & { key: string })[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    daily.push({
      key: d.toISOString().slice(0, 10),
      label: `${d.getDate()}/${d.getMonth() + 1}`,
      total: 0,
    });
  }
  const dMap = new Map(daily.map((x) => [x.key, x]));
  rows.forEach((r) => {
    const b = dMap.get(r.created_at.slice(0, 10));
    if (b) b.total += r.amount || 0;
  });

  // Weekly — last 12 weeks
  const weekly: (SeriesPoint & { key: string })[] = [];
  const curWS = weekStartUTC(new Date());
  for (let i = 11; i >= 0; i--) {
    const d = new Date(curWS);
    d.setUTCDate(d.getUTCDate() - i * 7);
    weekly.push({
      key: d.toISOString().slice(0, 10),
      label: `${d.getUTCDate()}/${d.getUTCMonth() + 1}`,
      total: 0,
    });
  }
  const wMap = new Map(weekly.map((x) => [x.key, x]));
  rows.forEach((r) => {
    const k = weekStartUTC(new Date(r.created_at)).toISOString().slice(0, 10);
    const b = wMap.get(k);
    if (b) b.total += r.amount || 0;
  });

  // Monthly — last 12 months
  const monthly: (SeriesPoint & { key: string })[] = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthly.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleDateString("id-ID", { month: "short" }),
      total: 0,
    });
  }
  const mMap = new Map(monthly.map((x) => [x.key, x]));
  rows.forEach((r) => {
    const b = mMap.get(r.created_at.slice(0, 7));
    if (b) b.total += r.amount || 0;
  });

  const strip = (a: (SeriesPoint & { key: string })[]): SeriesPoint[] =>
    a.map(({ label, total }) => ({ label, total }));
  return { daily: strip(daily), weekly: strip(weekly), monthly: strip(monthly) };
}
