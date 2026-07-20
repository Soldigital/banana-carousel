import { HistoryPanel } from "@/components/history/HistoryPanel";
import { LegacyHistoryGrid } from "@/components/dashboard/LegacyHistoryGrid";
import { listCarousels } from "@/lib/data/carousels";
import { USE_HISTORY_V2 } from "@/lib/config/flags";

export const dynamic = "force-dynamic";

export default async function DashboardHistoryPage() {
  // v2 (search/filter/recycle bin) behind a flag, otherwise the original
  // simple grid (instant rollback) — same condition as before the redesign.
  if (USE_HISTORY_V2) {
    return <HistoryPanel />;
  }
  const carousels = await listCarousels();
  return <LegacyHistoryGrid carousels={carousels} />;
}
