*** Begin Patch
*** Update File: src/lib/chat.functions.ts
@@
 export async function fetchConversations(): Promise<Conversation[]> {
@@
-  const { data: convs, error } = await supabase
+  const { data: convs, error } = await supabase
     .from("conversations")
     .select("id,buyer_id,seller_id,listing_id,last_message_at")
     .or(`buyer_id.eq.${myId},seller_id.eq.${myId}`)
     .order("last_message_at", { ascending: false });
*** End Patch
