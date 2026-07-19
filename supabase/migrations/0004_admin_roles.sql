-- Banana Carousel — editable user name + Supervisor role.
-- Run in Supabase SQL Editor. Safe to re-run.

alter table public.profiles
  add column if not exists name text;

alter table public.profiles
  add column if not exists role text not null default 'user';

-- Constrain role values (drop+recreate so re-runs are safe).
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check check (role in ('user', 'supervisor'));
