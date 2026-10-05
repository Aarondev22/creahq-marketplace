import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type CheckoutLine = { listing_id: string; qty: number; offer_id?: string };

export type CheckoutResult = { url: string } | { error: string };

export const createCheckoutSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { items: CheckoutLine[]; origin: string }) => ({
    items: (Array.isArray(d?.items) ? d.items : [])
      .slice(0, 50)
      .map((i) => ({ listing_id: String(i.listing_id), qty: Math.min(Math.max(Number(i.qty) || 1, 1), 99), offer_id: i.offer_id ? String(i.offer_id) : undefined })),
    origin: String(d?.origin ?? "").slice(0, 200),
  }))
  .handler(async ({ data, context }): Promise<CheckoutResult> => {
    const secret = process.env["STRIPE_SECRET_KEY"];
    if (!secret) return { error: "Stripe ist noch nicht verbunden. Bitte den Stripe-Schlüssel hinterlegen." };
    if (data.items.length === 0) return { error: "Dein Warenkorb ist leer." };

    const { supabase, userId } = context;

    // Preise & Verfügbarkeit immer serverseitig prüfen — nie dem Client vertrauen.
    const { data: listings, error } = await supabase
      .from("listings")
      .select("id,title,price_cents,currency,cover_url,seller_id,status")
      .in("id", data.items.map((i) => i.listing_id));
    if (error) return { error: error.message };

    const available = (listings ?? []).filter((l) => l.status === "published");
    if (available.length === 0) return { error: "Diese Produkte sind nicht mehr verfügbar." };

    const lines = data.items
      .map((i) => ({ item: i, listing: available.find((l) => l.id === i.listing_id) }))
      .filter((x): x is { item: CheckoutLine; listing: NonNullable<(typeof available)[number]> } => Boolean(x.listing));

    if (lines.length === 0) return { error: "Diese Produkte sind nicht mehr verfügbar." };

    // Angenommene Preisvorschläge serverseitig prüfen und Preis/Menge daraus übernehmen.
    const offerIds = lines.map((l) => l.item.offer_id).filter((x): x is string => Boolean(x));
    if (offerIds.length) {
      const { data: offers } = await supabase
        .from("private_offers")
        .select("id,listing_id,buyer_id,price_cents,qty,accepted_at,declined_at,expires_at")
        .in("id", offerIds);
      for (const l of lines) {
        if (!l.item.offer_id) continue;
        const o = (offers ?? []).find((x) => x.id === l.item.offer_id);
        if (!o || o.buyer_id !== userId || o.listing_id !== l.listing.id || !o.accepted_at || o.declined_at || new Date(o.expires_at) < new Date()) {
          return { error: `Der Angebotspreis für „${l.listing.title}“ ist nicht mehr gültig.` };
        }
        l.listing = { ...l.listing, price_cents: o.price_cents };
        l.item = { ...l.item, qty: o.qty };
      }
    }

    const totalCents = lines.reduce((sum, l) => sum + l.listing.price_cents * l.item.qty, 0);
    const currency = (lines[0]!.listing.currency || "eur").toLowerCase();

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({ buyer_id: userId, total_cents: totalCents, currency, status: "pending" })
      .select("id")
      .single();
    if (orderError || !order) return { error: orderError?.message ?? "Bestellung konnte nicht angelegt werden." };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("order_items").insert(
      lines.map((l) => ({
        order_id: order.id,
        listing_id: l.listing.id,
        seller_id: l.listing.seller_id,
        unit_price_cents: l.listing.price_cents,
        qty: l.item.qty,
      })),
    );

    const { default: Stripe } = await import("stripe");
    const stripe = new Stripe(secret);

    const origin = data.origin.startsWith("http") ? data.origin.replace(/\/$/, "") : "";

    try {
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        client_reference_id: order.id,
        metadata: { order_id: order.id, buyer_id: userId },
        line_items: lines.map((l) => ({
          quantity: l.item.qty,
          price_data: {
            currency,
            unit_amount: l.listing.price_cents,
            product_data: {
              name: l.listing.title,
              ...(l.listing.cover_url ? { images: [l.listing.cover_url] } : {}),
            },
          },
        })),
        success_url: `${origin}/checkout/erfolg?order=${order.id}`,
        cancel_url: `${origin}/checkout/abbruch?order=${order.id}`,
      });

      await supabaseAdmin.from("orders").update({ stripe_session_id: session.id }).eq("id", order.id);

      if (!session.url) return { error: "Stripe hat keine Checkout-URL zurückgegeben." };
      return { url: session.url };
    } catch (err) {
      console.error("[stripe] checkout session failed", err);
      return { error: "Der Bezahlvorgang konnte nicht gestartet werden. Bitte später nochmal versuchen." };
    }
  });

export const fetchOrderStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { orderId: string }) => ({ orderId: String(d?.orderId ?? "") }))
  .handler(async ({ data, context }) => {
    const { data: order } = await context.supabase
      .from("orders")
      .select("id,total_cents,currency,status,created_at")
      .eq("id", data.orderId)
      .maybeSingle();
    return order ?? null;
  });
