-- Banana Carousel — Super Admin panel additions.
-- Run in Supabase SQL Editor. Safe to re-run.

-- 1) Allow admin-added promo orders.
alter table public.orders drop constraint if exists orders_method_check;
alter table public.orders
  add constraint orders_method_check
  check (method in ('ipaymu', 'manual', 'promo'));

-- 2) Soft-ban flag on profiles.
alter table public.profiles
  add column if not exists banned boolean not null default false;

-- 3) Key/value settings store (tutorial content, maintenance announcement).
create table if not exists public.app_settings (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.app_settings enable row level security;

-- Publicly readable (tutorial + announcement are shown in the app).
drop policy if exists app_settings_read_all on public.app_settings;
create policy app_settings_read_all on public.app_settings
  for select using (true);
-- Writes only via service role (no insert/update/delete policy for anon/auth).
