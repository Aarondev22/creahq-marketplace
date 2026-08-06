
DROP FUNCTION IF EXISTS public.listing_rating(uuid);
REVOKE ALL ON FUNCTION public.enforce_daily_listing_limit() FROM PUBLIC, anon, authenticated;
