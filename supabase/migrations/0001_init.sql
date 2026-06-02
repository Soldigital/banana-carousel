-- Banana Carousel — initial schema (accounts, orders, carousel history)
-- Run in Supabase Dashboard → SQL Editor (or `supabase db push`).
-- Safe to re-run: uses IF NOT EXISTS / CREATE OR REPLACE / DROP POLICY IF EXISTS.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text not null,
  whatsapp    text,
  is_admin    boolean not null default false,
  is_pro      boolean not null default false,   -- entitlement fast-path
  access_code text,                             -- last issued Kode Akses
  created_at  timestamptz not null default now()
);

create table if not exists public.orders (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users (id) on delete set null, -- may precede signup
  email       text not null,
  name        text,
  whatsapp    text,
  method      text not null check (method in ('ipaymu', 'manual')),
  status      text not null default 'pending'
              check (status in ('pending', 'paid', 'approved', 'rejected')),
  amount      integer not null,
  proof_url   text,                            -- manual: storage object path
  access_code text,
  trx_id      text,                            -- ipaymu idempotency
  created_at  timestamptz not null default now(),
  approved_at timestamptz,
  approved_by uuid references auth.users (id)
);
create index if not exists orders_email_idx  on public.orders (email);
create index if not exists orders_status_idx on public.orders (status);
create unique index if not exists orders_trx_id_key
  on public.orders (trx_id) where trx_id is not null;

create table if not exists public.carousels (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  title      text,
  input      jsonb not null,   -- GeneratorInput
  output     jsonb not null,   -- CarouselOutput
  created_at timestamptz not null default now()
);
create index if not exists carousels_user_created_idx
  on public.carousels (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Auto-create a profile row for each new auth user
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, coalesce(new.email, ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- Admin reads/writes go through the service-role client (bypasses RLS) AFTER
-- server-side admin verification — so we deliberately add NO admin policies
-- here (avoids recursive-RLS by re-querying profiles).
-- ---------------------------------------------------------------------------

alter table public.profiles  enable row level security;
alter table public.orders    enable row level security;
alter table public.carousels enable row level security;

-- profiles: a user can READ only their own row. There is deliberately NO user
-- UPDATE policy — otherwise a user could set their own is_pro/is_admin. All
-- profile writes (is_pro, is_admin, whatsapp, access_code) go via service role.
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select using (auth.uid() = id);

-- Remove the unsafe self-update policy if it was created by an earlier run.
drop policy if exists profiles_update_own on public.profiles;

-- orders: a user can read & insert their own; status changes only via service role
drop policy if exists orders_select_own on public.orders;
create policy orders_select_own on public.orders
  for select using (auth.uid() = user_id);

drop policy if exists orders_insert_own on public.orders;
create policy orders_insert_own on public.orders
  for insert with check (auth.uid() = user_id);

-- carousels: full ownership (select/insert/update/delete) of own rows
drop policy if exists carousels_all_own on public.carousels;
create policy carousels_all_own on public.carousels
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Storage: private bucket for manual-transfer proof screenshots
-- Reads happen only via service-role-generated signed URLs (admin dashboard).
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('transfer-proofs', 'transfer-proofs', false)
on conflict (id) do nothing;

-- Authenticated users may upload only under their own uid/ prefix.
drop policy if exists transfer_proofs_insert_own on storage.objects;
create policy transfer_proofs_insert_own on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'transfer-proofs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users may view their own uploads (admin uses signed URLs via service role).
drop policy if exists transfer_proofs_select_own on storage.objects;
create policy transfer_proofs_select_own on storage.objects
  for select to authenticated
  using (
    bucket_id = 'transfer-proofs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
