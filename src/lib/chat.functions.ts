import { supabase } from "@/integrations/supabase/client";

export type Conversation = {
  id: string;
  buyer_id: string;
  seller_id: string;
  listing_id: string | null;
  last_message_at: string;
  other_name: string;
  other_id: string;
  other_handle: string | null;
  listing_title: string | null;
  listing_cover: string | null;
};

export type ChatMessage = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  kind: string;
  offer_id?: string | null;
  created_at: string;
};

export async function getOrCreateConversation(sellerId: string, listingId?: string) {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("Nicht eingeloggt");
  if (u.user.id === sellerId) throw new Error("Du kannst dir nicht selbst schreiben");

  let q = supabase
    .from("conversations")
    .select("id")
    .eq("buyer_id", u.user.id)
    .eq("seller_id", sellerId);

  q = listingId ? q.eq("listing_id", listingId) : q.is("listing_id", null);

  const { data: existing } = await q.maybeSingle();
  if (existing) return existing.id;

  const { data: created, error } = await supabase
    .from("conversations")
    .insert({
      buyer_id: u.user.id,
      seller_id: sellerId,
      listing_id: listingId ?? null,
    })
    .select("id")
    .single();

  if (error) throw error;
  return created.id;
}

export async function fetchConversations(): Promise<Conversation[]> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return [];
  const myId = u.user.id;

  const { data: convs, error } = await supabase
    .from("conversations")
    .select("id,buyer_id,seller_id,listing_id,last_message_at")
    .or(`buyer_id.eq.${myId},seller_id.eq.${myId}`)
    .order("last_message_at", { ascending: false });

  if (error) throw error;
  if (!convs?.length) return [];

  const otherIds = Array.from(
    new Set(convs.map((c) => (c.buyer_id === myId ? c.seller_id : c.buyer_id)))
  );
  const listingIds = Array.from(
    new Set(convs.map((c) => c.listing_id).filter(Boolean))
  ) as string[];

  const [{ data: profiles }, { data: listings }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id,display_name,handle")
      .in("id", otherIds.length ? otherIds : ["-"]),
    supabase
      .from("listings")
      .select("id,title,cover_url")
      .in("id", listingIds.length ? listingIds : ["-"]),
  ]);

  return convs.map((c) => {
    const otherId = c.buyer_id === myId ? c.seller_id : c.buyer_id;
    const profile = (profiles ?? []).find((p) => p.id === otherId);
    const listing = (listings ?? []).find((l) => l.id === c.listing_id);
    return {
      id: c.id,
      buyer_id: c.buyer_id,
      seller_id: c.seller_id,
      listing_id: c.listing_id,
      last_message_at: c.last_message_at,
      other_id: otherId,
      other_name: profile?.display_name ?? "Unbekannt",
      other_handle: profile?.handle ?? null,
      listing_title: listing?.title ?? null,
      listing_cover: listing?.cover_url ?? null,
    };
  });
}

export type ConversationDetail = Conversation & {
  listing_price_cents: number | null;
  listing_kind: string | null;
  listing_images: string[];
  listing_description: string | null;
  listing_condition: string | null;
  listing_location: string | null;
};

export async function fetchConversationDetail(id: string): Promise<ConversationDetail | null> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return null;
  const myId = u.user.id;

  const { data: c, error } = await supabase
    .from("conversations")
    .select("id,buyer_id,seller_id,listing_id,last_message_at")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!c) return null;

  const otherId = c.buyer_id === myId ? c.seller_id : c.buyer_id;
  const [{ data: profile }, listingRes] = await Promise.all([
    supabase.from("profiles").select("id,display_name,handle").eq("id", otherId).maybeSingle(),
    c.listing_id
      ? supabase
          .from("listings")
          .select("id,title,cover_url,price_cents,kind,images,description,condition,location")
          .eq("id", c.listing_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  const listing = listingRes.data as
    | {
        title: string;
        cover_url: string | null;
        price_cents: number;
        kind: string;
        images: string[] | null;
        description: string | null;
        condition: string | null;
        location: string | null;
      }
    | null;

  return {
    id: c.id,
    buyer_id: c.buyer_id,
    seller_id: c.seller_id,
    listing_id: c.listing_id,
    last_message_at: c.last_message_at,
    other_id: otherId,
    other_name: profile?.display_name ?? "Unbekannt",
    other_handle: profile?.handle ?? null,
    listing_title: listing?.title ?? null,
    listing_cover: listing?.cover_url ?? null,
    listing_price_cents: listing?.price_cents ?? null,
    listing_kind: listing?.kind ?? null,
    listing_images: listing?.images ?? [],
    listing_description: listing?.description ?? null,
    listing_condition: listing?.condition ?? null,
    listing_location: listing?.location ?? null,
  };
}

export async function fetchMessages(conversationId: string): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from("messages")
    .select("id,conversation_id,sender_id,body,kind,offer_id,created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function sendMessage(conversationId: string, body: string): Promise<ChatMessage> {
  const { data: u, error: authErr } = await supabase.auth.getUser();
  if (authErr || !u.user) throw new Error("Nicht eingeloggt – bitte neu anmelden.");

  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_id: u.user.id,
      body: body.trim(),
      kind: "text",
    })
    .select("id,conversation_id,sender_id,body,kind,offer_id,created_at")
    .single();

  if (error) throw new Error(error.message || "Nachricht konnte nicht gesendet werden.");

  // Best-effort: Sortierung der Chatliste aktualisieren (darf den Versand nie blockieren)
  void supabase
    .from("conversations")
    .update({ last_message_at: new Date().toISOString() })
    .eq("id", conversationId);

  return data as ChatMessage;
}
