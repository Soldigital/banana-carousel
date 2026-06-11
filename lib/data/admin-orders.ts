import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Order } from "@/types/db";

export interface AdminOrder extends Order {
  proofSignedUrl: string | null;
}

const SIGNED_URL_TTL = 60 * 30; // 30 minutes

// Lists pending manual-transfer orders (service role) with short-lived signed
// URLs for each proof image. Admin-only — callers must verify admin first.
export async function listPendingManualOrders(): Promise<AdminOrder[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("orders")
    .select("*")
    .eq("method", "manual")
    .eq("status", "pending")
    .order("created_at", { ascending: true });
  if (error) {
    console.error("[admin-orders] list failed", error.message);
    return [];
  }

  const orders = (data as Order[]) ?? [];

  // Sign all proof URLs in parallel (was sequential — N storage round-trips
  // added up to seconds on a busy approval queue).
  const signed = await Promise.all(
    orders.map(async (o): Promise<string | null> => {
      if (!o.proof_url) return null;
      const { data: s } = await admin.storage
        .from("transfer-proofs")
        .createSignedUrl(o.proof_url, SIGNED_URL_TTL);
      return s?.signedUrl ?? null;
    }),
  );

  return orders.map((o, i) => ({ ...o, proofSignedUrl: signed[i] }));
}
