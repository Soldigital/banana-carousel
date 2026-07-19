-- 0012_promo.sql
-- C2 Promo Code system. ADDITIVE. Usage is tracked via the existing `orders`
-- table (orders.promo_code) — no separate redemptions table — so a code only
-- counts when a real grant/order happens. Admin-managed via the service-role
-- client; no user-facing RLS policy on promo_codes (server validates).

create table if not exists public.promo_codes (
  id              uuid primary key default gen_random_uuid(),
  code            text not null unique,
  name            text,
  type            text not null check (type in ('fixed', 'percentage', 'trial', 'upgrade')),
  value           numeric not null default 0,
  starts_at       timestamptz,
  ends_at         timestamptz,
  max_usage       integer,            -- null = unlimited
  per_user_limit  integer not null default 1,
  active          boolean not null default true,
  created_at      timestamptz not null default now(),
  created_by      uuid
);

alter table public.promo_codes enable row level security;
-- No user policy: all reads/writes go through the service-role client after
-- server-side admin/auth checks (mirrors ai_provider_keys writes).

-- Redemption ledger = orders.promo_code. Usage = count(orders where promo_code).
alter table public.orders add column if not exists promo_code text;
create index if not exists orders_promo_code_idx on public.orders (promo_code);
