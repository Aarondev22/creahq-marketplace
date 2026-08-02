CREATE OR REPLACE FUNCTION public.prevent_self_role_removal()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL
     AND OLD.user_id = auth.uid()
     AND OLD.role IN ('admin', 'founder') THEN
    RAISE EXCEPTION 'Du kannst dir deine eigenen Admin-/Founder-Rechte nicht entziehen.';
  END IF;
  RETURN OLD;
END;
$$;

CREATE OR REPLACE FUNCTION public.prevent_self_ban()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NEW.id = auth.uid() AND NEW.banned = true AND COALESCE(OLD.banned, false) = false THEN
    RAISE EXCEPTION 'Du kannst dich nicht selbst sperren.';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.prevent_self_role_removal() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_self_ban() FROM PUBLIC, anon, authenticated;