*** Begin Patch
*** Update File: README.md
@@
 Ensure the following environment variables are set in your deployment environment:
@@
 - VITE_STRIPE_PUBLISHABLE_KEY — (optional) client-side publishable key for Stripe Checkout
+
+Additionally, make sure the Supabase service role key is available to server functions as SUPABASE_SERVICE_ROLE_KEY when running migrations or server-admin RPCs.
*** End Patch
