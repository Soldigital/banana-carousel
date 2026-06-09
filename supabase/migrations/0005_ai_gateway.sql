-- 0005_ai_gateway.sql
-- BYOK AI Gateway: per-user provider keys (encrypted at rest) + health log.
-- Additive only — does not touch existing tables/columns. Safe to run on live DB.

-- ---------------------------------------------------------------------------
-- Provider keys. One row per (user, provider, key). The app layer enforces
-- a max of 5 enabled keys per provider. The plaintext key is NEVER stored:
-- key_ciphertext is AES-256-GCM, encrypted server-side with AI_KEYS_ENC_SECRET.
-- Only key_last4 is kept for masked display.
-- ---------------------------------------------------------------------------
create table if not exists public.ai_provider_keys (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  provider        text not null check (provider in ('gemini', 'openrouter', 'groq')),
  label           text,
  key_ciphertext  text not null,
  key_last4       text not null,
  enabled         boolean not null default true,
  created_at      timestamptz not null default now()
);

create index if not exists ai_provider_keys_user_idx
  on public.ai_provider_keys (user_id, provider);

alter table public.ai_provider_keys enable row level security;

-- Users may READ their own keys (masked columns only ever returned by the API
-- layer). All writes go through service-role API routes, which build the
-- ciphertext server-side — so there is intentionally no user insert/update/delete
-- policy here.
drop policy if exists ai_keys_select_own on public.ai_provider_keys;
create policy ai_keys_select_own on public.ai_provider_keys
  for select using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Health log. Durable record of each attempt (sampled). Hot reads come from
-- Redis; this table backs the per-user monitoring panel and admin aggregates.
-- ---------------------------------------------------------------------------
create table if not exists public.ai_key_health (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  provider    text not null,
  key_id      uuid references public.ai_provider_keys(id) on delete cascade,
  model       text,
  ok          boolean not null,
  latency_ms  integer,
  error_code  text,
  created_at  timestamptz not null default now()
);

create index if not exists ai_key_health_user_idx
  on public.ai_key_health (user_id, created_at desc);

alter table public.ai_key_health enable row level security;

drop policy if exists ai_health_select_own on public.ai_key_health;
create policy ai_health_select_own on public.ai_key_health
  for select using (auth.uid() = user_id);
