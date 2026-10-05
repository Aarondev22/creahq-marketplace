import React, { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Send, Store, Tag, Check, X, Repeat } from "lucide-react";
import { fetchOffers, createOffer, respondToOffer, type Offer } from "@/lib/offers.functions";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/lib/cart";
import { useNavigate } from "@tanstack/react-router";
import {
  fetchConversations,
  fetchMessages,
  sendMessage,
  type ChatMessage,
  type Conversation,
} from "@/lib/chat.functions";

export const Route = createFileRoute("/_authenticated/chat/$id")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({ offer: s.offer === 1 || s.offer === "1" ? 1 : undefined }) as { offer?: 1 },
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
  const search = Route.useSearch();
  const { addOfferItem } = useCart();
  const nav = useNavigate();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [offerOpen, setOfferOpen] = useState(search.offer === 1);
  const [offerPrice, setOfferPrice] = useState("");
  const [offerQty, setOfferQty] = useState("1");
  const [offerNote, setOfferNote] = useState("");
  const [counterOf, setCounterOf] = useState<Offer | null>(null);

  const reloadOffers = () => fetchOffers(id).then(setOffers).catch(() => {});
  useEffect(() => { reloadOffers(); }, [id]);

  async function submitOffer(e: React.FormEvent) {
    e.preventDefault();
    if (!conv || !conv.listing_id) return toast.error("Angebote gehen nur in Produkt-Chats.");
    const euros = Number(offerPrice.replace(",", "."));
    if (!euros || euros <= 0) return toast.error("Bitte einen gültigen Preis eingeben.");
    try {
      if (counterOf) await respondToOffer(counterOf.id, false);
      await createOffer({
        conversationId: id, listingId: conv.listing_id, sellerId: conv.seller_id, buyerId: conv.buyer_id,
        priceCents: Math.round(euros * 100), qty: Number(offerQty) || 1,
        note: counterOf ? `Gegenangebot${offerNote ? ": " + offerNote : ""}` : offerNote,
      });
      toast.success(counterOf ? "Gegenangebot gesendet" : "Preisvorschlag gesendet");
      setOfferOpen(false); setCounterOf(null); setOfferPrice(""); setOfferNote(""); setOfferQty("1");
      const [msgs] = await Promise.all([fetchMessages(id), reloadOffers()]);
      setMessages(msgs);
    } catch (err) { toast.error(err instanceof Error ? err.message : "Fehler beim Senden"); }
  }

  async function answer(o: Offer, accept: boolean) {
    try {
      await respondToOffer(o.id, accept);
      toast.success(accept ? "Angebot angenommen 🎉" : "Angebot abgelehnt");
      const [msgs] = await Promise.all([fetchMessages(id), reloadOffers()]);
      setMessages(msgs);
    } catch (err) { toast.error(err instanceof Error ? err.message : "Fehler"); }
  }

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
          if (incoming.kind === "offer" || incoming.body?.startsWith("✅") || incoming.body?.startsWith("❌")) {
            fetchOffers(id).then(setOffers).catch(() => {});
          }
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
              const offer = m.offer_id ? offers.find((o) => o.id === m.offer_id) : undefined;
              if (offer) {
                const expired = new Date(offer.expires_at) < new Date();
                const state = offer.accepted_at ? "Angenommen ✅" : offer.declined_at ? "Abgelehnt" : expired ? "Abgelaufen" : "Offen";
                const canAnswer = !mine && !offer.accepted_at && !offer.declined_at && !expired;
                return (
                  <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div className="w-full max-w-sm rounded-3xl border-2 border-brand/40 bg-brand-soft/40 p-4 shadow-sm">
                      <div className="flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-brand"><Tag className="h-3.5 w-3.5" /> {mine ? "Dein Vorschlag" : "Preisvorschlag"}</span>
                        <span className="rounded-full bg-card px-2.5 py-0.5 text-xs font-bold text-brand-ink">{state}</span>
                      </div>
                      <div className="mt-2 font-display text-3xl font-black text-brand-ink">{(offer.price_cents / 100).toFixed(2)} €</div>
                      <div className="text-sm text-muted-foreground">{offer.qty}× · pro Stück</div>
                      {offer.note && <p className="mt-2 text-sm text-brand-ink">{offer.note}</p>}
                      {canAnswer && (
                        <div className="mt-3 grid grid-cols-3 gap-2">
                          <button onClick={() => answer(offer, true)} className="inline-flex min-h-11 items-center justify-center gap-1 rounded-2xl bg-brand text-xs font-bold text-primary-foreground"><Check className="h-4 w-4" />Annehmen</button>
                          <button onClick={() => { setCounterOf(offer); setOfferQty(String(offer.qty)); setOfferOpen(true); }} className="inline-flex min-h-11 items-center justify-center gap-1 rounded-2xl border-2 border-brand bg-card text-xs font-bold text-brand"><Repeat className="h-4 w-4" />Gegen</button>
                          <button onClick={() => answer(offer, false)} className="inline-flex min-h-11 items-center justify-center gap-1 rounded-2xl border-2 border-border bg-card text-xs font-bold text-brand-ink"><X className="h-4 w-4" />Ablehnen</button>
                        </div>
                      )}
                      {offer.accepted_at && !expired && myId === offer.buyer_id && conv && (
                        <button
                          onClick={() => {
                            addOfferItem({ id: offer.listing_id, title: conv.listing_title ?? "Produkt", cover_url: conv.listing_cover, price_cents: offer.price_cents, qty: offer.qty, offer_id: offer.id });
                            toast.success("Zum Angebotspreis im Warenkorb 🛒");
                            nav({ to: "/warenkorb" });
                          }}
                          className="mt-3 min-h-11 w-full rounded-2xl bg-brand text-sm font-bold text-primary-foreground"
                        >
                          Zum Angebotspreis in den Warenkorb
                        </button>
                      )}
                      <p className="mt-2 text-[10px] text-muted-foreground">{timeShort(m.created_at)}</p>
                    </div>
                  </div>
                );
              }
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

        {offerOpen && conv?.listing_id && (
          <form onSubmit={submitOffer} className="space-y-2 border-t border-border bg-brand-soft/30 p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-brand-ink">{counterOf ? "Gegenangebot machen" : "Neuen Preis vorschlagen"}</span>
              <button type="button" onClick={() => { setOfferOpen(false); setCounterOf(null); }} aria-label="Schließen" className="grid h-9 w-9 place-items-center rounded-full hover:bg-card"><X className="h-4 w-4" /></button>
            </div>
            <div className="flex gap-2">
              <input inputMode="decimal" value={offerPrice} onChange={(e) => setOfferPrice(e.target.value)} placeholder="Preis in €" className="min-h-11 flex-1 rounded-2xl border border-border bg-background px-4 text-sm" />
              <input type="number" min={1} value={offerQty} onChange={(e) => setOfferQty(e.target.value)} aria-label="Menge" className="min-h-11 w-20 rounded-2xl border border-border bg-background px-3 text-sm" />
            </div>
            <input value={offerNote} onChange={(e) => setOfferNote(e.target.value)} placeholder="Notiz (optional)" className="min-h-11 w-full rounded-2xl border border-border bg-background px-4 text-sm" />
            <button type="submit" className="min-h-11 w-full rounded-2xl bg-brand text-sm font-bold text-primary-foreground">Vorschlag senden</button>
          </form>
        )}

        <form onSubmit={submit} className="flex gap-2 border-t border-border p-3">
          {conv?.listing_id && (
            <button type="button" onClick={() => { setCounterOf(null); setOfferOpen((v) => !v); }} aria-label="Preis vorschlagen" title="Preis vorschlagen" className="grid h-11 w-11 shrink-0 place-items-center rounded-full border-2 border-brand text-brand"><Tag className="h-4 w-4" /></button>
          )}
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
