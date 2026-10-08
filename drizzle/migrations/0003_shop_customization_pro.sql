ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_pro boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS shop_badges jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS shop_theme jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE OR REPLACE FUNCTION public.guard_profile_pro()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE _max int;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.is_pro IS DISTINCT FROM OLD.is_pro
     AND auth.uid() IS NOT NULL
     AND NOT (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'founder')) THEN
    RAISE EXCEPTION 'Pro-Status kann nur über das Abo geändert werden.';
  END IF;
  IF jsonb_typeof(NEW.shop_badges) <> 'array' THEN
    RAISE EXCEPTION 'Ungültige Badges.';
  END IF;
  _max := CASE WHEN NEW.is_pro THEN 5 ELSE 3 END;
  IF jsonb_array_length(NEW.shop_badges) > _max THEN
    RAISE EXCEPTION 'Maximal % Badges erlaubt.', _max;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_guard_profile_pro ON public.profiles;
CREATE TRIGGER trg_guard_profile_pro BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.guard_profile_pro();

CREATE OR REPLACE FUNCTION public.enforce_daily_listing_limit()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE _count integer;
BEGIN
  IF public.has_role(NEW.seller_id,'admin') OR public.has_role(NEW.seller_id,'founder')
     OR EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.seller_id AND is_pro) THEN
    RETURN NEW;
  END IF;
  SELECT count(*) INTO _count FROM public.listings
   WHERE seller_id = NEW.seller_id AND created_at >= date_trunc('day', now());
  IF _count >= 3 THEN
    RAISE EXCEPTION 'Tageslimit erreicht: Du kannst maximal 3 neue Produkte pro Tag einstellen.';
  END IF;
  RETURN NEW;
END; $function$;