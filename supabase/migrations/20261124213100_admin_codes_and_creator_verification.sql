ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.founder_redeem_codes
  ADD COLUMN IF NOT EXISTS code_type TEXT NOT NULL DEFAULT 'founder'
    CHECK (code_type IN ('founder', 'pro', 'beta_tester')),
  ADD COLUMN IF NOT EXISTS max_uses INTEGER
    CHECK (max_uses IS NULL OR max_uses > 0),
  ADD COLUMN IF NOT EXISTS used_count INTEGER NOT NULL DEFAULT 0
    CHECK (used_count >= 0);

UPDATE public.founder_redeem_codes
SET used_count = 1
WHERE used_by IS NOT NULL AND used_count = 0;

UPDATE public.founder_redeem_codes
SET max_uses = 1
WHERE max_uses IS NULL;

DELETE FROM public.founder_redeem_codes
WHERE code = 'CREAHQ-FOUNDER-9F4K2X7Q3M8B'
  AND used_by IS NULL;

CREATE OR REPLACE FUNCTION public.redeem_founder_code(_code TEXT)
RETURNS TABLE(success BOOLEAN, message TEXT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
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

  IF _code_row.max_uses IS NOT NULL AND _code_row.used_count >= _code_row.max_uses THEN
    RETURN QUERY SELECT false, 'Dieser Code wurde bereits vollständig eingelöst.';
    RETURN;
  END IF;

  IF _code_row.code_type = 'pro' THEN
    UPDATE public.profiles SET is_pro = true WHERE id = _user;
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
