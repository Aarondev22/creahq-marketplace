ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS shipping_cents integer NOT NULL DEFAULT 0 CHECK (shipping_cents >= 0),
  ADD COLUMN IF NOT EXISTS shipping_address jsonb,
  ADD COLUMN IF NOT EXISTS discount_usage_recorded boolean NOT NULL DEFAULT false;

ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS shipping_cents integer NOT NULL DEFAULT 0 CHECK (shipping_cents >= 0);

UPDATE public.orders
SET discount_usage_recorded = true
WHERE discount_code_id IS NOT NULL
  AND stripe_session_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.discount_code_reservations (
  order_id uuid PRIMARY KEY REFERENCES public.orders(id) ON DELETE CASCADE,
  discount_code_id uuid NOT NULL REFERENCES public.discount_codes(id) ON DELETE CASCADE,
  stripe_session_id text UNIQUE,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours'),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS discount_code_reservations_active_idx
  ON public.discount_code_reservations(discount_code_id, expires_at);

ALTER TABLE public.discount_code_reservations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.discount_code_reservations FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.discount_code_reservations TO service_role;

CREATE OR REPLACE FUNCTION public.is_account_active()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND NOT p.banned
      AND (p.suspended_until IS NULL OR p.suspended_until <= now())
  );
$$;

REVOKE ALL ON FUNCTION public.is_account_active() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_account_active() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.redeem_founder_code(_code TEXT)
RETURNS TABLE(success BOOLEAN, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user UUID := auth.uid();
  _code_row public.founder_redeem_codes%ROWTYPE;
BEGIN
  IF _user IS NULL THEN
    RETURN QUERY SELECT false, 'Bitte melde dich an.';
    RETURN;
  END IF;

  IF NOT public.is_account_active() THEN
    RETURN QUERY SELECT false, 'Dein Konto ist derzeit pausiert oder gesperrt.';
    RETURN;
  END IF;

  SELECT * INTO _code_row
  FROM public.founder_redeem_codes
  WHERE upper(code) = upper(trim(_code))
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Code ungültig.';
    RETURN;
  END IF;

  IF _code_row.valid_until IS NOT NULL AND _code_row.valid_until <= now() THEN
    RETURN QUERY SELECT false, 'Dieser Code ist abgelaufen.';
    RETURN;
  END IF;

  IF _code_row.max_uses IS NOT NULL AND _code_row.used_count >= _code_row.max_uses THEN
    RETURN QUERY SELECT false, 'Dieser Code wurde bereits vollständig eingelöst.';
    RETURN;
  END IF;

  IF _code_row.code_type = 'pro' THEN
    UPDATE public.profiles
    SET is_pro = true,
        pro_expires_at = CASE
          WHEN _code_row.duration_days IS NULL THEN NULL
          WHEN is_pro AND pro_expires_at IS NULL THEN NULL
          WHEN is_pro AND pro_expires_at > now()
            THEN pro_expires_at + make_interval(days => _code_row.duration_days)
          ELSE now() + make_interval(days => _code_row.duration_days)
        END
    WHERE id = _user;
  ELSE
    INSERT INTO public.user_roles(user_id, role)
    VALUES (_user, _code_row.code_type::public.app_role)
    ON CONFLICT DO NOTHING;
  END IF;

  UPDATE public.founder_redeem_codes
  SET used_by = _user, used_at = now(), used_count = used_count + 1
  WHERE id = _code_row.id;

  RETURN QUERY SELECT true, 'Code erfolgreich eingelöst.';
END;
$$;

CREATE OR REPLACE FUNCTION public.reserve_discount_code(_code_id uuid, _order_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _code public.discount_codes%ROWTYPE;
  _reserved integer;
BEGIN
  SELECT * INTO _code
  FROM public.discount_codes
  WHERE id = _code_id
  FOR UPDATE;

  IF NOT FOUND
    OR NOT _code.active
    OR _code.owner_id IS NOT NULL
    OR _code.scope <> 'global'
    OR _code.kind <> 'percent'
    OR _code.amount NOT BETWEEN 1 AND 90
    OR _code.valid_from > now()
    OR (_code.valid_until IS NOT NULL AND _code.valid_until <= now())
  THEN
    RETURN false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.orders
    WHERE id = _order_id
      AND discount_code_id = _code_id
      AND status = 'pending'
  ) THEN
    RETURN false;
  END IF;

  DELETE FROM public.discount_code_reservations
  WHERE expires_at <= now();

  SELECT count(*) INTO _reserved
  FROM public.discount_code_reservations
  WHERE discount_code_id = _code_id
    AND expires_at > now()
    AND order_id <> _order_id;

  IF _code.max_uses IS NOT NULL AND _code.used_count + _reserved >= _code.max_uses THEN
    RETURN false;
  END IF;

  INSERT INTO public.discount_code_reservations(order_id, discount_code_id, expires_at)
  VALUES (_order_id, _code_id, now() + interval '24 hours')
  ON CONFLICT (order_id) DO UPDATE
    SET discount_code_id = EXCLUDED.discount_code_id,
        stripe_session_id = NULL,
        expires_at = EXCLUDED.expires_at
    WHERE public.discount_code_reservations.discount_code_id = EXCLUDED.discount_code_id;

  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION public.finalize_checkout_order(
  _order_id uuid,
  _stripe_session_id text,
  _amount_total integer,
  _currency text,
  _shipping_address jsonb
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _order public.orders%ROWTYPE;
BEGIN
  SELECT * INTO _order
  FROM public.orders
  WHERE id = _order_id
  FOR UPDATE;

  IF NOT FOUND OR _order.stripe_session_id IS DISTINCT FROM _stripe_session_id THEN
    RETURN false;
  END IF;

  IF _order.total_cents <> _amount_total
    OR lower(_order.currency) <> lower(_currency)
  THEN
    RETURN false;
  END IF;

  IF _order.status IN ('paid', 'fulfilled') THEN
    RETURN true;
  END IF;

  IF _order.status <> 'pending' THEN
    RETURN false;
  END IF;

  IF _order.discount_code_id IS NOT NULL AND NOT _order.discount_usage_recorded THEN
    IF NOT EXISTS (
      SELECT 1
      FROM public.discount_code_reservations
      WHERE order_id = _order.id
        AND discount_code_id = _order.discount_code_id
        AND stripe_session_id = _stripe_session_id
      FOR UPDATE
    ) THEN
      RETURN false;
    END IF;

    UPDATE public.discount_codes
    SET used_count = used_count + 1
    WHERE id = _order.discount_code_id;
  END IF;

  UPDATE public.orders
  SET status = 'paid',
      shipping_address = _shipping_address,
      discount_usage_recorded = (_order.discount_code_id IS NOT NULL)
  WHERE id = _order.id;

  DELETE FROM public.discount_code_reservations
  WHERE order_id = _order.id;

  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.release_checkout_order(_order_id uuid, _stripe_session_id text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _released boolean := false;
BEGIN
  UPDATE public.orders
  SET status = 'cancelled'
  WHERE id = _order_id
    AND stripe_session_id = _stripe_session_id
    AND status = 'pending';
  _released := FOUND;

  DELETE FROM public.discount_code_reservations
  WHERE order_id = _order_id
    AND stripe_session_id = _stripe_session_id;

  RETURN _released;
END;
$$;

REVOKE ALL ON FUNCTION public.reserve_discount_code(UUID, UUID) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.finalize_checkout_order(UUID, TEXT, INTEGER, TEXT, JSONB) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.release_checkout_order(UUID, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_discount_code(UUID, UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.finalize_checkout_order(UUID, TEXT, INTEGER, TEXT, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION public.release_checkout_order(UUID, TEXT) TO service_role;

ALTER TABLE public.listing_files ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.listing_files TO authenticated;
DROP POLICY IF EXISTS "sellers manage own listing files" ON public.listing_files;
CREATE POLICY "sellers manage own listing files" ON public.listing_files
  FOR ALL TO authenticated
  USING (
    seller_id = auth.uid()
    AND file_path LIKE auth.uid()::text || '/%'
    AND EXISTS (SELECT 1 FROM public.listings l WHERE l.id = listing_id AND l.seller_id = auth.uid())
  )
  WITH CHECK (
    seller_id = auth.uid()
    AND file_path LIKE auth.uid()::text || '/%'
    AND EXISTS (SELECT 1 FROM public.listings l WHERE l.id = listing_id AND l.seller_id = auth.uid())
  );

CREATE POLICY "sellers upload own listing files" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'listing-files'
    AND auth.uid()::text = (storage.foldername(name))[1]
    AND public.is_account_active()
  );
CREATE POLICY "listing file paths belong to uploader" ON storage.objects
  AS RESTRICTIVE FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id <> 'listing-files'
    OR auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "active accounts read listing file metadata" ON public.listing_files
  AS RESTRICTIVE FOR SELECT TO authenticated
  USING (public.is_account_active());

CREATE POLICY "active accounts write listing file metadata" ON public.listing_files
  AS RESTRICTIVE FOR INSERT TO authenticated
  WITH CHECK (public.is_account_active());

CREATE POLICY "active accounts update listing file metadata" ON public.listing_files
  AS RESTRICTIVE FOR UPDATE TO authenticated
  USING (public.is_account_active())
  WITH CHECK (public.is_account_active());

CREATE POLICY "active accounts delete listing file metadata" ON public.listing_files
  AS RESTRICTIVE FOR DELETE TO authenticated
  USING (public.is_account_active());

CREATE POLICY "active accounts update profiles" ON public.profiles
  AS RESTRICTIVE FOR UPDATE TO authenticated
  USING (public.is_account_active())
  WITH CHECK (public.is_account_active());
CREATE POLICY "active accounts insert profiles" ON public.profiles
  AS RESTRICTIVE FOR INSERT TO authenticated
  WITH CHECK (public.is_account_active());

CREATE POLICY "active accounts insert listings" ON public.listings
  AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK (public.is_account_active());
CREATE POLICY "active accounts read listings" ON public.listings
  AS RESTRICTIVE FOR SELECT TO authenticated USING (public.is_account_active());
CREATE POLICY "active accounts update listings" ON public.listings
  AS RESTRICTIVE FOR UPDATE TO authenticated
  USING (public.is_account_active()) WITH CHECK (public.is_account_active());
CREATE POLICY "active accounts delete listings" ON public.listings
  AS RESTRICTIVE FOR DELETE TO authenticated USING (public.is_account_active());

CREATE POLICY "active accounts insert favorites" ON public.favorites
  AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK (public.is_account_active());
CREATE POLICY "active accounts read favorites" ON public.favorites
  AS RESTRICTIVE FOR SELECT TO authenticated USING (public.is_account_active());
CREATE POLICY "active accounts delete favorites" ON public.favorites
  AS RESTRICTIVE FOR DELETE TO authenticated USING (public.is_account_active());

CREATE POLICY "active accounts insert conversations" ON public.conversations
  AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK (public.is_account_active());
CREATE POLICY "active accounts read conversations" ON public.conversations
  AS RESTRICTIVE FOR SELECT TO authenticated USING (public.is_account_active());
CREATE POLICY "active accounts update conversations" ON public.conversations
  AS RESTRICTIVE FOR UPDATE TO authenticated
  USING (public.is_account_active()) WITH CHECK (public.is_account_active());

CREATE POLICY "active accounts insert messages" ON public.messages
  AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK (public.is_account_active());
CREATE POLICY "active accounts read messages" ON public.messages
  AS RESTRICTIVE FOR SELECT TO authenticated USING (public.is_account_active());
CREATE POLICY "active accounts update messages" ON public.messages
  AS RESTRICTIVE FOR UPDATE TO authenticated
  USING (public.is_account_active()) WITH CHECK (public.is_account_active());
CREATE POLICY "active accounts delete messages" ON public.messages
  AS RESTRICTIVE FOR DELETE TO authenticated USING (public.is_account_active());

CREATE POLICY "active accounts insert offers" ON public.private_offers
  AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK (public.is_account_active());
CREATE POLICY "active accounts read offers" ON public.private_offers
  AS RESTRICTIVE FOR SELECT TO authenticated USING (public.is_account_active());
CREATE POLICY "active accounts update offers" ON public.private_offers
  AS RESTRICTIVE FOR UPDATE TO authenticated
  USING (public.is_account_active()) WITH CHECK (public.is_account_active());

CREATE POLICY "active accounts create orders" ON public.orders
  AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK (public.is_account_active());
CREATE POLICY "active accounts read orders" ON public.orders
  AS RESTRICTIVE FOR SELECT TO authenticated USING (public.is_account_active());
CREATE POLICY "active accounts read order items" ON public.order_items
  AS RESTRICTIVE FOR SELECT TO authenticated USING (public.is_account_active());

CREATE POLICY "active accounts read notifications" ON public.notifications
  AS RESTRICTIVE FOR SELECT TO authenticated USING (public.is_account_active());
CREATE POLICY "active accounts update notifications" ON public.notifications
  AS RESTRICTIVE FOR UPDATE TO authenticated
  USING (public.is_account_active()) WITH CHECK (public.is_account_active());
CREATE POLICY "active accounts delete notifications" ON public.notifications
  AS RESTRICTIVE FOR DELETE TO authenticated USING (public.is_account_active());

CREATE POLICY "active accounts create shipments" ON public.shipments
  AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK (public.is_account_active());
CREATE POLICY "active accounts read shipments" ON public.shipments
  AS RESTRICTIVE FOR SELECT TO authenticated USING (public.is_account_active());
CREATE POLICY "active accounts update shipments" ON public.shipments
  AS RESTRICTIVE FOR UPDATE TO authenticated
  USING (public.is_account_active()) WITH CHECK (public.is_account_active());

CREATE POLICY "active accounts create disputes" ON public.disputes
  AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK (public.is_account_active());
CREATE POLICY "active accounts read disputes" ON public.disputes
  AS RESTRICTIVE FOR SELECT TO authenticated USING (public.is_account_active());
CREATE POLICY "active accounts update disputes" ON public.disputes
  AS RESTRICTIVE FOR UPDATE TO authenticated
  USING (public.is_account_active()) WITH CHECK (public.is_account_active());

CREATE POLICY "active accounts create reviews" ON public.reviews
  AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK (public.is_account_active());
CREATE POLICY "active accounts read reviews" ON public.reviews
  AS RESTRICTIVE FOR SELECT TO authenticated USING (public.is_account_active());
CREATE POLICY "active accounts update reviews" ON public.reviews
  AS RESTRICTIVE FOR UPDATE TO authenticated
  USING (public.is_account_active()) WITH CHECK (public.is_account_active());
CREATE POLICY "active accounts delete reviews" ON public.reviews
  AS RESTRICTIVE FOR DELETE TO authenticated USING (public.is_account_active());

CREATE POLICY "active accounts create reports" ON public.reports
  AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK (public.is_account_active());
CREATE POLICY "active accounts read reports" ON public.reports
  AS RESTRICTIVE FOR SELECT TO authenticated USING (public.is_account_active());
CREATE POLICY "active accounts update reports" ON public.reports
  AS RESTRICTIVE FOR UPDATE TO authenticated
  USING (public.is_account_active()) WITH CHECK (public.is_account_active());

CREATE POLICY "active accounts update roles" ON public.user_roles
  AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK (public.is_account_active());
CREATE POLICY "active accounts read roles" ON public.user_roles
  AS RESTRICTIVE FOR SELECT TO authenticated USING (public.is_account_active());
CREATE POLICY "active accounts remove roles" ON public.user_roles
  AS RESTRICTIVE FOR DELETE TO authenticated USING (public.is_account_active());

CREATE POLICY "active accounts manage discount codes" ON public.discount_codes
  AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK (public.is_account_active());
CREATE POLICY "active accounts read discount codes" ON public.discount_codes
  AS RESTRICTIVE FOR SELECT TO authenticated USING (public.is_account_active());
CREATE POLICY "active accounts update discount codes" ON public.discount_codes
  AS RESTRICTIVE FOR UPDATE TO authenticated
  USING (public.is_account_active()) WITH CHECK (public.is_account_active());
CREATE POLICY "active accounts delete discount codes" ON public.discount_codes
  AS RESTRICTIVE FOR DELETE TO authenticated USING (public.is_account_active());

CREATE POLICY "active accounts manage payment accounts" ON public.seller_payment_accounts
  AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK (public.is_account_active());
CREATE POLICY "active accounts read payment accounts" ON public.seller_payment_accounts
  AS RESTRICTIVE FOR SELECT TO authenticated USING (public.is_account_active());
CREATE POLICY "active accounts update payment accounts" ON public.seller_payment_accounts
  AS RESTRICTIVE FOR UPDATE TO authenticated
  USING (public.is_account_active()) WITH CHECK (public.is_account_active());

CREATE POLICY "active accounts manage featured shops" ON public.featured_shops
  AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK (public.is_account_active());
CREATE POLICY "active accounts read featured shops" ON public.featured_shops
  AS RESTRICTIVE FOR SELECT TO authenticated USING (public.is_account_active());
CREATE POLICY "active accounts update featured shops" ON public.featured_shops
  AS RESTRICTIVE FOR UPDATE TO authenticated
  USING (public.is_account_active()) WITH CHECK (public.is_account_active());
CREATE POLICY "active accounts delete featured shops" ON public.featured_shops
  AS RESTRICTIVE FOR DELETE TO authenticated USING (public.is_account_active());

CREATE POLICY "active accounts manage broadcasts" ON public.founder_broadcasts
  AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK (public.is_account_active());
CREATE POLICY "active accounts read broadcasts" ON public.founder_broadcasts
  AS RESTRICTIVE FOR SELECT TO authenticated USING (public.is_account_active());
CREATE POLICY "active accounts update broadcasts" ON public.founder_broadcasts
  AS RESTRICTIVE FOR UPDATE TO authenticated
  USING (public.is_account_active()) WITH CHECK (public.is_account_active());
CREATE POLICY "active accounts delete broadcasts" ON public.founder_broadcasts
  AS RESTRICTIVE FOR DELETE TO authenticated USING (public.is_account_active());

CREATE POLICY "active accounts upload storage objects" ON storage.objects
  AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK (public.is_account_active());
CREATE POLICY "active accounts read storage objects" ON storage.objects
  AS RESTRICTIVE FOR SELECT TO authenticated USING (public.is_account_active());
CREATE POLICY "active accounts update storage objects" ON storage.objects
  AS RESTRICTIVE FOR UPDATE TO authenticated
  USING (public.is_account_active()) WITH CHECK (public.is_account_active());
CREATE POLICY "active accounts delete storage objects" ON storage.objects
  AS RESTRICTIVE FOR DELETE TO authenticated USING (public.is_account_active());
