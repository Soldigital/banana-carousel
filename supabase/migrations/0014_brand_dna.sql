-- 0014_brand_dna.sql
-- C4 AI Brand DNA. ADDITIVE: one nullable jsonb column on brand_profiles to
-- store the AI-generated brand DNA. RLS already covers it (brand_profiles_all_own).
alter table public.brand_profiles add column if not exists brand_dna jsonb;
