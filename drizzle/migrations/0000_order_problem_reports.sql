ALTER TABLE public.reports DROP CONSTRAINT IF EXISTS reports_target_type_check;
ALTER TABLE public.reports ADD CONSTRAINT reports_target_type_check CHECK (target_type = ANY (ARRAY['listing','shop','chat','order']));

CREATE OR REPLACE FUNCTION public.tg_notify_order_report()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE _seller uuid;
BEGIN
  IF NEW.target_type <> 'order' THEN RETURN NEW; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.orders WHERE id = NEW.target_id AND buyer_id = NEW.reporter_id) THEN
    RAISE EXCEPTION 'Du kannst nur deine eigenen Bestellungen melden.';
  END IF;
  FOR _seller IN SELECT DISTINCT seller_id FROM public.order_items WHERE order_id = NEW.target_id LOOP
    INSERT INTO public.notifications (user_id, title, body, category, link, meta)
    VALUES (_seller, 'Problem mit einer Bestellung ⚠️', 'Ein Käufer hat ein Problem gemeldet. Bitte kläre es im Chat.',
            'sale', '/dashboard?tab=sales', jsonb_build_object('order_id', NEW.target_id, 'report_id', NEW.id));
  END LOOP;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_notify_order_report AFTER INSERT ON public.reports
FOR EACH ROW EXECUTE FUNCTION public.tg_notify_order_report();