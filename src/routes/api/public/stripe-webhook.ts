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

  // Handle the event (basic example)
  switch (event.type) {
    case "checkout.session.completed":
      // handle checkout complete
      break;
    default:
      break;
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
}
