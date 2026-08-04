
-- Benachrichtigung bei neuer Chat-Nachricht
CREATE OR REPLACE FUNCTION public.tg_notify_new_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _conv RECORD;
  _recipient uuid;
  _sender_name text;
BEGIN
  SELECT * INTO _conv FROM public.conversations WHERE id = NEW.conversation_id;
  IF NOT FOUND THEN RETURN NEW; END IF;
  _recipient := CASE WHEN NEW.sender_id = _conv.buyer_id THEN _conv.seller_id ELSE _conv.buyer_id END;
  SELECT COALESCE(display_name, 'Jemand') INTO _sender_name FROM public.profiles WHERE id = NEW.sender_id;
  INSERT INTO public.notifications (user_id, title, body, category, link, meta)
  VALUES (
    _recipient,
    COALESCE(_sender_name, 'Neue Nachricht'),
    left(NEW.body, 140),
    'chat',
    '/nachrichten?c=' || NEW.conversation_id::text,
    jsonb_build_object('conversation_id', NEW.conversation_id)
  );
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_notify_new_message ON public.messages;
CREATE TRIGGER trg_notify_new_message
AFTER INSERT ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.tg_notify_new_message();

-- Benachrichtigung bei bezahlter Bestellung (Käufer + Verkäufer)
CREATE OR REPLACE FUNCTION public.tg_notify_order_paid()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _seller uuid;
BEGIN
  IF NEW.status = 'paid' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'paid') THEN
    INSERT INTO public.notifications (user_id, title, body, category, link, meta)
    VALUES (NEW.buyer_id, 'Zahlung erfolgreich 🎉',
            'Deine Bestellung über ' || to_char(NEW.total_cents / 100.0, 'FM999999990.00') || ' € ist bezahlt.',
            'order', '/dashboard?tab=orders', jsonb_build_object('order_id', NEW.id));

    FOR _seller IN SELECT DISTINCT seller_id FROM public.order_items WHERE order_id = NEW.id LOOP
      INSERT INTO public.notifications (user_id, title, body, category, link, meta)
      VALUES (_seller, 'Neue Bestellung 🛍️', 'Du hast etwas verkauft. Schau in deine Verkäufe.',
              'sale', '/dashboard?tab=sales', jsonb_build_object('order_id', NEW.id));
    END LOOP;
  ELSIF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.notifications (user_id, title, body, category, link, meta)
    VALUES (NEW.buyer_id, 'Bestellung aktualisiert',
            'Neuer Status: ' || NEW.status::text, 'order', '/dashboard?tab=orders',
            jsonb_build_object('order_id', NEW.id));
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_notify_order_paid_ins ON public.orders;
CREATE TRIGGER trg_notify_order_paid_ins
AFTER INSERT ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.tg_notify_order_paid();

DROP TRIGGER IF EXISTS trg_notify_order_paid_upd ON public.orders;
CREATE TRIGGER trg_notify_order_paid_upd
AFTER UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.tg_notify_order_paid();

-- Benachrichtigung wenn Verkäufer eine Versandnummer einträgt
CREATE OR REPLACE FUNCTION public.tg_notify_shipment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _buyer uuid;
BEGIN
  SELECT buyer_id INTO _buyer FROM public.orders WHERE id = NEW.order_id;
  IF _buyer IS NULL THEN RETURN NEW; END IF;
  INSERT INTO public.notifications (user_id, title, body, category, link, meta)
  VALUES (_buyer, 'Deine Bestellung ist unterwegs 📦',
          NEW.carrier || ' · ' || NEW.tracking_number, 'shipment', '/dashboard?tab=orders',
          jsonb_build_object('order_id', NEW.order_id));
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_notify_shipment ON public.shipments;
CREATE TRIGGER trg_notify_shipment
AFTER INSERT ON public.shipments
FOR EACH ROW EXECUTE FUNCTION public.tg_notify_shipment();
