import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/stripe-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["STRIPE_SECRET_KEY"];
        const webhookSecret = process.env["STRIPE_WEBHOOK_SECRET"];
        if (!secret || !webhookSecret) {
          return new Response("Stripe not configured", { status: 503 });
        }

        const signature = request.headers.get("stripe-signature");
        if (!signature) return new Response("Missing signature", { status: 401 });

        const body = await request.text();

        const { default: Stripe } = await import("stripe");
        const stripe = new Stripe(secret);

        let event: import("stripe").Stripe.Event;
        try {
          event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
        } catch (err) {
          console.error("[stripe-webhook] signature verification failed", err);
          return new Response("Invalid signature", { status: 401 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        if (event.type === "checkout.session.completed") {
          const session = event.data.object;
          const orderId = session.metadata?.["order_id"] ?? session.client_reference_id;
          if (orderId && session.payment_status === "paid") {
            await supabaseAdmin.from("orders").update({ status: "paid" }).eq("id", orderId);
          }
        }

        if (event.type === "checkout.session.expired") {
          const session = event.data.object;
          const orderId = session.metadata?.["order_id"] ?? session.client_reference_id;
          if (orderId) {
            await supabaseAdmin.from("orders").update({ status: "cancelled" }).eq("id", orderId);
          }
        }

        return new Response("ok");
      },
    },
  },
});
