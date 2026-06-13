// Application-level types mirroring the Supabase schema (see
// supabase/migrations/0001_init.sql). Kept hand-written (not generated) to stay
// dependency-light; keep in sync with the migration.

import type { CarouselOutput, GeneratorInput } from "./carousel";

export type OrderMethod = "ipaymu" | "manual" | "promo";
export type OrderStatus = "pending" | "paid" | "approved" | "rejected";

export interface Profile {
  id: string; // = auth.users.id
  email: string;
  whatsapp: string | null;
  is_admin: boolean;
  is_pro: boolean;
  access_code: string | null;
  created_at: string;
}

export interface Order {
  id: string;
  user_id: string | null;
  email: string;
  name: string | null;
  whatsapp: string | null;
  method: OrderMethod;
  status: OrderStatus;
  amount: number;
  proof_url: string | null;
  access_code: string | null;
  trx_id: string | null;
  created_at: string;
  approved_at: string | null;
  approved_by: string | null;
}

export interface BrandProfile {
  id: string;
  user_id: string;
  name: string;
  website: string | null;
  instagram_username: string | null;
  account_name: string | null;
  cta_style: string | null;
  brand_color: string | null;
  default_style_preset_id: string | null;
  logo_path: string | null;
  // Phase A (V2) additions — all nullable, backward compatible.
  secondary_color: string | null;
  target_audience: string | null;
  tone_of_voice: string | null;
  default_language: string | null;
  default_slide_count: number | null;
  username_position: string | null;
  username_size: string | null;
  username_style: string | null;
  created_at: string;
  updated_at: string;
}

export type CarouselStatus = "success" | "failed" | "draft";

export interface CarouselRecord {
  id: string;
  user_id: string;
  title: string | null;
  input: GeneratorInput;
  output: CarouselOutput | null; // null for failed/draft rows (input-only)
  created_at: string;
  // Added in migration 0007 (history management). Optional so older code paths
  // and the existing client-side insert remain valid without specifying them.
  deleted_at?: string | null;
  status?: CarouselStatus;
  reuse_count?: number;
}

// Lightweight row from the `carousel_list` view — excludes the heavy input/
// output jsonb so history lists stay fast at 10k+ rows.
export interface CarouselSummary {
  id: string;
  user_id: string;
  title: string | null;
  status: CarouselStatus;
  created_at: string;
  deleted_at: string | null;
  reuse_count: number;
  slide_count: number;
  style_preset_id: string | null;
  carousel_title: string | null;
}
