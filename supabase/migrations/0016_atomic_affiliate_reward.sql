-- Banana Carousel — atomic affiliate reward accounting.
-- Safe to re-run.
--
-- lib/data/affiliate.ts previously did a read-modify-write on real payout money:
--
--   const count = (aff.referral_count ?? 0) + 1;
--   await admin.from("affiliates")
--     .update({ referral_count: count, balance: (aff.balance ?? 0) + amount })
--
-- Two conversions for the same affiliate landing concurrently both read the old
-- balance and the second write silently discards the first commission. This
-- replaces the read-modify-write with a single in-database increment, so the
-- update is atomic under Postgres row locking regardless of concurrency.
--
-- SECURITY DEFINER + a pinned search_path, and EXECUTE revoked from everyone but
-- service_role — the same hardening applied to claim_founding_number in 0011.
-- Affiliates must never be able to credit their own balance directly.

create or replace function public.increment_affiliate_reward(
  p_affiliate_id uuid,
  p_amount       integer default 0
)
returns table (referral_count integer, balance integer)
language sql
security definer
set search_path = public
as $$
  update public.affiliates a
     set referral_count = coalesce(a.referral_count, 0) + 1,
         balance        = coalesce(a.balance, 0) + coalesce(p_amount, 0)
   where a.id = p_affiliate_id
  returning a.referral_count, a.balance;
$$;

revoke execute on function public.increment_affiliate_reward(uuid, integer) from public;
revoke execute on function public.increment_affiliate_reward(uuid, integer) from anon;
revoke execute on function public.increment_affiliate_reward(uuid, integer) from authenticated;
grant  execute on function public.increment_affiliate_reward(uuid, integer) to service_role;
