import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { motion } from "motion/react";
import { ArrowLeft, Heart, Share2, Shield, Truck, Download, MessageCircle, Star } from "lucide-react";
import { useState } from "react";
import { fetchListingById } from "@/lib/listings.functions";
import { getOrCreateConversation } from "@/lib/chat.functions";
import { useCart } from "@/lib/cart";
import { toast } from "sonner";

const listingQuery = (id: string) => queryOptions({
  queryKey: ["listing", id],
  queryFn: () => fetchListingById({ data: { id } }),
});

function isPlaceholder(id: string) {
  return id.startsWith("beispiel");
}

export const Route = createFileRoute("/listing/$id")({
  loader: async ({ params, context }) => {
    if (isPlaceholder(params.id)) return;
    await context.queryClient.ensureQueryData(listingQuery(params.id));
  },
  head: () => ({
    meta: [{ title: "Listing — CreaHQ" }, { name: "description", content: "Listing-Details auf CreaHQ." }],
  }),
  component: ListingPage,
  errorComponent: ({ error }) => <div className="p-10 text-center text-sm text-muted-foreground">{error.message}</div>,
  notFoundComponent: () => <div className="p-10 text-center text-sm text-muted-foreground">Listing nicht gefunden.</div>,
});

function ListingPage() {
  const { id } = Route.useParams();
  if (isPlaceholder(id)) return <PlaceholderListing id={id} />;
  return <RealListing id={id} />;
}

function RealListing({ id }: { id: string }) {
  const { data } = useSuspenseQuery(listingQuery(id));
  if (!data) return <PlaceholderListing id={id} />;
  return <ListingView l={data} />;
}

function ListingView({ l }: { l: NonNullable<Awaited<ReturnType<typeof fetchListingById>>> }) {
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [isFav, setIsFav] = useState(false);
  const [favId, setFavId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data } = await supabase.from("favorites").select("id").eq("user_id", u.user.id).eq("listing_id", l.id).maybeSingle();
      if (!active) return;
      setFavId(data?.id ?? null);
      setIsFav(Boolean(data));
    })();
    return () => { active = false; };
  }, [l.id]);

  function handleAddToCart() {
    addItem({ id: l.id, title: l.title, price_cents: l.price_cents, cover_url: l.cover_url });
    toast.success("In den Warenkorb gelegt!");
  }

  async function handleFavorite() {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) {
      toast.error("Melde dich an, um zu favorisieren.");
      navigate({ to: "/auth" });
      return;
    }
    if (isFav && favId) {
      const { error } = await supabase.from("favorites").delete().eq("id", favId);
      if (error) return toast.error(error.message);
      setIsFav(false); setFavId(null);
      toast.success("Aus Favoriten entfernt");
    } else {
      const { data, error } = await supabase.from("favorites").insert({ user_id: u.user.id, listing_id: l.id }).select("id").single();
      if (error) return toast.error(error.message);
      setIsFav(true); setFavId(data.id);
      toast.success("Zu Favoriten hinzugefügt!");
    }
  }

  async function handleOpenChat() {
    try {
      const sellerId = (l as any).seller_id ?? l.seller?.id;
      if (!sellerId) throw new Error("Keine Verkäufer-ID gefunden");
      const convId = await getOrCreateConversation(sellerId);
      navigate({ to: "/nachrichten", search: { c: convId } });
    } catch (err: any) {
      toast.error(err?.message ?? "Unbekannter Fehler beim Chat öffnen");
    }
  }

  function handleShare() {
    if (navigator.share) {
      navigator.share({ title: l.title, text: l.description ?? "", url: window.location.href }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link kopiert!");
    }
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-6 py-12 lg:grid-cols-2">
      <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="overflow-hidden rounded-[2rem] border border-border bg-gradient-to-br from-brand-soft to-amber-100/40 aspect-square">
        {l.cover_url ? <img src={l.cover_url} alt={l.title} className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-6xl">🎨</div>}
      </motion.div>
      <div>
        {l.category && <span className="inline-block rounded-full bg-brand-soft px-3 py-1 text-xs font-bold uppercase tracking-widest text-brand">{l.category}</span>}
        <h1 className="mt-2 font-display text-4xl font-black text-brand-ink">{l.title}</h1>
        {l.seller && (
          <Link to="/shop/$handle" params={{ handle: l.seller.handle ?? "" }} className="mt-2 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-brand">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-brand/15 text-xs font-bold text-brand">{(l.seller.display_name ?? "?").slice(0,1).toUpperCase()}</span>
            von {l.seller.display_name}
          </Link>
        )}
        <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-900">
          <Star className="h-3 w-3" /> 0,0 · noch keine Bewertungen
        </div>
        <p className="mt-6 whitespace-pre-line text-sm leading-relaxed text-foreground/80">{l.description}</p>
        <div className="mt-8 flex items-end gap-4">
          <div className="font-display text-4xl font-black text-brand">{(l.price_cents/100).toFixed(2)} €</div>
        </div>
        <div className="mt-6 flex gap-2">
          <button
            onClick={handleAddToCart}
            className="flex-1 rounded-full bg-brand px-6 py-4 text-base font-bold text-primary-foreground brand-glow transition-transform hover:scale-[1.02]"
          >
            In den Warenkorb
          </button>
          <button
            onClick={handleFavorite}
            aria-label="Favorisieren"
            title={isFav ? "Aus Favoriten entfernen" : "Favorisieren"}
            className="grid h-14 w-14 shrink-0 place-items-center rounded-full border-2 border-border bg-card text-brand-ink hover:border-brand hover:text-brand transition-colors"
          >
            <Heart className={`h-5 w-5 ${isFav ? "fill-red-500 text-red-500" : ""}`} />
          </button>
          <button
            onClick={handleOpenChat}
            aria-label="Chat mit Verkäufer"
            title="Chat mit Verkäufer"
            className="grid h-14 w-14 shrink-0 place-items-center rounded-full border-2 border-border bg-card text-brand-ink hover:border-brand hover:text-brand transition-colors"
          >
            <MessageCircle className="h-5 w-5" />
          </button>
          <button
            onClick={handleShare}
            aria-label="Teilen"
            title="Teilen"
            className="grid h-14 w-14 shrink-0 place-items-center rounded-full border-2 border-border bg-card text-brand-ink hover:border-brand hover:text-brand transition-colors"
          >
            <Share2 className="h-5 w-5" />
          </button>
        </div>
        <p className="mt-2 text-center text-xs text-muted-foreground">Stripe Checkout folgt im nächsten Schritt.</p>
      </div>
      <RelatedRails 
        currentId={l.id} 
        sellerName={l.seller?.display_name ?? "diesem Shop"} 
        sellerHandle={l.seller?.handle}
      />
    </div>
  );
}

function RelatedRails({ 
  currentId, 
  sellerName, 
  sellerHandle 
}: { 
  currentId: string; 
  sellerName: string; 
  sellerHandle?: string | null;
}) {
  return (
    <div className="lg:col-span-2 space-y-12 pt-4">
      <PlaceholderRail
        title={`Sachen vom Shop · ${sellerName}`}
        subtitle="Weitere Produkte von diesem Creator."
        keyPrefix={`shop-${currentId}`}
        emoji="🏪"
        viewAllLink={sellerHandle ? `/shop/${sellerHandle}` : "/browse"}
      />
      <PlaceholderRail
        title="Weitere Beispiele"
        subtitle="Passt vielleicht auch — kuratierte Empfehlungen aus CreaHQ."
        keyPrefix={`sim-${currentId}`}
        emoji="✨"
        viewAllLink="/browse"
      />
    </div>
  );
}

function PlaceholderRail({ 
  title, 
  subtitle, 
  keyPrefix, 
  emoji,
  viewAllLink = "/browse"
}: { 
  title: string; 
  subtitle: string; 
  keyPrefix: string; 
  emoji: string;
  viewAllLink?: string;
}) {
  return (
    <section>
      <div className="mb-4 flex items-end justify-between">
        <div>
          <h2 className="font-display text-2xl font-black text-brand-ink">
            <span className="mr-1">{emoji}</span>{title}
          </h2>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <Link to={viewAllLink} className="text-xs font-semibold text-brand hover:underline">
          Alle ansehen →
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Link
            key={`${keyPrefix}-${i}`}
            to="/listing/$id"
            params={{ id: `beispiel-${keyPrefix}-${i + 1}` }}
            className="group overflow-hidden rounded-2xl border border-border bg-card transition-all hover:-translate-y-1 hover:border-brand hover:shadow-lg"
          >
            <div className="flex aspect-square items-center justify-center bg-gradient-to-br from-brand-soft/60 via-transparent to-amber-100/40 text-4xl">
              {"📦🎨🎧🧩".charAt(i)}
            </div>
            <div className="p-3">
              <div className="text-xs font-bold uppercase tracking-widest text-brand/70">Platzhalter</div>
              <div className="mt-0.5 truncate text-sm font-semibold text-brand-ink group-hover:text-brand">Beispiel #{i + 1}</div>
              <div className="mt-1 text-xs text-muted-foreground">—,— €</div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function PlaceholderListing({ id }: { id: string }) {
  const nr = id.split("-").pop() ?? "01";
  const [fav, setFav] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  const isVerpackung = id.startsWith("beispiel-verpackung-");
  const kind = id.includes("-verpackung-") ? "Verpackung" : "Digital · Service · Chatbot · Physisch";
  const shopHandle = isVerpackung ? "packshop" : "creator";
  const shopName = isVerpackung ? "PackShop" : "Creator-Shop";
  const productTitle = isVerpackung
    ? "Verpackungs-Bundle · Platzhalter"
    : "Hier wohnt ein echtes Produkt.";

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <Link to="/" className="inline-flex items-center gap-1 rounded-full bg-brand-soft px-3 py-1.5 text-xs font-bold text-brand-ink hover:bg-brand hover:text-primary-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Zurück zur Startseite
      </Link>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <Link to="/shop/$handle" params={{ handle: shopHandle }} className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 font-semibold text-brand-ink hover:border-brand hover:text-brand">
          <span className="grid h-5 w-5 place-items-center rounded-full bg-brand/15 text-[10px] font-bold text-brand">{shopName.slice(0,1)}</span>
          {shopName}
        </Link>
        <span>›</span>
        <span className="font-semibold text-brand-ink">{productTitle}</span>
        <span className="ml-auto rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-brand">Platzhalter</span>
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-2">
        <div className="space-y-3">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative flex aspect-square items-center justify-center overflow-hidden rounded-[2rem] border-2 border-dashed border-brand/30 bg-gradient-to-br from-brand-soft/60 via-transparent to-amber-100/40"
          >
            <div className="text-center">
              <div className="text-7xl">{isVerpackung ? "📦" : "📦"}</div>
              <p className="mt-4 text-xs font-bold uppercase tracking-widest text-brand/70">Platzhalter #{String(nr).padStart(2, "0")}</p>
            </div>
          </motion.div>
          <div className="grid grid-cols-4 gap-2">
            {[0,1,2,3].map((i) => (
              <div key={i} className="aspect-square rounded-xl border border-dashed border-brand/20 bg-brand-soft/40" />
            ))}
          </div>
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-block rounded-full bg-brand-soft px-3 py-1 text-xs font-bold uppercase tracking-widest text-brand">
              Beispiel-Kategorie
            </span>
            <span className="inline-block rounded-full border border-border bg-card px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              {kind}
            </span>
          </div>

          <h1 className="mt-2 font-display text-4xl font-black text-brand-ink">
            {productTitle}
          </h1>

          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <Link to="/shop/$handle" params={{ handle: shopHandle }} className="inline-flex items-center gap-2 hover:text-brand">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-brand/15 text-xs font-bold text-brand">{shopName.slice(0,1)}</span>
              von {shopName}
            </Link>
            <div className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-900">
              <Star className="h-3 w-3 fill-current" /> 0,0 · noch keine Bewertungen
            </div>
          </div>

          <div className="mt-6 space-y-2">
            <div className="h-3 w-11/12 rounded-full bg-brand/15" />
            <div className="h-3 w-9/12 rounded-full bg-brand/10" />
            <div className="h-3 w-10/12 rounded-full bg-brand/15" />
            <div className="h-3 w-6/12 rounded-full bg-brand/10" />
          </div>

          <dl className="mt-6 grid grid-cols-2 gap-3 rounded-2xl border border-border bg-card p-4 text-sm">
            <Detail icon={<Download className="h-3.5 w-3.5" />} label="Typ" value={kind} />
            <Detail icon={<Truck className="h-3.5 w-3.5" />} label="Lieferzeit" value={isVerpackung ? "2–4 Werktage" : "Sofort verfügbar"} />
            <Detail icon={<Shield className="h-3.5 w-3.5" />} label="Käuferschutz" value="Über CreaHQ" />
            <Detail icon={<MessageCircle className="h-3.5 w-3.5" />} label="Support" value="Direkt vom Creator" />
          </dl>

          <div className="mt-8 flex items-end gap-4">
            <div className="font-display text-4xl font-black text-brand">—,— €</div>
            <span className="pb-2 text-xs text-muted-foreground">Preis, sobald ein Creator drückt auf „Veröffentlichen".</span>
          </div>

          <div className="mt-6 flex gap-2">
            <button
              disabled
              className="flex-1 cursor-not-allowed rounded-full bg-brand/60 px-6 py-4 text-base font-bold text-primary-foreground brand-glow"
            >
              In den Warenkorb
            </button>
            <button
              onClick={() => setFav((v) => !v)}
              aria-pressed={fav}
              aria-label="Favorisieren"
              title={fav ? "Favorit entfernen" : "Favorisieren"}
              className={`grid h-14 w-14 shrink-0 place-items-center rounded-full border-2 transition-colors ${
                fav ? "border-red-500 bg-red-50 text-red-500" : "border-border bg-card text-brand-ink hover:border-brand hover:text-brand"
              }`}
            >
              <Heart className={`h-5 w-5 ${fav ? "fill-current" : ""}`} />
            </button>
            {!isVerpackung && (
              <button
                onClick={() => setChatOpen(true)}
                aria-label="Chat mit Verkäufer"
                title="Chat mit Verkäufer"
                className="grid h-14 w-14 shrink-0 place-items-center rounded-full border-2 border-border bg-card text-brand-ink hover:border-brand hover:text-brand transition-colors"
              >
                <MessageCircle className="h-5 w-5" />
              </button>
            )}
            <button
              aria-label="Teilen"
              title="Teilen"
              className="grid h-14 w-14 shrink-0 place-items-center rounded-full border-2 border-border bg-card text-brand-ink hover:border-brand hover:text-brand transition-colors"
            >
              <Share2 className="h-5 w-5" />
            </button>
          </div>

          {isVerpackung && (
            <button
              onClick={() => setChatOpen(true)}
              className="mt-3 inline-flex items-center gap-2 rounded-full bg-brand-soft px-4 py-2 text-xs font-bold text-brand-ink hover:bg-brand hover:text-primary-foreground"
            >
              <MessageCircle className="h-3.5 w-3.5" /> Chat mit {shopName} öffnen
            </button>
          )}

          <div className="mt-6 rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
            Das ist ein <strong className="text-brand-ink">Platzhalter-Produkt</strong> — du siehst die Struktur einer echten Produktseite. Sobald Creator hier reinstellen, ersetzt echtes Zeug diese Ansicht.
          </div>
        </div>
      </div>

      {chatOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={() => setChatOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl">
            <h3 className="font-display text-xl font-black text-brand-ink">Chat mit {shopName}</h3>
            <p className="mt-2 text-sm text-muted-foreground">Sobald der Shop live ist, schreibst du hier direkt mit dem Creator. Vorerst ein Platzhalter.</p>
            <button onClick={() => setChatOpen(false)} className="mt-4 w-full rounded-full bg-brand px-4 py-2 text-sm font-bold text-primary-foreground">Schließen</button>
          </div>
        </div>
      )}
    </div>
  );
}

function Detail({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div>
      <dt className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {icon} {label}
      </dt>
      <dd className="mt-0.5 text-sm font-semibold text-brand-ink">{value}</dd>
    </div>
  );
}