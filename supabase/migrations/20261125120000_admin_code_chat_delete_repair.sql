-- Admin/code/chat repair migration.
-- Safe for deployments where earlier migrations are not fully applied.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS banned boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_pro boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_verified boolean NOT NULL DEFAULT false;

ALTER TABLE public.founder_redeem_codes
  ADD COLUMN IF NOT EXISTS code_type text NOT NULL DEFAULT 'founder',
  ADD COLUMN IF NOT EXISTS max_uses integer,
  ADD COLUMN IF NOT EXISTS used_count integer NOT NULL DEFAULT 0;

DO $$ BEGIN
  ALTER TABLE public.founder_redeem_codes
    DROP CONSTRAINT IF EXISTS founder_redeem_codes_code_type_check;
  ALTER TABLE public.founder_redeem_codes
    ADD CONSTRAINT founder_redeem_codes_code_type_check
    CHECK (code_type IN ('founder', 'pro', 'beta_tester'));
EXCEPTION WHEN undefined_table THEN NULL; END $$;

UPDATE public.founder_redeem_codes
SET used_count = CASE WHEN used_count < 1 AND used_by IS NOT NULL THEN 1 ELSE used_count END;

CREATE OR REPLACE FUNCTION public.redeem_founder_code(_code text)
RETURNS TABLE(success boolean, message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user uuid := auth.uid();
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

  IF _code_row.used_by IS NOT NULL OR
     (_code_row.max_uses IS NOT NULL AND _code_row.used_count >= _code_row.max_uses) THEN
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
  SET used_by = _user,
      used_at = now(),
      used_count = GREATEST(used_count, 0) + 1
  WHERE id = _code_row.id;

  RETURN QUERY SELECT true, 'Code erfolgreich eingelöst.';
END;
$$;

GRANT EXECUTE ON FUNCTION public.redeem_founder_code(text) TO authenticated;

-- Allow a participant to delete their own messages and whole conversations.
DROP POLICY IF EXISTS "msg_sender_delete" ON public.messages;
CREATE POLICY "msg_sender_delete" ON public.messages
FOR DELETE TO authenticated
USING (
  sender_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = conversation_id
      AND (auth.uid() = c.buyer_id OR auth.uid() = c.seller_id)
  )
);

DROP POLICY IF EXISTS "conv_participant_delete" ON public.conversations;
CREATE POLICY "conv_participant_delete" ON public.conversations
FOR DELETE TO authenticated
USING (
  auth.uid() = buyer_id OR auth.uid() = seller_id
  OR public.has_role(auth.uid(), 'founder')
  OR public.has_role(auth.uid(), 'admin')
);
