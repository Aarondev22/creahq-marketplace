import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { MessagesSquare, Send, Store } from "lucide-react";
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
  head: () => ({
    meta: [
      { title: "Nachrichten — CreaHQ" },
      { name: "description", content: "Chatte direkt mit Shops und Käufer:innen auf CreaHQ." },
      { property: "og:title", content: "Nachrichten — CreaHQ" },
      { property: "og:description", content: "Chatte direkt mit Shops und Käufer:innen auf CreaHQ." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MessagesPage,
});

function timeShort(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  return sameDay
    ? d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" });
}

function MessagesPage() {
  const { c } = Route.useSearch();
  const navigate = useNavigate();
  const [convs, setConvs] = useState<Conversation[]>([]);
  const [convsLoading, setConvsLoading] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [msgLoading, setMsgLoading] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [myId, setMyId] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const active = useMemo(() => convs.find((x) => x.id === c) ?? null, [convs, c]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setMyId(data.user?.id ?? null));
  }, []);

  useEffect(() => {
    fetchConversations()
      .then(setConvs)
      .catch((e) => toast.error(e instanceof Error ? e.message : "Chats konnten nicht geladen werden."))
      .finally(() => setConvsLoading(false));
  }, []);

  useEffect(() => {
    if (!c) {
      setMessages([]);
      return;
    }
    setMessages([]);
    setMsgLoading(true);
    fetchMessages(c)
      .then(setMessages)
      .catch((e) => toast.error(e instanceof Error ? e.message : "Nachrichten konnten nicht geladen werden."))
      .finally(() => setMsgLoading(false));

    const channel = supabase
      .channel(`messages:${c}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${c}` },
        (payload) => {
          const incoming = payload.new as ChatMessage;
          setMessages((prev) => (prev.some((m) => m.id === incoming.id) ? prev : [...prev, incoming]));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [c]);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!c || !draft.trim() || sending) return;
    const text = draft.trim();
    setDraft("");
    setSending(true);
    try {
      const saved = await sendMessage(c, text);
      setMessages((prev) => (prev.some((m) => m.id === saved.id) ? prev : [...prev, saved]));
      setConvs((prev) =>
        [...prev].sort((a, b) =>
          a.id === c ? -1 : b.id === c ? 1 : b.last_message_at.localeCompare(a.last_message_at),
        ),
      );
    } catch (err) {
      setDraft(text);
      toast.error(err instanceof Error ? err.message : "Senden fehlgeschlagen");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <h1 className="mb-4 font-display text-3xl font-black text-brand-ink">Nachrichten 💬</h1>

      <div className="grid gap-4 md:grid-cols-[20rem_1fr]">
        {/* Chatliste */}
        <aside className={`${c ? "hidden md:block" : "block"} rounded-[2rem] border border-border bg-card p-2`}>
          {convsLoading ? (
            <div className="space-y-2 p-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-2xl bg-brand-soft/50" />
              ))}
            </div>
          ) : convs.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-brand-soft text-brand">
                <MessagesSquare className="h-6 w-6" />
              </div>
              <p className="text-sm font-bold text-brand-ink">Noch keine Chats</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Öffne ein Produkt und schreibe dem Shop – hier landet dann alles.
              </p>
            </div>
          ) : (
            <ul className="max-h-[70vh] space-y-1 overflow-y-auto">
              {convs.map((conv) => {
                const isActive = conv.id === c;
                return (
                  <li key={conv.id}>
                    <button
                      type="button"
                      onClick={() => navigate({ to: "/nachrichten", search: { c: conv.id } })}
                      className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors ${
                        isActive ? "bg-brand text-primary-foreground" : "hover:bg-brand-soft/60"
                      }`}
                    >
                      <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-brand-soft">
                        {conv.listing_cover ? (
                          <img src={conv.listing_cover} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <Store className="h-5 w-5 text-brand" />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className="truncate text-sm font-bold">{conv.other_name}</span>
                          <span className={`shrink-0 text-[10px] ${isActive ? "opacity-80" : "text-muted-foreground"}`}>
                            {timeShort(conv.last_message_at)}
                          </span>
                        </span>
                        <span
                          className={`mt-0.5 block truncate text-xs ${
                            isActive ? "opacity-90" : "text-muted-foreground"
                          }`}
                        >
                          {conv.listing_title ?? "Allgemeiner Chat"}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>

        {/* Chatfenster */}
        {!c ? (
          <div className="hidden place-items-center rounded-[2rem] border border-dashed border-border bg-card p-10 text-center md:grid">
            <div>
              <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-full bg-brand-soft text-brand">
                <MessagesSquare className="h-7 w-7" />
              </div>
              <p className="font-display text-xl font-black text-brand-ink">Wähle einen Chat</p>
              <p className="mt-1 text-sm text-muted-foreground">Links auswählen oder über ein Produkt starten.</p>
            </div>
          </div>
        ) : (
          <section className="flex min-h-[65vh] flex-col overflow-hidden rounded-[2rem] border border-border bg-card">
            <header className="flex items-center gap-3 border-b border-border bg-brand-soft/30 px-4 py-3">
              <button
                type="button"
                onClick={() => navigate({ to: "/nachrichten", search: {} })}
                className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-brand-soft md:pointer-events-none"
                aria-label="Zurück zur Chatliste"
              >
                {active?.listing_cover ? (
                  <img src={active.listing_cover} alt="" className="h-full w-full object-cover" />
                ) : (
                  <Store className="h-5 w-5 text-brand" />
                )}
              </button>
              <div className="min-w-0">
                {active?.other_handle ? (
                  <Link
                    to="/shop/$handle"
                    params={{ handle: active.other_handle }}
                    className="block truncate font-display text-lg font-black text-brand-ink hover:text-brand"
                  >
                    {active.other_name}
                  </Link>
                ) : (
                  <div className="truncate font-display text-lg font-black text-brand-ink">
                    {active?.other_name ?? "Chat"}
                  </div>
                )}
                {active?.listing_id ? (
                  <Link
                    to="/listing/$id"
                    params={{ id: active.listing_id }}
                    className="block truncate text-xs font-semibold text-muted-foreground hover:text-brand"
                  >
                    📦 {active.listing_title ?? "Produkt"}
                  </Link>
                ) : (
                  <div className="text-xs text-muted-foreground">Allgemeiner Chat</div>
                )}
              </div>
            </header>

            <div ref={listRef} className="flex-1 space-y-2 overflow-y-auto p-4">
              {msgLoading ? (
                <div className="space-y-2">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className={`h-10 w-2/3 animate-pulse rounded-2xl bg-brand-soft/50 ${i % 2 ? "ml-auto" : ""}`}
                    />
                  ))}
                </div>
              ) : messages.length === 0 ? (
                <div className="py-10 text-center text-sm text-muted-foreground">
                  Sag Hallo 👋 – noch keine Nachrichten.
                </div>
              ) : (
                messages.map((m) => {
                  const mine = m.sender_id === myId;
                  return (
                    <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[78%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                          mine
                            ? "rounded-br-md bg-brand text-primary-foreground"
                            : "rounded-bl-md bg-surface text-brand-ink"
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
        )}
      </div>
    </div>
  );
}
