import { supabase } from "@/integrations/supabase/client";

export type Conversation = {
  id: string;
  buyer_id: string;
  seller_id: string;
  listing_id: string | null;
  last_message_at: string;
  other_name: string;
  other_id: string;
  listing_title: string | null;
};

export type ChatMessage = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  kind: string;
  created_at: string;
};

/** Ein Chat pro Produkt: findet den Thread zu diesem Verkäufer + Produkt, oder legt ihn an. */
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
    .insert({ buyer_id: u.user.id, seller_id: sellerId, listing_id: listingId ?? null })
    .select("id")
    .single();

  if (error) throw error;
  return created.id;
}

export async function fetchConversations(): Promise<Conversation[]> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return [];
  const myId = u.user.id;

  const { data, error } = await supabase
    .from("conversations")
    .select("id,buyer_id,seller_id,listing_id,last_message_at, listings(title), profiles!conversations_buyer_id_fkey(display_name), seller:profiles!conversations_seller_id_fkey(display_name)")
    .or(`buyer_id.eq.${myId},seller_id.eq.${myId}`)
    .order("last_message_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((c: any) => {
    const iAmBuyer = c.buyer_id === myId;
    return {
      id: c.id,
      buyer_id: c.buyer_id,
      seller_id: c.seller_id,
      listing_id: c.listing_id,
      last_message_at: c.last_message_at,
      other_id: iAmBuyer ? c.seller_id : c.buyer_id,
      other_name: (iAmBuyer ? c.seller?.display_name : c.profiles?.display_name) ?? "Unbekannt",
      listing_title: c.listings?.title ?? null,
    };
  });
}

export async function fetchMessages(conversationId: string): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from("messages")
    .select("id,conversation_id,sender_id,body,kind,created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function sendMessage(conversationId: string, body: string) {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("Nicht eingeloggt");
  const { error } = await supabase.from("messages").insert({
    conversation_id: conversationId,
    sender_id: u.user.id,
    body,
  });
  if (error) throw error;
  await supabase.from("conversations").update({ last_message_at: new Date().toISOString() }).eq("id", conversationId);
}
