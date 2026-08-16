
-        const { default: Stripe } = await import("stripe");
-        const stripe = new Stripe(secret, { apiVersion: "2022-11-15" });
-
-        let event: import("stripe").Stripe.Event;
-        try {
-          // Use constructEvent to validate signature using the webhook secret from env
-          event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
-        } catch (err) {
-          console.error("[stripe-webhook] signature verification failed", err);
-          return new Response("Invalid signature", { status: 401 });
-        }
+        const { default: Stripe } = await import("stripe");
+        const stripe = new Stripe(secret, { apiVersion: "2022-11-15" });
+
+        let event: import("stripe").Stripe.Event;
+        try {
+          // Use constructEvent to validate signature using the webhook secret from env
+          event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
+        } catch (err) {
+          console.error("[stripe-webhook] signature verification failed", err);
+          return new Response("Invalid signature", { status: 401 });
+        }
*** End Patch
