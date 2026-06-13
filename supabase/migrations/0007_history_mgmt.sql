-- 0007_history_mgmt.sql
-- History Management: soft-delete + recycle bin, status, reuse counter, fast
-- search. ADDITIVE ONLY — every column has a safe default or is generated, so
-- the existing client-side insert (lib/data/save-carousel.ts) keeps working
-- unchanged and all existing rows remain valid (deleted_at NULL = active,
-- status 'success'). Safe to run on the live DB. No data is dropped or renamed.

-- Trigram extension for fast substring search (ILIKE '%q%') on search_text.
create extension if not exists pg_trgm;

-- ---------------------------------------------------------------------------
-- New columns on the existing carousels table.
-- ---------------------------------------------------------------------------
-- Soft delete: NULL = active history; non-null = in the Recycle Bin since then.
alter table public.carousels
  add column if not exists deleted_at timestamptz;

-- Status, prepared for success/failed/draft. Today only 'success' is written.
alter table public.carousels
  add column if not exists status text not null default 'success';
alter table public.carousels
  drop constraint if exists carousels_status_check;
alter table public.carousels
  add constraint carousels_status_check
  check (status in ('success', 'failed', 'draft'));

-- "Most Used" sort: bumped each time a carousel is re-opened from history.
alter table public.carousels
  add column if not exists reuse_count integer not null default 0;

-- Denormalized, lowercased search blob over the user-meaningful fields. STORED
-- generated column so it stays in sync automatically and can back a GIN index.
-- All operands (jsonb ->>, lower, coalesce, ||) are immutable.
alter table public.carousels
  add column if not exists search_text text
  generated always as (
    lower(
      coalesce(title, '') || ' ' ||
      coalesce(input ->> 'topic', '') || ' ' ||
      coalesce(input ->> 'brandName', '') || ' ' ||
      coalesce(input ->> 'audience', '') || ' ' ||
      coalesce(input ->> 'goal', '') || ' ' ||
      coalesce(input ->> 'customStyleNotes', '') || ' ' ||
      coalesce(input ->> 'dominantColors', '') || ' ' ||
      coalesce(input ->> 'stylePresetId', '') || ' ' ||
      coalesce(input ->> 'ctaStyle', '') || ' ' ||
      coalesce(output ->> 'carousel_title', '')
    )
  ) stored;

-- Slide count for list display without shipping the full output jsonb.
alter table public.carousels
  add column if not exists slide_count integer
  generated always as (
    case when jsonb_typeof(output -> 'slides') = 'array'
      then jsonb_array_length(output -> 'slides')
      else 0
    end
  ) stored;

-- ---------------------------------------------------------------------------
-- Indexes for the new access paths.
-- ---------------------------------------------------------------------------
-- Active history list / keyset pagination (newest first).
create index if not exists carousels_user_active_created_idx
  on public.carousels (user_id, created_at desc)
  where deleted_at is null;

-- Recycle bin list (most recently deleted first) + purge scan.
create index if not exists carousels_user_deleted_idx
  on public.carousels (user_id, deleted_at)
  where deleted_at is not null;

-- "Most Used" sort over active rows.
create index if not exists carousels_user_reuse_idx
  on public.carousels (user_id, reuse_count desc)
  where deleted_at is null;

-- Fast substring search.
create index if not exists carousels_search_trgm_idx
  on public.carousels using gin (search_text gin_trgm_ops);

-- ---------------------------------------------------------------------------
-- Summary view for list/search/recycle-bin reads. Excludes the heavy input/
-- output jsonb so 10k+ rows stay light. security_invoker => the base table's
-- RLS (carousels_all_own) applies to whoever queries the view, so users only
-- ever see their own rows. The full record is fetched from the base table by id
-- only when a carousel is opened.
-- ---------------------------------------------------------------------------
create or replace view public.carousel_list
  with (security_invoker = on) as
  select
    id,
    user_id,
    title,
    status,
    created_at,
    deleted_at,
    reuse_count,
    slide_count,
    input ->> 'stylePresetId' as style_preset_id,
    output ->> 'carousel_title' as carousel_title,
    search_text
  from public.carousels;
