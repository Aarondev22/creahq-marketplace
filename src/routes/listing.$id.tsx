import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, useQuery, queryOptions } from "@tanstack/react-query";
import { motion } from "motion/react";
import {
  ArrowLeft,
  Heart,
  Share2,
  Shield,
  Truck,
  Download,
  MessageCircle,
  Star,
  Package,
} from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchListingById,
  fetchRelatedListings,
  type ListingCard,
} from "@/lib/listings.functions";
import { getOrCreateConversation } from "@/lib/chat.functions";
import { useCart } from "@/lib/cart";
import { toast } from "sonner";

const listingQuery = (id: string) =>
  queryOptions({
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
    meta: [
      { title: "Listing — CreaHQ" },
      { name: "description", content: "Listing-Details auf CreaHQ." },
      { property: "og:title", content: "Listing — CreaHQ" },
      { property: "og:description", content: "Listing-Details auf CreaHQ." },
      { property: "og:type", content: "product" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ListingPage,
  errorComponent: ({ error }) => (
    <div className="p-10 text-center text-sm text-muted-foreground">{error.message}</div>
  ),
  notFoundComponent: () => (
    <div className="p-10 text-center text-sm text-muted-foreground">Listing nicht gefunden.</div>
  ),
});

function ListingPage() {
  const { id } = Route.useParams();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);
  if (isPlaceholder(id)) return <PlaceholderListing id={id} />;
  return <RealListing id={id} />;
}

function RealListing({ id }: { id: string }) {
  const { data } = useSuspenseQuery(listingQuery(id));
  if (!data) return <PlaceholderListing id={id} />;
  return <ListingView l={data} />;
}

function ListingView({
  l,
}: {
  l: NonNullable<Awaited<ReturnType<typeof fetchListingById>>>;
}) {
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [isFav, setIsFav] = useState(false);
  const [favId, setFavId] = useState<string | null>(null);

  const gallery = (l.images ?? []).filter(Boolean);
  const allImages = gallery.length > 0 ? gallery : l.cover_url ? [l.cover_url] : [];
  const [activeImg, setActiveImg] = useState(0);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data } = await supabase
        .from("favorites")
        .select("id")
        .eq("user_id", u.user.id)
        .eq("listing_id", l.id)
        .maybeSingle();
      if (!active) return;
      setFavId(data?.id ?? null);
      setIsFav(Boolean(data));
    })();
    return () => {
      active = false;
    };
  }, [l.id]);

  function handleAddToCart() {
    addItem({
      id: l.id,
      title: l.title,
      price_cents: l.price_cents,
      cover_url: l.cover_url,
    });
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
      setIsFav(false);
      setFavId(null);
      toast.success("Aus Favoriten entfernt");
    } else {
      const { data, error } = await supabase
        .from("favorites")
        .insert({ user_id: u.user.id, listing_id: l.id })
        .select("id")
        .single();
      if (error) return toast.error(error.message);
      setIsFav(true);
      setFavId(data.id);
      toast.success("Zu Favoriten hinzugefügt!");
    }
  }

  async function handleOpenChat() {
    try {
      const sellerId = l.seller_id ?? l.seller?.id;
      if (!sellerId) throw new Error("Keine Verkäufer-ID gefunden");
      const convId = await getOrCreateConversation(sellerId, l.id);
      navigate({ to: "/chat/$id", params: { id: convId } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Chat konnte nicht geöffnet werden");
    }
  }

  function handleShare() {
    if (navigator.share) {
      navigator
        .share({ title: l.title, text: l.description ?? "", url: window.location.href })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link kopiert!");
    }
  }

  const isDigital = l.kind === "digital";
  const shippingLabel = isDigital
    ? "Kein Versand — sofort verfügbar"
    : l.shipping_mode === "extra"
      ? `${(l.shipping_price_cents / 100).toFixed(2)} € Versand`
      : "Versand inklusive";

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-2">
      <div className="space-y-3">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="aspect-square overflow-hidden rounded-[2rem] border border-border bg-gradient-to-br from-brand-soft to-amber-100/40"
        >
          {allImages[activeImg] ? (
            <img src={allImages[activeImg]} alt={l.title} className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full place-items-center text-6xl">🎨</div>
          )}
        </motion.div>
        {allImages.length > 1 && (
          <div className="grid grid-cols-4 gap-2">
            {allImages.map((src, i) => (
              <button
                key={`${src}-${i}`}
                type="button"
                onClick={() => setActiveImg(i)}
                aria-label={`Bild ${i + 1} anzeigen`}
                className={`aspect-square overflow-hidden rounded-xl border-2 transition-colors ${
                  i === activeImg ? "border-brand" : "border-border hover:border-brand/50"
                }`}
              >
                <img src={src} alt={`${l.title} — Bild ${i + 1}`} className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="flex flex-wrap items-center gap-2">
          {l.category && (
            <span className="inline-block rounded-full bg-brand-soft px-3 py-1 text-xs font-bold uppercase tracking-widest text-brand">
              {l.category}
            </span>
          )}
          <span className="inline-block rounded-full border border-border bg-card px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {isDigital ? "Digital" : "Physisch"}
          </span>
        </div>

        <h1 className="mt-2 font-display text-4xl font-black text-brand-ink">{l.title}</h1>

        {l.seller && (
          <Link
            to="/shop/$handle"
            params={{ handle: l.seller.handle ?? "" }}
            className="mt-3 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-sm font-semibold text-brand-ink transition-colors hover:border-brand hover:bg-brand-soft hover:text-brand"
          >
            <span className="grid h-7 w-7 place-items-center rounded-full bg-brand/15 text-xs font-bold text-brand">
              {(l.seller.display_name ?? "?").slice(0, 1).toUpperCase()}
            </span>
            Shop: {l.seller.display_name}
            {l.seller.handle ? (
              <span className="text-xs font-medium text-muted-foreground">@{l.seller.handle}</span>
            ) : null}
          </Link>
        )}

        <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-900">
          <Star className="h-3 w-3" /> 0,0 · noch keine Bewertungen
        </div>

        <p className="mt-6 whitespace-pre-line text-sm leading-relaxed text-foreground/80">
          {l.description}
        </p>

        <dl className="mt-6 grid grid-cols-2 gap-3 rounded-2xl border border-border bg-card p-4 text-sm">
          <Detail
            icon={isDigital ? <Download className="h-3.5 w-3.5" /> : <Package className="h-3.5 w-3.5" />}
            label="Typ"
            value={isDigital ? "Digital" : "Physisch"}
          />
          <Detail
            icon={<Truck className="h-3.5 w-3.5" />}
            label={isDigital ? "Lieferung" : "Versand"}
            value={shippingLabel}
          />
          <Detail icon={<Shield className="h-3.5 w-3.5" />} label="Käuferschutz" value="Über CreaHQ" />
          <Detail icon={<MessageCircle className="h-3.5 w-3.5" />} label="Support" value="Direkt vom Creator" />
          {l.location && <Detail icon={<Package className="h-3.5 w-3.5" />} label="Ort" value={l.location} />}
          {l.condition && <Detail icon={<Star className="h-3.5 w-3.5" />} label="Zustand" value={l.condition} />}
          {typeof l.stock === "number" && (
            <Detail icon={<Package className="h-3.5 w-3.5" />} label="Verfügbar" value={`${l.stock} Stück`} />
          )}
        </dl>

        <div className="mt-8 flex items-end gap-4">
          <div className="font-display text-4xl font-black text-brand">
            {(l.price_cents / 100).toFixed(2)} €
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleAddToCart}
            className="min-w-[200px] flex-1 rounded-full bg-brand px-6 py-4 text-base font-bold text-primary-foreground brand-glow transition-transform hover:scale-[1.02]"
          >
            In den Warenkorb
          </button>
          <button
            type="button"
            onClick={handleFavorite}
            aria-label="Favorisieren"
            title={isFav ? "Aus Favoriten entfernen" : "Favorisieren"}
            className="grid h-14 w-14 shrink-0 place-items-center rounded-full border-2 border-border bg-card text-brand-ink transition-colors hover:border-brand hover:text-brand"
          >
            <Heart className={`h-5 w-5 ${isFav ? "fill-red-500 text-red-500" : ""}`} />
          </button>
          <button
            type="button"
            onClick={handleOpenChat}
            aria-label="Chat mit Verkäufer"
            title="Chat mit Verkäufer"
            className="grid h-14 w-14 shrink-0 place-items-center rounded-full border-2 border-border bg-card text-brand-ink transition-colors hover:border-brand hover:text-brand"
          >
            <MessageCircle className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={handleShare}
            aria-label="Teilen"
            title="Teilen"
            className="grid h-14 w-14 shrink-0 place-items-center rounded-full border-2 border-border bg-card text-brand-ink transition-colors hover:border-brand hover:text-brand"
          >
            <Share2 className="h-5 w-5" />
          </button>
        </div>
      </div>

      <RelatedRails
        id={l.id}
        sellerId={l.seller_id}
        category={l.category}
        sellerName={l.seller?.display_name ?? "diesem Shop"}
        sellerHandle={l.seller?.handle}
      />
    </div>
  );
}

function RelatedRails({
  id,
  sellerId,
  category,
  sellerName,
  sellerHandle,
}: {
  id: string;
  sellerId: string;
  category: string | null;
  sellerName: string;
  sellerHandle?: string | null;
}) {
  const { data } = useQuery({
    queryKey: ["related", id],
    queryFn: () => fetchRelatedListings({ data: { id, sellerId, category } }),
  });

  return (
    <div className="space-y-12 pt-4 lg:col-span-2">
      <Rail
        title={`Sachen vom Shop · ${sellerName}`}
        subtitle="Weitere Produkte von diesem Creator."
        emoji="🏪"
        items={data?.fromShop ?? []}
        empty={`${sellerName} hat aktuell keine weiteren Produkte online.`}
        viewAll={
          sellerHandle
            ? { to: "/shop/$handle" as const, params: { handle: sellerHandle } }
            : null
        }
      />
      <Rail
        title="Ähnliche Produkte"
        subtitle="Passt vielleicht auch — kuratiert aus CreaHQ."
        emoji="✨"
        items={data?.similar ?? []}
        empty="Noch nichts Ähnliches auf CreaHQ. Schau später nochmal rein."
        viewAll={{ to: "/browse" as const, params: undefined }}
      />
    </div>
  );
}

function Rail({
  title,
  subtitle,
  emoji,
  items,
  empty,
  viewAll,
}: {
  title: string;
  subtitle: string;
  emoji: string;
  items: ListingCard[];
  empty: string;
  viewAll:
    | { to: "/browse"; params: undefined }
    | { to: "/shop/$handle"; params: { handle: string } }
    | null;
}) {
  return (
    <section>
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-black text-brand-ink">
            <span className="mr-1">{emoji}</span>
            {title}
          </h2>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
        {viewAll && items.length > 0 && (
          viewAll.to === "/browse" ? (
            <Link to="/browse" className="text-xs font-semibold text-brand hover:underline">
              Alle ansehen →
            </Link>
          ) : (
            <Link
              to="/shop/$handle"
              params={viewAll.params}
              className="text-xs font-semibold text-brand hover:underline"
            >
              Alle ansehen →
            </Link>
          )
        )}
      </div>
      {items.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-brand/25 bg-card/40 p-8 text-center text-sm text-muted-foreground">
          {empty}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((item) => (
            <Link
              key={item.id}
              to="/listing/$id"
              params={{ id: item.id }}
              className="group overflow-hidden rounded-2xl border border-border bg-card transition-all hover:-translate-y-1 hover:border-brand hover:shadow-lg"
            >
              <div className="flex aspect-square items-center justify-center bg-gradient-to-br from-brand-soft/60 via-transparent to-amber-100/40 text-4xl">
                {item.cover_url ? (
                  <img src={item.cover_url} alt={item.title} className="h-full w-full object-cover" />
                ) : (
                  "🎨"
                )}
              </div>
              <div className="p-3">
                <div className="text-xs font-bold uppercase tracking-widest text-brand/70">
                  {item.category ?? (item.kind === "digital" ? "Digital" : "Physisch")}
                </div>
                <div className="mt-0.5 truncate text-sm font-semibold text-brand-ink group-hover:text-brand">
                  {item.title}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {(item.price_cents / 100).toFixed(2)} €
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

function PlaceholderListing({ id }: { id: string }) {
  const nr = id.split("-").pop() ?? "01";
  const [fav, setFav] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  const isVerpackung = id.startsWith("beispiel-verpackung-");
  const kind = id.includes("-verpackung-") ? "Verpackung" : "Digital · Physisch";
  const shopHandle = isVerpackung ? "packshop" : "creator";
  const shopName = isVerpackung ? "PackShop" : "Creator-Shop";
  const productTitle = isVerpackung
    ? "Verpackungs-Bundle · Platzhalter"
    : "Hier wohnt ein echtes Produkt.";

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <Link
        to="/"
        className="inline-flex items-center gap-1 rounded-full bg-brand-soft px-3 py-1.5 text-xs font-bold text-brand-ink hover:bg-brand hover:text-primary-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Zurück zur Startseite
      </Link>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <Link
          to="/shop/$handle"
          params={{ handle: shopHandle }}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 font-semibold text-brand-ink hover:border-brand hover:bg-brand-soft hover:text-brand"
        >
          <span className="grid h-5 w-5 place-items-center rounded-full bg-brand/15 text-[10px] font-bold text-brand">
            {shopName.slice(0, 1)}
          </span>
          Shop: {shopName}
        </Link>
        <span>›</span>
        <span className="font-semibold text-brand-ink">{productTitle}</span>
        <span className="ml-auto rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-brand">
          Platzhalter
        </span>
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-2">
        <div className="space-y-3">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative flex aspect-square items-center justify-center overflow-hidden rounded-[2rem] border-2 border-dashed border-brand/30 bg-gradient-to-br from-brand-soft/60 via-transparent to-amber-100/40"
          >
            <div className="text-center">
              <div className="text-7xl">📦</div>
              <p className="mt-4 text-xs font-bold uppercase tracking-widest text-brand/70">
                Platzhalter #{String(nr).padStart(2, "0")}
              </p>
            </div>
          </motion.div>
          <div className="grid grid-cols-4 gap-2">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="aspect-square rounded-xl border border-dashed border-brand/20 bg-brand-soft/40"
              />
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

          <h1 className="mt-2 font-display text-4xl font-black text-brand-ink">{productTitle}</h1>

          <div className="mt-3">
            <Link
              to="/shop/$handle"
              params={{ handle: shopHandle }}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-sm font-semibold text-brand-ink hover:border-brand hover:bg-brand-soft hover:text-brand"
            >
              <span className="grid h-7 w-7 place-items-center rounded-full bg-brand/15 text-xs font-bold text-brand">
                {shopName.slice(0, 1)}
              </span>
              Shop: {shopName}
            </Link>
          </div>

          <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-900">
            <Star className="h-3 w-3 fill-current" /> 0,0 · noch keine Bewertungen
          </div>

          <div className="mt-6 space-y-2">
            <div className="h-3 w-11/12 rounded-full bg-brand/15" />
            <div className="h-3 w-9/12 rounded-full bg-brand/10" />
            <div className="h-3 w-10/12 rounded-full bg-brand/15" />
            <div className="h-3 w-6/12 rounded-full bg-brand/10" />
          </div>

          <dl className="mt-6 grid grid-cols-2 gap-3 rounded-2xl border border-border bg-card p-4 text-sm">
            <Detail icon={<Download className="h-3.5 w-3.5" />} label="Typ" value={kind} />
            <Detail
              icon={<Truck className="h-3.5 w-3.5" />}
              label="Lieferzeit"
              value={isVerpackung ? "2–4 Werktage" : "Sofort verfügbar"}
            />
            <Detail icon={<Shield className="h-3.5 w-3.5" />} label="Käuferschutz" value="Über CreaHQ" />
            <Detail icon={<MessageCircle className="h-3.5 w-3.5" />} label="Support" value="Direkt vom Creator" />
          </dl>

          <div className="mt-8 flex items-end gap-4">
            <div className="font-display text-4xl font-black text-brand">—,— €</div>
            <span className="pb-2 text-xs text-muted-foreground">
              Preis, sobald ein Creator auf „Veröffentlichen“ drückt.
            </span>
          </div>

          <div className="mt-6 flex gap-2">
            <button
              type="button"
              disabled
              className="flex-1 cursor-not-allowed rounded-full bg-brand/60 px-6 py-4 text-base font-bold text-primary-foreground brand-glow"
            >
              In den Warenkorb
            </button>
            <button
              type="button"
              onClick={() => setFav((v) => !v)}
              aria-pressed={fav}
              aria-label="Favorisieren"
              className={`grid h-14 w-14 shrink-0 place-items-center rounded-full border-2 transition-colors ${
                fav
                  ? "border-red-500 bg-red-50 text-red-500"
                  : "border-border bg-card text-brand-ink hover:border-brand hover:text-brand"
              }`}
            >
              <Heart className={`h-5 w-5 ${fav ? "fill-current" : ""}`} />
            </button>
            <button
              type="button"
              onClick={() => setChatOpen(true)}
              aria-label="Chat mit Verkäufer"
              className="grid h-14 w-14 shrink-0 place-items-center rounded-full border-2 border-border bg-card text-brand-ink transition-colors hover:border-brand hover:text-brand"
            >
              <MessageCircle className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label="Teilen"
              className="grid h-14 w-14 shrink-0 place-items-center rounded-full border-2 border-border bg-card text-brand-ink transition-colors hover:border-brand hover:text-brand"
            >
              <Share2 className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-6 rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
            Das ist ein <strong className="text-brand-ink">Platzhalter-Produkt</strong> — Struktur
            einer echten Produktseite.
          </div>
        </div>
      </div>

      {chatOpen && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"
          onClick={() => setChatOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl"
          >
            <h3 className="font-display text-xl font-black text-brand-ink">Chat mit {shopName}</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Sobald der Shop live ist, schreibst du hier direkt mit dem Creator.
            </p>
            <button
              type="button"
              onClick={() => setChatOpen(false)}
              className="mt-4 w-full rounded-full bg-brand px-4 py-2 text-sm font-bold text-primary-foreground"
            >
              Schließen
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Detail({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div>
      <dt className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {icon} {label}
      </dt>
      <dd className="mt-0.5 text-sm font-semibold text-brand-ink">{value}</dd>
    </div>
  );
}