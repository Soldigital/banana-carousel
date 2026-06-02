// Application-level types mirroring the Supabase schema (see
// supabase/migrations/0001_init.sql). Kept hand-written (not generated) to stay
// dependency-light; keep in sync with the migration.

import type { CarouselOutput, GeneratorInput } from "./carousel";

export type OrderMethod = "ipaymu" | "manual";
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

export interface CarouselRecord {
  id: string;
  user_id: string;
  title: string | null;
  input: GeneratorInput;
  output: CarouselOutput;
  created_at: string;
}
