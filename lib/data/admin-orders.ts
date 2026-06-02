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
  const result: AdminOrder[] = [];
  for (const o of orders) {
    let proofSignedUrl: string | null = null;
    if (o.proof_url) {
      const { data: signed } = await admin.storage
        .from("transfer-proofs")
        .createSignedUrl(o.proof_url, SIGNED_URL_TTL);
      proofSignedUrl = signed?.signedUrl ?? null;
    }
    result.push({ ...o, proofSignedUrl });
  }
  return result;
}
