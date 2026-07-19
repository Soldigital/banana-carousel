-- 0009_brand_profile_v2.sql
-- Phase A (V2 business/growth): brand-profile field expansion + username-position
-- defaults, and allow failed/draft history rows with no output. ADDITIVE ONLY —
-- every column is nullable; no existing data changed. Safe on the live DB.

-- ---------------------------------------------------------------------------
-- Brand profile extra fields. RLS (brand_profiles_all_own) already covers them.
-- ---------------------------------------------------------------------------
alter table public.brand_profiles add column if not exists secondary_color text;
alter table public.brand_profiles add column if not exists target_audience text;
alter table public.brand_profiles add column if not exists tone_of_voice text;
alter table public.brand_profiles add column if not exists default_language text;
alter table public.brand_profiles add column if not exists default_slide_count integer;
-- Username (@handle) watermark defaults.
alter table public.brand_profiles add column if not exists username_position text;
alter table public.brand_profiles add column if not exists username_size text;
alter table public.brand_profiles add column if not exists username_style text;

-- ---------------------------------------------------------------------------
-- Allow Failed/Draft history rows that have no generated output yet. Existing
-- rows keep their output; the carousel_list view and save-carousel insert are
-- unaffected. (A draft/failed record stores the input only.)
-- ---------------------------------------------------------------------------
alter table public.carousels alter column output drop not null;
