import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  FOUNDING_CAP,
  FOUNDING_PRICE,
  LIFETIME_PRICE,
  FOUNDING_PRODUCT_NAME,
  PRODUCT_NAME,
  ANNUAL_PRICE,
  ANNUAL_FOUNDING_PRICE,
  ANNUAL_PRODUCT_NAME,
  ANNUAL_FOUNDING_PRODUCT_NAME,
} from "@/lib/config/payment";

export interface FoundingStatus {
  taken: number;
  cap: number;
  remaining: number;
  founding: boolean; // true while founding slots remain
  /** Lifetime price — founding price while slots remain, else full price. */
  price: number;
  productName: string;
  /**
   * Annual price. Also discounted during the founding window, but buying it
   * does NOT consume a founding slot (setProfilePro never assigns a tier for
   * annual), so `taken`/`remaining` are unaffected by annual sales.
   */
  annualPrice: number;
  annualProductName: string;
}

// Live Founding-Member status (service-role count of assigned founder_numbers).
// Resilient: if migration 0010 isn't applied yet, falls back to founding-open
// with the founding price so the buy flow never breaks.
export async function getFoundingStatus(): Promise<FoundingStatus> {
  const cap = FOUNDING_CAP;
  let taken = 0;
  try {
    const admin = createAdminClient();
    const { count, error } = await admin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .not("founder_number", "is", null);
    if (!error) taken = count ?? 0;
  } catch {
    /* fall through to founding-open default */
  }
  const founding = taken < cap;
  return {
    taken,
    cap,
    remaining: Math.max(cap - taken, 0),
    founding,
    price: founding ? FOUNDING_PRICE : LIFETIME_PRICE,
    productName: founding ? FOUNDING_PRODUCT_NAME : PRODUCT_NAME,
    annualPrice: founding ? ANNUAL_FOUNDING_PRICE : ANNUAL_PRICE,
    annualProductName: founding
      ? ANNUAL_FOUNDING_PRODUCT_NAME
      : ANNUAL_PRODUCT_NAME,
  };
}
