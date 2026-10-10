ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS verification_path text;
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS verification_status text NOT NULL DEFAULT 'none';
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS evidence_url text;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS loss_declared_at timestamptz;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS loss_declared_name text;

CREATE OR REPLACE FUNCTION public.guard_listing_verification()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'founder') THEN RETURN NEW; END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.verification_status := CASE WHEN NEW.verification_path IS NOT NULL THEN 'submitted' ELSE 'none' END;
  ELSIF NEW.verification_status IS DISTINCT FROM OLD.verification_status OR NEW.verification_path IS DISTINCT FROM OLD.verification_path THEN
    NEW.verification_status := CASE WHEN NEW.verification_path IS NOT NULL THEN 'submitted' ELSE 'none' END;
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_guard_listing_verification ON public.listings;
CREATE TRIGGER trg_guard_listing_verification BEFORE INSERT OR UPDATE ON public.listings FOR EACH ROW EXECUTE FUNCTION public.guard_listing_verification();

CREATE OR REPLACE FUNCTION public.guard_report_loss()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.target_type = 'order' AND NEW.reason ILIKE '%nicht erhalten%' THEN
    IF NEW.loss_declared_at IS NULL OR coalesce(length(trim(NEW.loss_declared_name)),0) < 3 THEN
      RAISE EXCEPTION 'Bitte bestätige die Verlusterklärung mit deinem vollständigen Namen.';
    END IF;
    NEW.loss_declared_at := now();
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_guard_report_loss ON public.reports;
CREATE TRIGGER trg_guard_report_loss BEFORE INSERT ON public.reports FOR EACH ROW EXECUTE FUNCTION public.guard_report_loss();

CREATE OR REPLACE FUNCTION public.tg_copyright_report()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE s uuid; n int;
BEGIN
  IF NEW.target_type <> 'listing' OR NEW.reason <> 'copyright' THEN RETURN NEW; END IF;
  SELECT seller_id INTO s FROM public.listings WHERE id = NEW.target_id;
  IF s IS NULL THEN RETURN NEW; END IF;
  SELECT count(DISTINCT reporter_id) INTO n FROM public.reports WHERE target_type='listing' AND target_id=NEW.target_id AND reason='copyright' AND status='open';
  IF n >= 2 THEN
    UPDATE public.listings SET moderation_status='pending', moderation_note='Urheberrechts-Meldung – in Prüfung' WHERE id = NEW.target_id;
  END IF;
  INSERT INTO public.notifications(user_id,title,body,category,link)
  VALUES (s,'Urheberrechts-Meldung','Ein Produkt von dir wurde wegen Urheberrecht gemeldet. CreaHQ prüft den Fall.','report','/dashboard?tab=listings');
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_copyright_report ON public.reports;
CREATE TRIGGER trg_copyright_report AFTER INSERT ON public.reports FOR EACH ROW EXECUTE FUNCTION public.tg_copyright_report();

DROP POLICY IF EXISTS "owners upload verifications" ON storage.objects;
CREATE POLICY "owners upload verifications" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'listing-verifications' AND (storage.foldername(name))[1] = (select auth.uid()::text));
DROP POLICY IF EXISTS "owners admins read verifications" ON storage.objects;
CREATE POLICY "owners admins read verifications" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'listing-verifications' AND ((storage.foldername(name))[1] = (select auth.uid()::text) OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'founder')));