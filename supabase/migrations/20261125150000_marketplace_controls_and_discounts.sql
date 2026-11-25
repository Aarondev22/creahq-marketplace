ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS pro_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS suspended_until timestamptz;

ALTER TABLE public.founder_redeem_codes
  ADD COLUMN IF NOT EXISTS valid_until timestamptz,
  ADD COLUMN IF NOT EXISTS duration_days integer
    CHECK (duration_days IS NULL OR duration_days BETWEEN 1 AND 3650);

ALTER TABLE public.discount_codes
  ADD COLUMN IF NOT EXISTS max_uses integer,
  ADD COLUMN IF NOT EXISTS used_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS valid_from timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS valid_until timestamptz;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS discount_code_id uuid REFERENCES public.discount_codes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS discount_cents integer NOT NULL DEFAULT 0 CHECK (discount_cents >= 0);

DROP POLICY IF EXISTS "users delete own notifications" ON public.notifications;
CREATE POLICY "users delete own notifications" ON public.notifications
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

GRANT DELETE ON public.notifications TO authenticated;
GRANT DELETE ON public.messages TO authenticated;

DROP POLICY IF EXISTS "msg_sender_delete_own" ON public.messages;
CREATE POLICY "msg_sender_delete_own" ON public.messages
  FOR DELETE TO authenticated
  USING (auth.uid() = sender_id AND kind = 'text');

CREATE OR REPLACE FUNCTION public.enforce_daily_listing_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _count integer;
  _limit integer := 5;
  _pro boolean;
  _pro_expires_at timestamptz;
BEGIN
  IF public.has_role(NEW.seller_id, 'admin') OR public.has_role(NEW.seller_id, 'founder') THEN
    RETURN NEW;
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext(NEW.seller_id::text)::bigint);

  SELECT is_pro, pro_expires_at INTO _pro, _pro_expires_at
  FROM public.profiles
  WHERE id = NEW.seller_id;

  IF _pro AND (_pro_expires_at IS NULL OR _pro_expires_at > now()) THEN
    _limit := 10;
  END IF;

  SELECT count(*) INTO _count
  FROM public.listings
  WHERE seller_id = NEW.seller_id
    AND created_at >= date_trunc('day', now());

  IF _count >= _limit THEN
    RAISE EXCEPTION 'Tageslimit erreicht: maximal % neue Listings pro Tag.', _limit;
  END IF;
  RETURN NEW;
END;
$$;

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

GRANT EXECUTE ON FUNCTION public.redeem_founder_code(TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.consume_discount_code(_code_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.discount_codes
  SET used_count = used_count + 1
  WHERE id = _code_id
    AND active
    AND valid_from <= now()
    AND (valid_until IS NULL OR valid_until > now())
    AND (max_uses IS NULL OR used_count < max_uses);
  RETURN FOUND;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_discount_code(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_discount_code(UUID) TO service_role;
