import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/stripe-webhook")({
  component: () => null,
});

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature") || "";
  const body = await request.text();

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const secret = process.env.STRIPE_SECRET_KEY || "";

  if (!webhookSecret || !secret) {
    // Missing configuration
    return new Response("Stripe configuration missing", { status: 500 });
  }

  const { default: Stripe } = await import("stripe");
  const stripe = new Stripe(secret);

  let event: import("stripe").Stripe.Event;
  try {
    // Use constructEvent to validate signature using the webhook secret from env
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[stripe-webhook] signature verification failed", err);
    return new Response("Invalid signature", { status: 401 });
  }

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  async function finalizeSession(session: import("stripe").Stripe.Checkout.Session) {
    const orderId = session.metadata?.order_id;
    if (!orderId || session.client_reference_id !== orderId || session.mode !== "payment") {
      console.error(
        "[stripe-webhook] completed session did not match expected checkout metadata",
        session.id,
      );
      return;
    }
    if (session.payment_status !== "paid") return;

    const shippingDetails = session.collected_information?.shipping_details;
    const shippingAddress = shippingDetails?.address
      ? {
          name: shippingDetails.name,
          line1: shippingDetails.address.line1 ?? null,
          line2: shippingDetails.address.line2 ?? null,
          city: shippingDetails.address.city ?? null,
          state: shippingDetails.address.state ?? null,
          postal_code: shippingDetails.address.postal_code ?? null,
          country: shippingDetails.address.country ?? null,
        }
      : null;

    const { data: finalized, error } = await supabaseAdmin.rpc("finalize_checkout_order", {
      _order_id: orderId,
      _stripe_session_id: session.id,
      _amount_total: session.amount_total ?? -1,
      _currency: session.currency ?? "",
      _shipping_address: shippingAddress,
    });
    if (error) throw error;
    if (!finalized) {
      console.error("[stripe-webhook] payment did not match a pending order", {
        orderId,
        sessionId: session.id,
        amount: session.amount_total,
        currency: session.currency,
      });
    }
  }

  async function releaseSession(session: import("stripe").Stripe.Checkout.Session) {
    const orderId = session.metadata?.order_id;
    if (!orderId) {
      console.error(
        "[stripe-webhook] expired or failed session is missing its order id",
        session.id,
      );
      return;
    }
    const { error } = await supabaseAdmin.rpc("release_checkout_order", {
      _order_id: orderId,
      _stripe_session_id: session.id,
    });
    if (error) throw error;
  }

  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded":
      try {
        await finalizeSession(event.data.object);
      } catch (err) {
        console.error("[stripe-webhook] unable to finalize paid checkout", err);
        return new Response("Unable to finalize order", { status: 500 });
      }
      break;
    case "checkout.session.expired":
    case "checkout.session.async_payment_failed":
      try {
        await releaseSession(event.data.object);
      } catch (err) {
        console.error("[stripe-webhook] unable to release failed checkout", err);
        return new Response("Unable to release order", { status: 500 });
      }
      break;
    default:
      break;
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
}
