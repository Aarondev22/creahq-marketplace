ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS shipping_carrier text, ADD COLUMN IF NOT EXISTS processing_time text;
GRANT SELECT ON public.platform_settings TO anon, authenticated;
CREATE OR REPLACE FUNCTION public.validate_physical_listing() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
 IF NEW.kind::text = 'service' AND (TG_OP = 'INSERT' OR OLD.kind IS DISTINCT FROM NEW.kind OR (OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'published')) THEN
  IF NOT coalesce((SELECT physical_enabled FROM public.platform_settings WHERE id = 1), false) THEN RAISE EXCEPTION 'Physische Produkte sind derzeit nicht freigeschaltet.'; END IF;
 END IF;
 IF NEW.kind::text = 'service' AND (TG_OP = 'INSERT' OR NEW.shipping_carrier IS DISTINCT FROM OLD.shipping_carrier OR NEW.processing_time IS DISTINCT FROM OLD.processing_time) THEN
  IF NEW.shipping_carrier IS NULL OR NEW.shipping_carrier NOT IN ('DHL','Hermes','DPD','UPS','GLS','Deutsche Post','Sonstiger') THEN RAISE EXCEPTION 'Bitte einen Versanddienstleister auswählen.'; END IF;
  IF NEW.processing_time IS NULL OR NEW.processing_time NOT IN ('1–2 Werktage','3–5 Werktage','1–2 Wochen') THEN RAISE EXCEPTION 'Bitte eine Bearbeitungszeit auswählen.'; END IF;
  IF NEW.shipping_mode = 'digital' OR NEW.shipping_price_cents < 0 THEN RAISE EXCEPTION 'Ungültige Versandoptionen.'; END IF;
 END IF;
 RETURN NEW;
END;
$$;
CREATE TRIGGER validate_physical_listing BEFORE INSERT OR UPDATE ON public.listings FOR EACH ROW EXECUTE FUNCTION public.validate_physical_listing();