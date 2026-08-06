
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS banner_url text,
  ADD COLUMN IF NOT EXISTS shop_sections text[] NOT NULL DEFAULT ARRAY['highlight','products','about']::text[],
  ADD COLUMN IF NOT EXISTS highlight_listing_id uuid;

ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS moderation_status text NOT NULL DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS moderation_note text;

DO $$ BEGIN
  ALTER TABLE public.listings ADD CONSTRAINT listings_moderation_status_check
    CHECK (moderation_status = ANY (ARRAY['approved','pending','rejected']));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Reports -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type text NOT NULL CHECK (target_type = ANY (ARRAY['listing','shop','chat'])),
  target_id uuid NOT NULL,
  reason text NOT NULL,
  note text,
  status text NOT NULL DEFAULT 'open' CHECK (status = ANY (ARRAY['open','resolved','dismissed'])),
  admin_note text,
  resolved_by uuid,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.reports TO authenticated;
GRANT ALL ON public.reports TO service_role;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reports_insert_own" ON public.reports;
CREATE POLICY "reports_insert_own" ON public.reports FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = reporter_id);
DROP POLICY IF EXISTS "reports_select_own_or_admin" ON public.reports;
CREATE POLICY "reports_select_own_or_admin" ON public.reports FOR SELECT TO authenticated
  USING (auth.uid() = reporter_id OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'founder'));
DROP POLICY IF EXISTS "reports_update_admin" ON public.reports;
CREATE POLICY "reports_update_admin" ON public.reports FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'founder'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'founder'));

DROP TRIGGER IF EXISTS reports_updated_at ON public.reports;
CREATE TRIGGER reports_updated_at BEFORE UPDATE ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Reviews -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL,
  buyer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  body text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (order_id, listing_id, buyer_id)
);

GRANT SELECT ON public.reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reviews_public_read" ON public.reviews;
CREATE POLICY "reviews_public_read" ON public.reviews FOR SELECT USING (true);

DROP POLICY IF EXISTS "reviews_insert_buyer" ON public.reviews;
CREATE POLICY "reviews_insert_buyer" ON public.reviews FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = buyer_id
    AND EXISTS (
      SELECT 1 FROM public.order_items oi
      JOIN public.orders o ON o.id = oi.order_id
      WHERE oi.order_id = reviews.order_id
        AND oi.listing_id = reviews.listing_id
        AND o.buyer_id = auth.uid()
        AND o.status IN ('paid','fulfilled')
    )
  );

DROP POLICY IF EXISTS "reviews_update_own" ON public.reviews;
CREATE POLICY "reviews_update_own" ON public.reviews FOR UPDATE TO authenticated
  USING (auth.uid() = buyer_id) WITH CHECK (auth.uid() = buyer_id);

DROP POLICY IF EXISTS "reviews_delete_own_or_admin" ON public.reviews;
CREATE POLICY "reviews_delete_own_or_admin" ON public.reviews FOR DELETE TO authenticated
  USING (auth.uid() = buyer_id OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'founder'));

DROP TRIGGER IF EXISTS reviews_updated_at ON public.reviews;
CREATE TRIGGER reviews_updated_at BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Daily listing limit --------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_daily_listing_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _count integer;
BEGIN
  IF public.has_role(NEW.seller_id,'admin') OR public.has_role(NEW.seller_id,'founder') THEN
    RETURN NEW;
  END IF;
  SELECT count(*) INTO _count FROM public.listings
   WHERE seller_id = NEW.seller_id
     AND created_at >= date_trunc('day', now());
  IF _count >= 3 THEN
    RAISE EXCEPTION 'Tageslimit erreicht: Du kannst maximal 3 neue Produkte pro Tag einstellen.';
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_daily_listing_limit ON public.listings;
CREATE TRIGGER trg_daily_listing_limit BEFORE INSERT ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.enforce_daily_listing_limit();

-- Rating aggregation helper -------------------------------------------
CREATE OR REPLACE FUNCTION public.listing_rating(_listing_id uuid)
RETURNS TABLE(avg_rating numeric, review_count bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT round(avg(rating)::numeric,2), count(*) FROM public.reviews WHERE listing_id = _listing_id $$;
