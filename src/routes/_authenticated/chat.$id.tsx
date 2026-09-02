import React, { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Send, Store } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchConversations,
  fetchMessages,
  sendMessage,
  type ChatMessage,
  type Conversation,
} from "@/lib/chat.functions";

export const Route = createFileRoute("/_authenticated/chat/$id")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Chat zum Produkt — CreaHQ" },
      { name: "description", content: "Schreibe direkt mit dem Shop über dieses Produkt auf CreaHQ." },
      { property: "og:title", content: "Chat zum Produkt — CreaHQ" },
      { property: "og:description", content: "Schreibe direkt mit dem Shop über dieses Produkt auf CreaHQ." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ChatRoute,
});

function timeShort(iso: string) {
  const d = new Date(iso);
  const sameDay = d.toDateString() === new Date().toDateString();
  return sameDay
    ? d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" });
}

function ChatRoute() {
  const { id } = Route.useParams();
  const [conv, setConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [myId, setMyId] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setMyId(data.user?.id ?? null));
  }, []);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    Promise.all([fetchConversations(), fetchMessages(id)])
      .then(([convs, msgs]) => {
        if (!alive) return;
        setConv(convs.find((c) => c.id === id) ?? null);
        setMessages(msgs);
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : "Chat konnte nicht geladen werden."))
      .finally(() => alive && setLoading(false));

    const channel = supabase
      .channel(`chat:${id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${id}` },
        (payload) => {
          const incoming = payload.new as ChatMessage;
          setMessages((prev) => (prev.some((m) => m.id === incoming.id) ? prev : [...prev, incoming]));
        },
      )
      .subscribe();

    return () => {
      alive = false;
      supabase.removeChannel(channel);
    };
  }, [id]);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const title = useMemo(() => conv?.other_name ?? "Chat", [conv]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim() || sending) return;
    const text = draft.trim();
    setDraft("");
    setSending(true);
    try {
      const saved = await sendMessage(id, text);
      setMessages((prev) => (prev.some((m) => m.id === saved.id) ? prev : [...prev, saved]));
    } catch (err) {
      setDraft(text);
      toast.error(err instanceof Error ? err.message : "Senden fehlgeschlagen");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-10">
      <Link
        to="/nachrichten"
        search={{ c: undefined }}
        className="mb-4 inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-card px-4 text-sm font-bold text-brand-ink hover:border-brand hover:text-brand"
      >
        <ArrowLeft className="h-4 w-4" /> Alle Chats
      </Link>

      <section className="flex min-h-[70vh] flex-col overflow-hidden rounded-[2rem] border border-border bg-card">
        <header className="flex items-center gap-3 border-b border-border bg-brand-soft/30 px-4 py-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-brand-soft">
            {conv?.listing_cover ? (
              <img src={conv.listing_cover} alt="" className="h-full w-full object-cover" />
            ) : (
              <Store className="h-5 w-5 text-brand" />
            )}
          </span>
          <div className="min-w-0">
            {conv?.other_handle ? (
              <Link
                to="/shop/$handle"
                params={{ handle: conv.other_handle }}
                className="block truncate font-display text-lg font-black text-brand-ink hover:text-brand"
              >
                {title}
              </Link>
            ) : (
              <div className="truncate font-display text-lg font-black text-brand-ink">{title}</div>
            )}
            {conv?.listing_id ? (
              <Link
                to="/listing/$id"
                params={{ id: conv.listing_id }}
                className="block truncate text-xs font-semibold text-muted-foreground hover:text-brand"
              >
                📦 {conv.listing_title ?? "Produkt"}
              </Link>
            ) : (
              <div className="text-xs text-muted-foreground">Allgemeiner Chat</div>
            )}
          </div>
        </header>

        <div ref={listRef} className="flex-1 space-y-2 overflow-y-auto p-4">
          {loading ? (
            <div className="space-y-2">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className={`h-10 w-2/3 animate-pulse rounded-2xl bg-brand-soft/50 ${i % 2 ? "ml-auto" : ""}`}
                />
              ))}
            </div>
          ) : messages.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">Sag Hallo 👋 – noch keine Nachrichten.</div>
          ) : (
            messages.map((m) => {
              const mine = m.sender_id === myId;
              return (
                <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[78%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                      mine ? "rounded-br-md bg-brand text-primary-foreground" : "rounded-bl-md bg-surface text-brand-ink"
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{m.body}</p>
                    <p className={`mt-1 text-[10px] ${mine ? "opacity-75" : "text-muted-foreground"}`}>
                      {timeShort(m.created_at)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <form onSubmit={submit} className="flex gap-2 border-t border-border p-3">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Nachricht schreiben …"
            className="min-h-11 flex-1 rounded-full border border-border bg-background px-4 py-2.5 text-sm focus:border-brand focus:outline-none"
          />
          <button
            type="submit"
            disabled={sending || !draft.trim()}
            aria-label="Nachricht senden"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand text-primary-foreground transition-transform hover:scale-105 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </section>
    </div>
  );
}
