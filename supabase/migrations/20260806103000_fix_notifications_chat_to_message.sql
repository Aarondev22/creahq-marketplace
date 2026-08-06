-- Ensure notifications use 'message' category and migrate existing 'chat' rows
BEGIN;

-- Update existing rows
UPDATE public.notifications SET category = 'message' WHERE category = 'chat';

-- Ensure constraint allows 'message' (idempotent)
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_category_check;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_category_check CHECK (category = ANY (ARRAY['message','refill_shop','refill_listing','order','sale','shipment','offer','founder_news','system']));

-- Replace trigger function to be resilient and use 'message'
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

  BEGIN
    INSERT INTO public.notifications (user_id, title, body, category, link, meta)
    VALUES (
      _recipient,
      COALESCE(_sender_name, 'Neue Nachricht'),
      left(NEW.body, 140),
      'message',
      '/nachrichten?c=' || NEW.conversation_id::text,
      jsonb_build_object('conversation_id', NEW.conversation_id)
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '[tg_notify_new_message] notification insert failed: %', SQLERRM;
  END;

  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_notify_new_message ON public.messages;
CREATE TRIGGER trg_notify_new_message
AFTER INSERT ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.tg_notify_new_message();

COMMIT;
