import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Send, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { fetchConversations, fetchMessages, sendMessage, type Conversation, type ChatMessage } from "@/lib/chat.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/nachrichten")({
  validateSearch: (search: Record<string, unknown>) => ({
    c: typeof search.c === "string" ? search.c : undefined,
  }),
  head: () => ({ meta: [{ title: "Nachrichten — CreaHQ" }] }),
  component: MessagesPage,
});

function MessagesPage() {
  const { c } = Route.useSearch();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(c ?? null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [myId, setMyId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setMyId(data.user?.id ?? null));
    fetchConversations().then(setConversations).catch((e) => toast.error(e.message));
  }, []);

  useEffect(() => {
    if (!activeId) return;
    fetchMessages(activeId).then(setMessages).catch((e) => toast.error(e.message));

    const channel = supabase
      .channel(`messages:${activeId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${activeId}` }, (payload) => {
        setMessages((prev) => [...prev, payload.new as ChatMessage]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!activeId || !draft.trim()) return;
    const text = draft;
    setDraft("");
    try {
      await sendMessage(activeId, text);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Senden fehlgeschlagen");
    }
  }

  const active = conversations.find((x) => x.id === activeId);

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
      <h1 className="mb-6 font-display text-3xl font-black text-brand-ink">Nachrichten</h1>
      <div className="grid gap-4 overflow-hidden rounded-[2rem] border border-border bg-card md:grid-cols-[280px_1fr]">
        {/* Conversation list */}
        <div className="border-b border-border md:border-b-0 md:border-r">
          {conversations.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              <MessageCircle className="mx-auto mb-2 h-8 w-8 text-brand/40" />
              Noch keine Unterhaltungen.
            </div>
          ) : (
            <ul className="max-h-[70vh] overflow-y-auto">
              {conversations.map((c2) => (
                <li key={c2.id}>
                  <button
                    onClick={() => setActiveId(c2.id)}
                    className={`block w-full px-4 py-3 text-left text-sm transition-colors ${activeId === c2.id ? "bg-brand-soft" : "hover:bg-surface"}`}
                  >
                    <div className="font-semibold text-brand-ink">{c2.other_name}</div>
                    {c2.listing_title && <div className="truncate text-xs text-muted-foreground">{c2.listing_title}</div>}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Thread */}
        <div className="flex min-h-[50vh] flex-col">
          {!active ? (
            <div className="grid flex-1 place-items-center p-10 text-sm text-muted-foreground">
              Wähle links eine Unterhaltung aus.
            </div>
          ) : (
            <>
              <div className="border-b border-border px-4 py-3">
                <div className="font-display text-lg font-bold text-brand-ink">{active.other_name}</div>
                {active.listing_title && <div className="text-xs text-muted-foreground">zu: {active.listing_title}</div>}
              </div>
              <div className="flex-1 space-y-2 overflow-y-auto p-4">
                {messages.map((m) => {
                  const mine = m.sender_id === myId;
                  return (
                    <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${mine ? "bg-brand text-primary-foreground" : "bg-surface text-brand-ink"}`}>
                        {m.body}
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>
              <form onSubmit={submit} className="flex gap-2 border-t border-border p-3">
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Nachricht schreiben …"
                  className="flex-1 rounded-full border border-border bg-background px-4 py-2.5 text-sm focus:border-brand focus:outline-none"
                />
                <button type="submit" className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand text-primary-foreground">
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
