-- 0006_perf_indexes.sql
-- Additive performance indexes. No data change, no table/column change — safe to
-- run on the live DB. Speeds up dashboard/admin queries identified in the perf
-- audit (reconcileOnLogin full-table UPDATE, admin stats/user list, key counts).

-- reconcileOnLogin: UPDATE orders WHERE email = ? AND user_id IS NULL  (runs on
-- every dashboard load) + the paid-order lookup by email+status.
create index if not exists orders_email_user_id_idx
  on public.orders (email, user_id);
create index if not exists orders_email_status_idx
  on public.orders (email, status);

-- Admin "pending manual orders" count/list: WHERE method = ? AND status = ?.
create index if not exists orders_method_status_idx
  on public.orders (method, status);

-- Admin user list ordered by created_at desc, and the pro-user count.
create index if not exists profiles_created_at_idx
  on public.profiles (created_at desc);
create index if not exists profiles_is_pro_idx
  on public.profiles (is_pro)
  where is_pro = true;

-- Gateway key loading: WHERE user_id = ? AND enabled = true.
create index if not exists ai_provider_keys_user_enabled_idx
  on public.ai_provider_keys (user_id, enabled);
