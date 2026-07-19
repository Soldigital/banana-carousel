-- 0013_affiliate.sql
-- C3 Affiliate / referral system. ADDITIVE. A Pro user enrolls, gets a referral
-- code, and picks ONE reward type: 'commission' (% of referred purchases → a
-- ledger balance the owner pays out manually) OR 'bonus' (+days of access per
-- referral). Attribution: a /ref/<code> cookie → pending_referrals at checkout →
-- consumed on the paid grant (orders.referred_by). No entitlement-gate change.

create table if not exists public.affiliates (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null unique references auth.users(id) on delete cascade,
  code             text not null unique,
  reward_type      text not null default 'commission' check (reward_type in ('commission', 'bonus')),
  commission_rate  numeric not null default 0.20,   -- 0.20 / 0.25 / 0.30
  referral_count   integer not null default 0,
  balance          numeric not null default 0,      -- unpaid commission (Rp)
  created_at       timestamptz not null default now()
);
create index if not exists affiliates_code_idx on public.affiliates (code);

alter table public.affiliates enable row level security;
drop policy if exists affiliates_select_own on public.affiliates;
create policy affiliates_select_own on public.affiliates
  for select using (auth.uid() = user_id);
-- Writes (enroll, set reward, reward accrual) go through the service-role client.

-- Per-referral commission entries (the payout ledger).
create table if not exists public.affiliate_earnings (
  id            uuid primary key default gen_random_uuid(),
  affiliate_id  uuid not null references public.affiliates(id) on delete cascade,
  buyer_email   text,
  order_trx     text,
  amount        numeric not null default 0,
  paid          boolean not null default false,
  created_at    timestamptz not null default now()
);
create index if not exists affiliate_earnings_aff_idx on public.affiliate_earnings (affiliate_id);

alter table public.affiliate_earnings enable row level security;
drop policy if exists affiliate_earnings_select_own on public.affiliate_earnings;
create policy affiliate_earnings_select_own on public.affiliate_earnings
  for select using (
    affiliate_id in (select id from public.affiliates where user_id = auth.uid())
  );

-- Pending attribution (buyer email → affiliate), set at checkout, consumed on the
-- paid grant. Service-role only.
create table if not exists public.pending_referrals (
  email         text primary key,
  affiliate_id  uuid not null references public.affiliates(id) on delete cascade,
  created_at    timestamptz not null default now()
);
alter table public.pending_referrals enable row level security;
-- No user policy.

-- Which affiliate (if any) a paid order is attributed to.
alter table public.orders add column if not exists referred_by uuid;
create index if not exists orders_referred_by_idx on public.orders (referred_by);
