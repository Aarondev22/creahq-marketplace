*** Begin Patch
*** Update File: supabase/migrations/20260804100427_d38cc17b-aad4-4116-8b83-6686e5499e1f.sql
@@
-  INSERT INTO public.notifications (user_id, title, body, category, link, meta)
-  VALUES (
-    _recipient,
-    COALESCE(_sender_name, 'Neue Nachricht'),
-    left(NEW.body, 140),
-    'chat',
-    '/nachrichten?c=' || NEW.conversation_id::text,
-    jsonb_build_object('conversation_id', NEW.conversation_id)
-  );
+  BEGIN
+    INSERT INTO public.notifications (user_id, title, body, category, link, meta)
+    VALUES (
+      _recipient,
+      COALESCE(_sender_name, 'Neue Nachricht'),
+      left(NEW.body, 140),
+      'message',
+      '/nachrichten?c=' || NEW.conversation_id::text,
+      jsonb_build_object('conversation_id', NEW.conversation_id)
+    );
+  EXCEPTION WHEN OTHERS THEN
+    RAISE NOTICE '[tg_notify_new_message] notification insert failed: %', SQLERRM;
+  END;
*** End Patch
