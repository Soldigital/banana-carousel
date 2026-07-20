import { formatIDR } from "@/lib/config/payment";
import type { AdminStats } from "@/lib/data/admin-stats";

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card/40 p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold">{value}</p>
    </div>
  );
}

// Extracted verbatim from the former app/admin/AdminClient.tsx `Overview()`
// StatCard grid half — logic unchanged, only relocated to /admin.
export function StatsGrid({ stats }: { stats: AdminStats }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <StatCard label="Total Omset" value={formatIDR(stats.totalRevenue)} />
      <StatCard label="Total User" value={String(stats.userCount)} />
      <StatCard label="User Pro" value={String(stats.proCount)} />
      <StatCard label="Transaksi" value={String(stats.paidCount)} />
    </div>
  );
}
