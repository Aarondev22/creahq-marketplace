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
