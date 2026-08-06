*** Begin Patch
*** Update File: README.md
@@
 `routeTree.gen.ts` is auto-generated. Don't edit it by hand.
 
+## Deployment / Secrets
+
+Ensure the following environment variables are set in your deployment environment:
+
+- STRIPE_SECRET_KEY — Stripe server secret (used for Checkout / API)
+- STRIPE_WEBHOOK_SECRET — Stripe webhook signing secret (used to verify incoming webhooks)
+- VITE_STRIPE_PUBLISHABLE_KEY — (optional) client-side publishable key for Stripe Checkout
+
*** End Patch
