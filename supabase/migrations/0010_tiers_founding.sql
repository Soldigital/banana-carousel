-- 0010_tiers_founding.sql
-- Phase B (V2 monetization foundation): tier label + Founding Member system.
-- ADDITIVE — does NOT change the entitlement gate (is_pro stays the access
-- boolean). Adds a tier label, a hard-capped 100-slot Founding counter, and a
-- public Founder Wall display preference. Safe on the live DB; idempotent.

-- ---------------------------------------------------------------------------
-- profiles: tier metadata + founding member fields (all additive/defaulted).
-- ---------------------------------------------------------------------------
alter table public.profiles add column if not exists tier text not null default 'free';
alter table public.profiles drop constraint if exists profiles_tier_check;
alter table public.profiles add constraint profiles_tier_check
  check (tier in ('free', 'founding', 'lifetime', 'pro_annual'));

alter table public.profiles add column if not exists tier_expires_at timestamptz;
alter table public.profiles add column if not exists founder_number integer;
alter table public.profiles add column if not exists founder_alias text;
alter table public.profiles add column if not exists founder_display text not null default 'name';
alter table public.profiles drop constraint if exists profiles_founder_display_check;
alter table public.profiles add constraint profiles_founder_display_check
  check (founder_display in ('name', 'username', 'number'));

-- One founder_number per user (allows many NULLs).
create unique index if not exists profiles_founder_number_uniq
  on public.profiles (founder_number) where founder_number is not null;

-- ---------------------------------------------------------------------------
-- Grandfather existing paid users. Assign founder_number by signup order; the
-- first 100 become 'founding', the rest 'lifetime'. is_pro is untouched, so
-- entitlement/access is unchanged. Idempotent: only fills rows still missing a
-- number, continuing from the current max.
-- ---------------------------------------------------------------------------
with ranked as (
  select id,
         row_number() over (order by created_at, id)
           + coalesce((select max(founder_number) from public.profiles), 0) as rn
  from public.profiles
  where is_pro = true and founder_number is null
)
update public.profiles p
set founder_number = r.rn,
    tier = case when r.rn <= 100 then 'founding' else 'lifetime' end
from ranked r
where p.id = r.id;

-- ---------------------------------------------------------------------------
-- Atomic Founding-slot claim. Serialized by an advisory lock so concurrent
-- grants can NEVER hand out more than 100 slots. Idempotent per user. Assigns
-- the number + sets tier='founding' in the same transaction, or returns NULL
-- when the 100 slots are full (caller then treats the buyer as 'lifetime').
-- Called server-side via the service-role client from the grant path.
-- ---------------------------------------------------------------------------
create or replace function public.claim_founding_number(p_email text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id   uuid;
  v_num  integer;
  v_cnt  integer;
begin
  perform pg_advisory_xact_lock(902001);

  select id, founder_number into v_id, v_num
  from public.profiles where email = p_email;

  if v_id is null then
    return null;                       -- no account row yet; assign later
  end if;
  if v_num is not null then
    return v_num;                      -- already a founder (idempotent)
  end if;

  select count(*) into v_cnt from public.profiles where founder_number is not null;
  if v_cnt >= 100 then
    return null;                       -- slots full
  end if;

  select coalesce(max(founder_number), 0) + 1 into v_num from public.profiles;
  update public.profiles
    set founder_number = v_num, tier = 'founding'
    where id = v_id;
  return v_num;
end;
$$;
