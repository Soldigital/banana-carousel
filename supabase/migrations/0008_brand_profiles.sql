-- 0008_brand_profiles.sql
-- Brand Profiles + logo management. ADDITIVE ONLY — new table + new public
-- storage bucket; touches no existing table/column. Safe to run on the live DB.
-- The per-project logo override is stored inside the carousels `input` jsonb
-- (GeneratorInput), so no change to the carousels table is needed.

-- ---------------------------------------------------------------------------
-- One row per saved brand profile, owned by a user. Auto-fills the generator
-- and provides a default logo. The logo image itself lives in the brand-logos
-- bucket; logo_path is its object path.
-- ---------------------------------------------------------------------------
create table if not exists public.brand_profiles (
  id                       uuid primary key default gen_random_uuid(),
  user_id                  uuid not null references auth.users(id) on delete cascade,
  name                     text not null,
  website                  text,
  instagram_username       text,
  account_name             text,
  cta_style                text,
  brand_color              text,
  default_style_preset_id  text,
  logo_path                text,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

create index if not exists brand_profiles_user_idx
  on public.brand_profiles (user_id, created_at desc);

alter table public.brand_profiles enable row level security;

-- Full ownership (CRUD) by the owner, same pattern as carousels.
drop policy if exists brand_profiles_all_own on public.brand_profiles;
create policy brand_profiles_all_own on public.brand_profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Public storage bucket for brand logos. Public so logo URLs are CDN-served
-- with no signed-URL round-trip (logos are not sensitive). Writes are still
-- restricted to each user's own uid/ prefix.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('brand-logos', 'brand-logos', true)
on conflict (id) do nothing;

drop policy if exists brand_logos_insert_own on storage.objects;
create policy brand_logos_insert_own on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'brand-logos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists brand_logos_update_own on storage.objects;
create policy brand_logos_update_own on storage.objects
  for update to authenticated
  using (
    bucket_id = 'brand-logos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists brand_logos_delete_own on storage.objects;
create policy brand_logos_delete_own on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'brand-logos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
