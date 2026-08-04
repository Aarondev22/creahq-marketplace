import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Send, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchConversations,
  fetchMessages,
  sendMessage,
  type Conversation,
  type ChatMessage,
} from "@/lib/chat.functions";
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
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setMyId(data.user?.id ?? null));
    fetchConversations().then(setConversations).catch((e) => toast.error(e.message));
  }, []);

  useEffect(() => {
    if (c) setActiveId(c);
  }, [c]);

  useEffect(() => {
    if (!activeId) return;
    setMessages([]);
    fetchMessages(activeId).then(setMessages).catch((e) => toast.error(e.message));

    const channel = supabase
      .channel(`messages:${activeId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${activeId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as ChatMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeId]);

  // Nur innerhalb der Message-Liste scrollen — NICHT die ganze Seite
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, activeId]);

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
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <h1 className="mb-6 font-display text-3xl font-black text-brand-ink">Nachrichten</h1>
      <div className="grid overflow-hidden rounded-[2rem] border border-border bg-card md:grid-cols-[300px_1fr]">
        {/* Liste */}
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
                    type="button"
                    onClick={() => setActiveId(c2.id)}
                    className={`flex w-full items-center gap-3 px-3 py-3 text-left text-sm transition-colors ${
                      activeId === c2.id ? "bg-brand-soft" : "hover:bg-surface"
                    }`}
                  >
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-brand-soft">
                      {c2.listing_cover ? (
                        <img
                          src={c2.listing_cover}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="grid h-full place-items-center text-lg">💬</div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-semibold text-brand-ink">
                        {c2.listing_title ?? "Chat"}
                      </div>
                      <div className="truncate text-xs text-muted-foreground">
                        {c2.other_name}
                      </div>
                    </div>
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
              <div className="flex items-center gap-3 border-b border-border px-4 py-3">
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-brand-soft">
                  {active.listing_cover ? (
                    <img
                      src={active.listing_cover}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="grid h-full place-items-center">📦</div>
                  )}
                </div>
                <div className="min-w-0">
                  {active.listing_id ? (
                    <Link
                      to="/listing/$id"
                      params={{ id: active.listing_id }}
                      className="block truncate font-display text-lg font-bold text-brand-ink hover:text-brand"
                    >
                      {active.listing_title ?? "Produkt"}
                    </Link>
                  ) : (
                    <div className="font-display text-lg font-bold text-brand-ink">
                      {active.listing_title ?? "Chat"}
                    </div>
                  )}
                  {active.other_handle ? (
                    <Link
                      to="/shop/$handle"
                      params={{ handle: active.other_handle }}
                      className="text-xs font-semibold text-muted-foreground hover:text-brand"
                    >
                      {active.other_name} · @{active.other_handle}
                    </Link>
                  ) : (
                    <div className="text-xs text-muted-foreground">{active.other_name}</div>
                  )}
                </div>
              </div>

              <div ref={listRef} className="flex-1 space-y-2 overflow-y-auto p-4">
                {messages.map((m) => {
                  const mine = m.sender_id === myId;
                  return (
                    <div
                      key={m.id}
                      className={`flex ${mine ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                          mine
                            ? "bg-brand text-primary-foreground"
                            : "bg-surface text-brand-ink"
                        }`}
                      >
                        {m.body}
                      </div>
                    </div>
                  );
                })}
              </div>

              <form onSubmit={submit} className="flex gap-2 border-t border-border p-3">
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Nachricht schreiben …"
                  className="flex-1 rounded-full border border-border bg-background px-4 py-2.5 text-sm focus:border-brand focus:outline-none"
                />
                <button
                  type="submit"
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand text-primary-foreground"
                >
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