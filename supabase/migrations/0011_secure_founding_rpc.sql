-- 0011_secure_founding_rpc.sql
-- Security hardening: claim_founding_number() must be callable ONLY by the
-- server (service role), never by anon/authenticated via PostgREST RPC.
-- Without this, anyone could call it to burn the 100 Founding slots / set
-- tier='founding' on arbitrary profiles (a griefing/DoS on the promo — it does
-- NOT grant paid access, but still abusive). The grant path uses the
-- service-role admin client, which retains execute via the explicit grant below.

revoke execute on function public.claim_founding_number(text) from public;
revoke execute on function public.claim_founding_number(text) from anon;
revoke execute on function public.claim_founding_number(text) from authenticated;
grant execute on function public.claim_founding_number(text) to service_role;
