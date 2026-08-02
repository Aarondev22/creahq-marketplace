CREATE OR REPLACE FUNCTION public.prevent_self_role_removal()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
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

DROP TRIGGER IF EXISTS trg_prevent_self_role_removal ON public.user_roles;
CREATE TRIGGER trg_prevent_self_role_removal
BEFORE DELETE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.prevent_self_role_removal();

CREATE OR REPLACE FUNCTION public.prevent_self_ban()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NEW.id = auth.uid() AND NEW.banned = true AND COALESCE(OLD.banned, false) = false THEN
    RAISE EXCEPTION 'Du kannst dich nicht selbst sperren.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_self_ban ON public.profiles;
CREATE TRIGGER trg_prevent_self_ban
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_self_ban();