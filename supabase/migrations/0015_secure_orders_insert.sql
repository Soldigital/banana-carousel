-- Banana Carousel — close the self-service Pro escalation via public.orders.
-- Safe to re-run.
--
-- The old `orders_insert_own` policy constrained ONLY user_id:
--
--   create policy orders_insert_own on public.orders
--     for insert with check (auth.uid() = user_id);
--
-- status / amount / access_code / promo_code were left unconstrained, so any
-- logged-in user could POST /rest/v1/orders with {status: 'approved', amount: 0}
-- against their own uid. reconcileOnLogin() (lib/license/entitlement.ts) then
-- runs as SERVICE ROLE on the next /dashboard load, sees an "approved" order for
-- that email, and sets profiles.is_pro = true — free lifetime Pro, no payment.
--
-- The policy was also dead weight: EVERY write to orders already goes through
-- the service-role client (lib/license/entitlement.ts grantEntitlementByEmail,
-- app/api/manual-order/route.ts), which bypasses RLS entirely. Nothing in the
-- app ever inserted an order using the user's own session. So we drop it
-- outright rather than narrowing it — no legitimate path loses anything.
--
-- orders_select_own is intentionally KEPT: users must still read their own
-- order history.

drop policy if exists orders_insert_own on public.orders;

-- Defence in depth: RLS is the gate, but Supabase grants table privileges to
-- anon/authenticated by default. Remove write privileges entirely so a future
-- accidental permissive policy cannot re-open this hole on its own.
revoke insert, update, delete on public.orders from authenticated;
revoke insert, update, delete on public.orders from anon;
