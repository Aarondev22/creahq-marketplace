DROP POLICY IF EXISTS "profiles readable by everyone" ON public.profiles;
CREATE POLICY "visible profiles readable" ON public.profiles FOR SELECT TO anon, authenticated
  USING (banned = false OR id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'founder'));

DROP POLICY IF EXISTS "public read avatars" ON storage.objects;
DROP POLICY IF EXISTS "public read covers" ON storage.objects;
DROP POLICY IF EXISTS "public read banners" ON storage.objects;
CREATE POLICY "owners read avatars" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = (select auth.uid()::text));
CREATE POLICY "owners read covers" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'listing-covers' AND (storage.foldername(name))[1] = (select auth.uid()::text));
CREATE POLICY "owners read banners" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'shop-banners' AND (storage.foldername(name))[1] = (select auth.uid()::text));

CREATE OR REPLACE FUNCTION public.guard_chat_message()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
DECLARE b text := lower(NEW.body);
BEGIN
  IF NEW.kind IS DISTINCT FROM 'text' AND NEW.kind IS NOT NULL THEN RETURN NEW; END IF;
  IF b ~ '[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}'
     OR regexp_replace(b, '[\s\-/().]', '', 'g') ~ '(\+|00)?[0-9]{9,}'
     OR regexp_replace(b, '\s', '', 'g') ~ 'de[0-9]{20}'
     OR b ~ '(paypal|whatsapp|telegram|signal|überweis|ueberweis|freunde ?& ?familie|friends ?and ?family)' THEN
    RAISE EXCEPTION 'Zu deiner Sicherheit: Kontaktdaten, Bankdaten und Zahlungen außerhalb von CreaHQ sind im Chat nicht erlaubt. Nur über CreaHQ bist du geschützt.';
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_guard_chat_message ON public.messages;
CREATE TRIGGER trg_guard_chat_message BEFORE INSERT ON public.messages FOR EACH ROW EXECUTE FUNCTION public.guard_chat_message();