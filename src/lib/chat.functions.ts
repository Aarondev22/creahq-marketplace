import { supabase } from "@/integrations/supabase/client";

export type Conversation = {
  id: string;
  buyer_id: string;
  seller_id: string;
  listing_id: string | null;
  last_message_at: string;
  other_id: string;
  other_name: string;
  other_handle: string | null;
  listing_title: string | null;
  listing_cover: string | null;
};

export type ChatMessage = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

async function myId(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  const id = data.user?.id;
  if (!id) throw new Error("Bitte melde dich an.");
  return id;
}

export async function fetchConversations(): Promise<Conversation[]> {
  const me = await myId();
  const { data: convs, error } = await supabase
    .from("conversations")
    .select("id,buyer_id,seller_id,listing_id,last_message_at")
    .or(`buyer_id.eq.${me},seller_id.eq.${me}`)
    .order("last_message_at", { ascending: false });
  if (error) throw new Error(error.message);
  const rows = convs ?? [];
  if (rows.length === 0) return [];

  const otherIds = [...new Set(rows.map((c) => (c.buyer_id === me ? c.seller_id : c.buyer_id)))];
  const listingIds = [...new Set(rows.map((c) => c.listing_id).filter(Boolean))] as string[];

  const [{ data: profiles }, { data: listings }] = await Promise.all([
    supabase.from("profiles").select("id,display_name,handle").in("id", otherIds),
    listingIds.length
      ? supabase.from("listings").select("id,title,cover_url").in("id", listingIds)
      : Promise.resolve({ data: [] as { id: string; title: string; cover_url: string | null }[] }),
  ]);

  const pMap = new Map((profiles ?? []).map((p) => [p.id, p]));
  const lMap = new Map((listings ?? []).map((l) => [l.id, l]));

  return rows.map((c) => {
    const otherId = c.buyer_id === me ? c.seller_id : c.buyer_id;
    const p = pMap.get(otherId);
    const l = c.listing_id ? lMap.get(c.listing_id) : undefined;
    return {
      ...c,
      other_id: otherId,
      other_name: p?.display_name ?? "Nutzer:in",
      other_handle: p?.handle ?? null,
      listing_title: l?.title ?? null,
      listing_cover: l?.cover_url ?? null,
    } as Conversation;
  });
}

export async function fetchMessages(conversationId: string): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from("messages")
    .select("id,conversation_id,sender_id,body,created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(200);
  if (error) throw new Error(error.message);
  return (data ?? []) as ChatMessage[];
}

/** Notify the other participant — must never break sending. */
async function notifyRecipient(conversationId: string, senderId: string) {
  try {
    const { data: conv } = await supabase
      .from("conversations")
      .select("buyer_id,seller_id")
      .eq("id", conversationId)
      .maybeSingle();
    if (!conv) return;
    const recipient = conv.buyer_id === senderId ? conv.seller_id : conv.buyer_id;
    await supabase.from("notifications").insert({
      user_id: recipient,
      category: "message",
      title: "Neue Nachricht 💬",
      body: "Du hast eine neue Nachricht erhalten.",
      link: `/nachrichten?c=${conversationId}`,
    });
  } catch {
    /* Benachrichtigung ist optional */
  }
}

export async function sendMessage(conversationId: string, body: string): Promise<ChatMessage> {
  const me = await myId();
  const { data, error } = await supabase
    .from("messages")
    .insert({ conversation_id: conversationId, sender_id: me, body })
    .select("id,conversation_id,sender_id,body,created_at")
    .single();
  if (error) throw new Error(error.message);

  try {
    await supabase
      .from("conversations")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", conversationId);
  } catch {
    /* ignore */
  }
  await notifyRecipient(conversationId, me);
  return data as ChatMessage;
}

/** Chat immer pro Produkt: findet oder erstellt die Konversation zu einem Listing. */
export async function startConversation(listingId: string, sellerId: string): Promise<string> {
  const me = await myId();
  if (me === sellerId) throw new Error("Das ist dein eigenes Produkt 🙂");

  const { data: existing } = await supabase
    .from("conversations")
    .select("id")
    .eq("listing_id", listingId)
    .eq("buyer_id", me)
    .eq("seller_id", sellerId)
    .maybeSingle();
  if (existing?.id) return existing.id;

  const { data, error } = await supabase
    .from("conversations")
    .insert({ listing_id: listingId, buyer_id: me, seller_id: sellerId })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return data.id;
}
