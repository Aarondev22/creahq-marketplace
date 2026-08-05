import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, MessagesSquare, Package, Send, Store, Tag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchConversationDetail,
  fetchMessages,
  sendMessage,
  type ChatMessage,
  type ConversationDetail,
} from "@/lib/chat.functions";
import { createOffer, fetchOffers, respondToOffer, type Offer } from "@/lib/offers.functions";
import { useCart } from "@/lib/cart";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/chat/$id")({
  head: () => ({
    meta: [
      { title: "Produkt-Chat — CreaHQ" },
      { name: "description", content: "Direkter Chat zu einem Produkt: Fragen stellen und Angebote aushandeln." },
      { property: "og:title", content: "Produkt-Chat — CreaHQ" },
      { property: "og:description", content: "Direkter Chat zu einem Produkt: Fragen stellen und Angebote aushandeln." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProductChatPage,
});

function euro(cents: number) {
  return (cents / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" });
}

function timeShort(iso: string) {
  const d = new Date(iso);
  const sameDay = d.toDateString() === new Date().toDateString();
  return sameDay
    ? d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" });
}

function ProductChatPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { addItem, setQty } = useCart();
  const [conv, setConv] = useState<ConversationDetail | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [myId, setMyId] = useState<string | null>(null);
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [offerPrice, setOfferPrice] = useState("");
  const [offerQty, setOfferQty] = useState("1");
  const [offerNote, setOfferNote] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setMyId(data.user?.id ?? null));
  }, []);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    Promise.all([fetchConversationDetail(id), fetchMessages(id), fetchOffers(id).catch(() => [])])
      .then(([c, m, o]) => {
        if (!alive) return;
        setConv(c);
        setMessages(m);
        setOffers(o as Offer[]);
        if (c?.listing_price_cents) setOfferPrice((c.listing_price_cents / 100).toFixed(2));
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
          fetchOffers(id).then(setOffers).catch(() => undefined);
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

  async function submitOffer(e: React.FormEvent) {
    e.preventDefault();
    if (!conv?.listing_id) return;
    const price = Math.round(Number(offerPrice.replace(",", ".")) * 100);
    const qty = Number(offerQty);
    if (!price || price < 1 || !qty || qty < 1) {
      toast.error("Bitte Preis und Menge korrekt ausfüllen.");
      return;
    }
    try {
      const offer = await createOffer({
        conversationId: id,
        listingId: conv.listing_id,
        sellerId: conv.seller_id,
        buyerId: conv.buyer_id,
        priceCents: price,
        qty,
        note: offerNote,
      });
      setOffers((prev) => [...prev, offer]);
      setOfferNote("");
      setShowOfferForm(false);
      const fresh = await fetchMessages(id);
      setMessages(fresh);
      toast.success("Angebot gesendet 🤝");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Angebot fehlgeschlagen");
    }
  }

  async function handleRespond(offer: Offer, accept: boolean) {
    try {
      const updated = await respondToOffer(offer.id, accept);
      setOffers((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
      setMessages(await fetchMessages(id));
      if (accept && conv && myId === conv.buyer_id) applyOfferToCart(updated);
      toast.success(accept ? "Angebot angenommen ✅" : "Angebot abgelehnt");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Aktion fehlgeschlagen");
    }
  }

  function applyOfferToCart(offer: Offer) {
    if (!conv?.listing_id) return;
    addItem({
      id: conv.listing_id,
      title: conv.listing_title ?? "Produkt",
      price_cents: offer.price_cents,
      cover_url: conv.listing_cover,
    });
    setQty(conv.listing_id, offer.qty);
    toast.success("Angebotspreis in deinen Warenkorb übernommen 🛒");
  }

  const offerById = new Map(offers.map((o) => [o.id, o]));

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl space-y-4 px-4 py-8">
        <div className="h-32 animate-pulse rounded-[2rem] bg-brand-soft/50" />
        <div className="h-80 animate-pulse rounded-[2rem] bg-brand-soft/50" />
      </div>
    );
  }

  if (!conv) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <p className="font-display text-2xl font-black text-brand-ink">Chat nicht gefunden</p>
        <Link to="/nachrichten" search={{ c: undefined }} className="mt-4 inline-block text-sm font-bold text-brand">
          Zu allen Chats
        </Link>
      </div>
    );
  }

  const iAmSeller = myId === conv.seller_id;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
      <div className="mb-4 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => navigate({ to: conv.listing_id ? "/listing/$id" : "/nachrichten", params: conv.listing_id ? { id: conv.listing_id } : undefined, search: conv.listing_id ? undefined : { c: undefined } })}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-bold text-brand-ink hover:bg-brand-soft/60"
        >
          <ArrowLeft className="h-4 w-4" /> Zurück
        </button>
        <Link
          to="/nachrichten"
          search={{ c: undefined }}
          className="inline-flex items-center gap-2 rounded-full bg-brand-soft px-4 py-2 text-sm font-bold text-brand hover:opacity-90"
        >
          <MessagesSquare className="h-4 w-4" /> Alle Chats
        </Link>
      </div>

      {/* Produktkarte */}
      <section className="mb-4 overflow-hidden rounded-[2rem] border border-border bg-card">
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
          <div className="grid h-28 w-28 shrink-0 place-items-center overflow-hidden rounded-2xl bg-brand-soft">
            {conv.listing_cover ? (
              <img src={conv.listing_cover} alt={conv.listing_title ?? "Produkt"} className="h-full w-full object-cover" />
            ) : (
              <Package className="h-8 w-8 text-brand" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            {conv.other_handle ? (
              <Link to="/shop/$handle" params={{ handle: conv.other_handle }} className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-brand">
                <Store className="h-3.5 w-3.5" /> {conv.other_name}
              </Link>
            ) : (
              <span className="text-xs font-bold text-muted-foreground">{conv.other_name}</span>
            )}
            {conv.listing_id ? (
              <Link to="/listing/$id" params={{ id: conv.listing_id }} className="block truncate font-display text-2xl font-black text-brand-ink hover:text-brand">
                {conv.listing_title ?? "Produkt"}
              </Link>
            ) : (
              <div className="font-display text-2xl font-black text-brand-ink">Allgemeiner Chat</div>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-bold">
              {conv.listing_price_cents != null && (
                <span className="rounded-full bg-brand px-3 py-1 text-primary-foreground">{euro(conv.listing_price_cents)}</span>
              )}
              {conv.listing_kind && (
                <span className="rounded-full bg-brand-soft px-3 py-1 text-brand">
                  {conv.listing_kind === "digital" ? "⚡ Digital" : "📦 Physisch"}
                </span>
              )}
              {conv.listing_condition && (
                <span className="rounded-full border border-border px-3 py-1 text-muted-foreground">{conv.listing_condition}</span>
              )}
              {conv.listing_location && (
                <span className="rounded-full border border-border px-3 py-1 text-muted-foreground">📍 {conv.listing_location}</span>
              )}
            </div>
            {conv.listing_description && (
              <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{conv.listing_description}</p>
            )}
          </div>
        </div>
        {conv.listing_images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto border-t border-border p-3">
            {conv.listing_images.slice(0, 8).map((src) => (
              <img key={src} src={src} alt="" className="h-16 w-16 shrink-0 rounded-xl object-cover" />
            ))}
          </div>
        )}
      </section>

      {/* Chat */}
      <section className="flex min-h-[55vh] flex-col overflow-hidden rounded-[2rem] border border-border bg-card">
        <div ref={listRef} className="flex-1 space-y-2 overflow-y-auto p-4">
          {messages.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">Sag Hallo 👋 – noch keine Nachrichten.</div>
          ) : (
            messages.map((m) => {
              const mine = m.sender_id === myId;
              const offer = m.offer_id ? offerById.get(m.offer_id) : undefined;
              if (offer) {
                const open = !offer.accepted_at && !offer.declined_at;
                const canRespond = open && offer.created_by !== myId;
                return (
                  <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div className="max-w-[85%] rounded-2xl border-2 border-brand/40 bg-brand-soft/50 p-4">
                      <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-brand">
                        <Tag className="h-3.5 w-3.5" /> Angebot
                      </div>
                      <p className="mt-2 font-display text-xl font-black text-brand-ink">
                        {offer.qty}× {euro(offer.price_cents)}
                      </p>
                      <p className="text-xs text-muted-foreground">Gesamt {euro(offer.price_cents * offer.qty)}</p>
                      {offer.note && <p className="mt-2 text-sm text-brand-ink">„{offer.note}“</p>}
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        Gültig bis {new Date(offer.expires_at).toLocaleDateString("de-DE")}
                      </p>
                      {offer.accepted_at ? (
                        <p className="mt-2 text-sm font-bold text-brand">✅ Angenommen</p>
                      ) : offer.declined_at ? (
                        <p className="mt-2 text-sm font-bold text-muted-foreground">❌ Abgelehnt</p>
                      ) : canRespond ? (
                        <div className="mt-3 flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleRespond(offer, true)}
                            className="min-h-11 flex-1 rounded-full bg-brand px-4 text-sm font-bold text-primary-foreground hover:opacity-90"
                          >
                            Annehmen
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRespond(offer, false)}
                            className="min-h-11 rounded-full border border-border px-4 text-sm font-bold text-brand-ink hover:bg-brand-soft/60"
                          >
                            Ablehnen
                          </button>
                        </div>
                      ) : (
                        <p className="mt-2 text-xs text-muted-foreground">Warten auf Antwort …</p>
                      )}
                      {offer.accepted_at && myId === conv.buyer_id && (
                        <button
                          type="button"
                          onClick={() => applyOfferToCart(offer)}
                          className="mt-3 min-h-11 w-full rounded-full bg-brand px-4 text-sm font-bold text-primary-foreground hover:opacity-90"
                        >
                          🛒 Zum Angebotspreis in den Warenkorb
                        </button>
                      )}
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
                    <p className={`mt-1 text-[10px] ${mine ? "opacity-75" : "text-muted-foreground"}`}>{timeShort(m.created_at)}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {conv.listing_id && showOfferForm && (
          <form onSubmit={submitOffer} className="space-y-3 border-t border-border bg-brand-soft/30 p-4">
            <p className="font-display text-lg font-black text-brand-ink">
              {iAmSeller ? "Angebot an Käufer:in" : "Preisvorschlag an Shop"}
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-xs font-bold text-brand-ink">
                Preis pro Stück (€)
                <input
                  value={offerPrice}
                  onChange={(e) => setOfferPrice(e.target.value)}
                  inputMode="decimal"
                  className="mt-1 min-h-11 w-full rounded-2xl border border-border bg-background px-4 text-sm focus:border-brand focus:outline-none"
                />
              </label>
              <label className="text-xs font-bold text-brand-ink">
                Menge
                <input
                  value={offerQty}
                  onChange={(e) => setOfferQty(e.target.value)}
                  inputMode="numeric"
                  className="mt-1 min-h-11 w-full rounded-2xl border border-border bg-background px-4 text-sm focus:border-brand focus:outline-none"
                />
              </label>
            </div>
            <label className="block text-xs font-bold text-brand-ink">
              Notiz (optional)
              <textarea
                value={offerNote}
                onChange={(e) => setOfferNote(e.target.value)}
                rows={2}
                placeholder="z. B. Versand inklusive, Abholung möglich …"
                className="mt-1 w-full rounded-2xl border border-border bg-background px-4 py-2 text-sm focus:border-brand focus:outline-none"
              />
            </label>
            <div className="flex gap-2">
              <button type="submit" className="min-h-11 flex-1 rounded-full bg-brand px-4 text-sm font-bold text-primary-foreground hover:opacity-90">
                Angebot senden
              </button>
              <button
                type="button"
                onClick={() => setShowOfferForm(false)}
                className="min-h-11 rounded-full border border-border px-4 text-sm font-bold text-brand-ink"
              >
                Abbrechen
              </button>
            </div>
          </form>
        )}

        <form onSubmit={submit} className="flex items-center gap-2 border-t border-border p-3">
          {conv.listing_id && (
            <button
              type="button"
              onClick={() => setShowOfferForm((v) => !v)}
              aria-label="Angebot machen"
              title="Angebot machen"
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand-soft text-brand hover:scale-105"
            >
              <Tag className="h-4 w-4" />
            </button>
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
