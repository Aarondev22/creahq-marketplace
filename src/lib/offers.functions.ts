import { supabase } from "@/integrations/supabase/client";

export type Offer = {
  id: string;
  conversation_id: string;
  listing_id: string;
  seller_id: string;
  buyer_id: string;
  created_by: string | null;
  price_cents: number;
  qty: number;
  note: string | null;
  expires_at: string;
  accepted_at: string | null;
  declined_at: string | null;
  created_at: string;
};

const COLS =
  "id,conversation_id,listing_id,seller_id,buyer_id,created_by,price_cents,qty,note,expires_at,accepted_at,declined_at,created_at";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const offers = () => supabase.from("private_offers") as any;

export async function fetchOffers(conversationId: string): Promise<Offer[]> {
  const { data, error } = await offers()
    .select(COLS)
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as Offer[];
}

export async function createOffer(input: {
  conversationId: string;
  listingId: string;
  sellerId: string;
  buyerId: string;
  priceCents: number;
  qty: number;
  note?: string;
  days?: number;
}): Promise<Offer> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("Nicht eingeloggt");

  const expires = new Date(Date.now() + (input.days ?? 7) * 86_400_000).toISOString();
  const { data, error } = await offers()
    .insert({
      conversation_id: input.conversationId,
      listing_id: input.listingId,
      seller_id: input.sellerId,
      buyer_id: input.buyerId,
      created_by: u.user.id,
      price_cents: Math.max(1, Math.round(input.priceCents)),
      qty: Math.max(1, Math.round(input.qty)),
      note: input.note?.trim() || null,
      expires_at: expires,
    })
    .select(COLS)
    .single();
  if (error) throw new Error(error.message);

  const offer = data as Offer;
  await supabase.from("messages").insert({
    conversation_id: input.conversationId,
    sender_id: u.user.id,
    kind: "offer",
    offer_id: offer.id,
    body: `Angebot: ${offer.qty}× für ${(offer.price_cents / 100).toFixed(2)} € pro Stück${
      offer.note ? ` — ${offer.note}` : ""
    }`,
  });

  return offer;
}

export async function respondToOffer(offerId: string, accept: boolean): Promise<Offer> {
  const patch = accept
    ? { accepted_at: new Date().toISOString(), redeemed_at: new Date().toISOString() }
    : { declined_at: new Date().toISOString() };
  const { data, error } = await offers().update(patch).eq("id", offerId).select(COLS).single();
  if (error) throw new Error(error.message);
  const offer = data as Offer;

  const { data: u } = await supabase.auth.getUser();
  if (u.user) {
    await supabase.from("messages").insert({
      conversation_id: offer.conversation_id,
      sender_id: u.user.id,
      kind: "text",
      body: accept
        ? `✅ Angebot angenommen: ${offer.qty}× für ${(offer.price_cents / 100).toFixed(2)} €`
        : "❌ Angebot abgelehnt",
    });
  }
  return offer;
}
