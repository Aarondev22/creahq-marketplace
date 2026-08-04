import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
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
  head: () => ({ meta: [{ title: "Chat — CreaHQ" }] }),
  component: MessagesPage,
});

function MessagesPage() {
  const { c } = Route.useSearch();
  const [active, setActive] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [myId, setMyId] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setMyId(data.user?.id ?? null));
  }, []);

  useEffect(() => {
    if (!c) {
      setActive(null);
      setMessages([]);
      return;
    }
    fetchConversations()
      .then((all) => {
        const found = all.find((x) => x.id === c) ?? null;
        setActive(found);
      })
      .catch((e) => toast.error(e.message));
  }, [c]);

  useEffect(() => {
    if (!c) return;
    setMessages([]);
    fetchMessages(c).then(setMessages).catch((e) => toast.error(e.message));

    const channel = supabase
      .channel(`messages:${c}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${c}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as ChatMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [c]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages]);

    async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!c || !draft.trim()) return;
    const text = draft.trim();
    setDraft("");
    try {
      await sendMessage(c, text);
      const { data: u } = await supabase.auth.getUser();
      if (u.user) {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            conversation_id: c,
            sender_id: u.user!.id,
            body: text,
            kind: "text",
            created_at: new Date().toISOString(),
          },
        ]);
      }
    } catch (err) {
      setDraft(text);
      const msg = err instanceof Error ? err.message : "Senden fehlgeschlagen";
      toast.error(msg);
      console.error(err);
    }
  }

  if (!c) {
    return (
      <div className="mx-auto max-w-lg px-6 py-16 text-center">
        <p className="font-display text-xl font-black text-brand-ink">Kein Chat gewählt</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Öffne den Chat über ein Produkt (Chat-Button) oder über eine Nachricht in der Glocke.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <div className="flex min-h-[60vh] flex-col overflow-hidden rounded-[2rem] border border-border bg-card">
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-brand-soft">
            {active?.listing_cover ? (
              <img src={active.listing_cover} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full place-items-center">📦</div>
            )}
          </div>
          <div className="min-w-0">
            {active?.listing_id ? (
              <Link
                to="/listing/$id"
                params={{ id: active.listing_id }}
                className="block truncate font-display text-lg font-bold text-brand-ink hover:text-brand"
              >
                {active.listing_title ?? "Produkt"}
              </Link>
            ) : (
              <div className="font-display text-lg font-bold text-brand-ink">
                {active?.listing_title ?? "Chat"}
              </div>
            )}
            {active?.other_handle ? (
              <Link
                to="/shop/$handle"
                params={{ handle: active.other_handle }}
                className="text-xs font-semibold text-muted-foreground hover:text-brand"
              >
                {active.other_name} · @{active.other_handle}
              </Link>
            ) : (
              <div className="text-xs text-muted-foreground">{active?.other_name ?? "…"}</div>
            )}
          </div>
        </div>

        <div ref={listRef} className="flex-1 space-y-2 overflow-y-auto p-4">
          {messages.map((m) => {
            const mine = m.sender_id === myId;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                    mine ? "bg-brand text-primary-foreground" : "bg-surface text-brand-ink"
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
      </div>
    </div>
  );
}