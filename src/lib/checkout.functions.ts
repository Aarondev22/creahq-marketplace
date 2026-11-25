import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type CheckoutLine = { listing_id: string; qty: number; offer_id?: string };

export type CheckoutResult = { url: string } | { error: string };

export const createCheckoutSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: { items: CheckoutLine[]; waiverAccepted?: boolean; discountCode?: string }) => ({
      waiverAccepted: d?.waiverAccepted === true,
      discountCode: String(d?.discountCode ?? "")
        .trim()
        .toUpperCase()
        .slice(0, 40),
      items: (Array.isArray(d?.items) ? d.items : []).slice(0, 50).map((i) => ({
        listing_id: String(i.listing_id),
        qty: Math.min(Math.max(Number(i.qty) || 1, 1), 99),
        offer_id: i.offer_id ? String(i.offer_id) : undefined,
      })),
    }),
  )
  .handler(async ({ data, context }): Promise<CheckoutResult> => {
    const secret = process.env["STRIPE_SECRET_KEY"];
    if (!secret)
      return { error: "Stripe ist noch nicht verbunden. Bitte den Stripe-Schlüssel hinterlegen." };
    if (data.items.length === 0) return { error: "Dein Warenkorb ist leer." };
    if (!data.waiverAccepted)
      return {
        error: "Bitte bestätige den sofortigen Download und das Erlöschen des Widerrufsrechts.",
      };

    const { supabase, userId } = context;
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("banned,suspended_until")
      .eq("id", userId)
      .maybeSingle();
    if (profileError) return { error: "Dein Kontostatus konnte nicht geprüft werden." };
    if (
      !profile ||
      profile.banned ||
      (profile.suspended_until && new Date(profile.suspended_until) > new Date())
    ) {
      return { error: "Dein Konto ist derzeit pausiert oder gesperrt." };
    }

    let origin: string;
    try {
      origin = new URL(getRequest().url).origin;
      if (new URL(origin).protocol !== "https:" && new URL(origin).hostname !== "localhost") {
        return { error: "Der Bezahlvorgang konnte nicht sicher gestartet werden." };
      }
    } catch {
      return { error: "Der Bezahlvorgang konnte nicht sicher gestartet werden." };
    }

    const { data: listings, error } = await supabase
      .from("listings")
      .select(
        "id,title,price_cents,currency,cover_url,seller_id,status,kind,shipping_mode,shipping_price_cents",
      )
      .in(
        "id",
        data.items.map((i) => i.listing_id),
      );
    if (error) return { error: error.message };

    const available = (listings ?? []).filter((listing) => listing.status === "published");
    const lines = data.items
      .map((item) => ({
        item,
        listing: available.find((listing) => listing.id === item.listing_id),
      }))
      .filter(
        (
          line,
        ): line is { item: typeof line.item; listing: NonNullable<(typeof available)[number]> } =>
          Boolean(line.listing),
      );

    if (lines.length !== data.items.length)
      return { error: "Mindestens ein Produkt ist nicht mehr verfügbar." };
    if (lines.some((line) => line.listing.seller_id === userId)) {
      return { error: "Du kannst deine eigenen Produkte nicht kaufen." };
    }
    if (new Set(lines.map((line) => (line.listing.currency || "eur").toLowerCase())).size !== 1) {
      return {
        error: "Produkte mit unterschiedlichen Währungen können nicht gemeinsam bezahlt werden.",
      };
    }

    const offerIds = lines
      .map((line) => line.item.offer_id)
      .filter((id): id is string => Boolean(id));
    if (offerIds.length) {
      const { data: offers, error: offersError } = await supabase
        .from("private_offers")
        .select("id,listing_id,buyer_id,price_cents,qty,accepted_at,declined_at,expires_at")
        .in("id", offerIds);
      if (offersError) return { error: "Das Angebot konnte nicht geprüft werden." };
      for (const line of lines) {
        if (!line.item.offer_id) continue;
        const offer = (offers ?? []).find((candidate) => candidate.id === line.item.offer_id);
        if (
          !offer ||
          offer.buyer_id !== userId ||
          offer.listing_id !== line.listing.id ||
          !offer.accepted_at ||
          offer.declined_at ||
          new Date(offer.expires_at) < new Date()
        ) {
          return { error: `Der Angebotspreis für „${line.listing.title}“ ist nicht mehr gültig.` };
        }
        line.listing = { ...line.listing, price_cents: offer.price_cents };
        line.item = { ...line.item, qty: offer.qty };
      }
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const originalProductsTotalCents = lines.reduce(
      (sum, line) => sum + line.listing.price_cents * line.item.qty,
      0,
    );
    const shippingByLine = lines.map((line) => ({
      ...line,
      shippingCents:
        line.listing.kind !== "digital" && line.listing.shipping_mode === "extra"
          ? Math.max(0, line.listing.shipping_price_cents ?? 0) * line.item.qty
          : 0,
    }));
    const shippingCents = shippingByLine.reduce((sum, line) => sum + line.shippingCents, 0);
    let discountCode: { id: string; amount: number } | null = null;
    if (data.discountCode) {
      if (!/^[A-Z0-9-]{3,40}$/.test(data.discountCode))
        return { error: "Der Rabattcode ist ungültig." };
      const now = new Date().toISOString();
      const { data: foundCode, error: discountError } = await supabaseAdmin
        .from("discount_codes")
        .select("id,amount,kind")
        .eq("code", data.discountCode)
        .eq("active", true)
        .is("owner_id", null)
        .eq("scope", "global")
        .lte("valid_from", now)
        .or(`valid_until.is.null,valid_until.gt.${now}`)
        .maybeSingle();
      if (discountError) return { error: "Der Rabattcode konnte nicht geprüft werden." };
      if (
        !foundCode ||
        foundCode.kind !== "percent" ||
        !Number.isInteger(foundCode.amount) ||
        foundCode.amount < 1 ||
        foundCode.amount > 90
      ) {
        return { error: "Der Rabattcode ist ungültig oder abgelaufen." };
      }
      discountCode = { id: foundCode.id, amount: foundCode.amount };
      for (const line of lines) {
        line.listing = {
          ...line.listing,
          price_cents: Math.floor((line.listing.price_cents * (100 - discountCode.amount)) / 100),
        };
      }
    }

    const productsTotalCents = lines.reduce(
      (sum, line) => sum + line.listing.price_cents * line.item.qty,
      0,
    );
    const totalCents = productsTotalCents + shippingCents;
    const discountCents = originalProductsTotalCents - productsTotalCents;
    const currency = (lines[0]!.listing.currency || "eur").toLowerCase();

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        buyer_id: userId,
        total_cents: totalCents,
        shipping_cents: shippingCents,
        currency,
        status: "pending",
        discount_code_id: discountCode?.id ?? null,
        discount_cents: discountCents,
      })
      .select("id")
      .single();
    if (orderError || !order)
      return { error: orderError?.message ?? "Bestellung konnte nicht angelegt werden." };
    const orderId = order.id;

    const { error: itemsError } = await supabaseAdmin.from("order_items").insert(
      shippingByLine.map((line) => ({
        order_id: orderId,
        listing_id: line.listing.id,
        seller_id: line.listing.seller_id,
        unit_price_cents: line.listing.price_cents,
        shipping_cents: line.shippingCents,
        qty: line.item.qty,
      })),
    );
    if (itemsError) {
      console.error("[checkout] unable to save order items", itemsError);
      const { error: cancelError } = await supabaseAdmin
        .from("orders")
        .update({ status: "cancelled" })
        .eq("id", orderId);
      if (cancelError) console.error("[checkout] unable to cancel incomplete order", cancelError);
      return { error: "Die Bestellung konnte nicht vorbereitet werden." };
    }

    if (discountCode) {
      const { data: reserved, error: reserveError } = await supabaseAdmin.rpc(
        "reserve_discount_code",
        {
          _code_id: discountCode.id,
          _order_id: orderId,
        },
      );
      if (reserveError || reserved !== true) {
        if (reserveError) console.error("[checkout] unable to reserve discount code", reserveError);
        const { error: cancelError } = await supabaseAdmin
          .from("orders")
          .update({ status: "cancelled" })
          .eq("id", orderId);
        if (cancelError)
          console.error(
            "[checkout] unable to cancel order after discount reservation",
            cancelError,
          );
        return {
          error:
            "Der Rabattcode wurde inzwischen aufgebraucht oder ist abgelaufen. Bitte versuche es erneut.",
        };
      }
    }

    const { default: Stripe } = await import("stripe");
    const stripe = new Stripe(secret);
    let stripeSessionId: string | null = null;

    async function cancelOrder() {
      if (stripeSessionId) {
        const { data: released, error: releaseError } = await supabaseAdmin.rpc(
          "release_checkout_order",
          {
            _order_id: orderId,
            _stripe_session_id: stripeSessionId,
          },
        );
        if (!releaseError && released) return;
        if (releaseError) console.error("[checkout] unable to release order", releaseError);
      }
      const [{ error: orderCancelError }, { error: reservationDeleteError }] = await Promise.all([
        supabaseAdmin
          .from("orders")
          .update({ status: "cancelled" })
          .eq("id", orderId)
          .eq("status", "pending"),
        supabaseAdmin.from("discount_code_reservations").delete().eq("order_id", orderId),
      ]);
      if (orderCancelError) console.error("[checkout] unable to cancel order", orderCancelError);
      if (reservationDeleteError)
        console.error("[checkout] unable to release discount reservation", reservationDeleteError);
    }

    try {
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        client_reference_id: orderId,
        metadata: {
          order_id: orderId,
          buyer_id: userId,
          ...(discountCode ? { discount_code_id: discountCode.id } : {}),
        },
        line_items: [
          ...lines.map((line) => ({
            quantity: line.item.qty,
            price_data: {
              currency,
              unit_amount: line.listing.price_cents,
              product_data: {
                name: line.listing.title,
                ...(line.listing.cover_url ? { images: [line.listing.cover_url] } : {}),
              },
            },
          })),
          ...(shippingCents > 0
            ? [
                {
                  quantity: 1,
                  price_data: {
                    currency,
                    unit_amount: shippingCents,
                    product_data: { name: "Versandkosten" },
                  },
                },
              ]
            : []),
        ],
        ...(shippingByLine.some((line) => line.listing.kind !== "digital")
          ? { shipping_address_collection: { allowed_countries: ["DE" as const] } }
          : {}),
        success_url: `${origin}/checkout/erfolg?order=${orderId}`,
        cancel_url: `${origin}/checkout/abbruch?order=${orderId}`,
      });
      stripeSessionId = session.id;

      const { error: sessionUpdateError } = await supabaseAdmin
        .from("orders")
        .update({ stripe_session_id: session.id })
        .eq("id", orderId);
      if (sessionUpdateError) throw sessionUpdateError;

      if (discountCode) {
        const { error: reservationUpdateError } = await supabaseAdmin
          .from("discount_code_reservations")
          .update({
            stripe_session_id: session.id,
            expires_at: new Date(session.expires_at * 1000).toISOString(),
          })
          .eq("order_id", orderId);
        if (reservationUpdateError) throw reservationUpdateError;
      }

      if (!session.url) throw new Error("Stripe hat keine Checkout-URL zurückgegeben.");
      return { url: session.url };
    } catch (err) {
      console.error("[stripe] checkout session failed", err);
      if (stripeSessionId) {
        try {
          await stripe.checkout.sessions.expire(stripeSessionId);
        } catch (expireError) {
          console.error("[stripe] unable to expire checkout session", expireError);
        }
      }
      await cancelOrder();
      return {
        error: "Der Bezahlvorgang konnte nicht gestartet werden. Bitte später nochmal versuchen.",
      };
    }
  });

export const fetchOrderStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { orderId: string }) => ({ orderId: String(d?.orderId ?? "") }))
  .handler(async ({ data, context }) => {
    const { data: order, error } = await context.supabase
      .from("orders")
      .select("id,total_cents,currency,status,created_at")
      .eq("id", data.orderId)
      .maybeSingle();
    if (error) throw new Error("Bestellstatus konnte nicht geladen werden.");
    return order ?? null;
  });
