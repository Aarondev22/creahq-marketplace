import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { motion } from "motion/react";
import { ArrowLeft } from "lucide-react";
import { fetchListingById } from "@/lib/listings.functions";

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
  const { data: l } = useSuspenseQuery(listingQuery(id));
  if (!l) return <PlaceholderListing id={id} />;
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
        <p className="mt-6 whitespace-pre-line text-sm leading-relaxed text-foreground/80">{l.description}</p>
        <div className="mt-8 flex items-end gap-4">
          <div className="font-display text-4xl font-black text-brand">{(l.price_cents/100).toFixed(2)} €</div>
        </div>
        <button className="mt-6 w-full rounded-full bg-brand px-6 py-4 text-base font-bold text-primary-foreground brand-glow transition-transform hover:scale-[1.02]">
          In den Warenkorb (kommt bald)
        </button>
        <p className="mt-2 text-center text-xs text-muted-foreground">Stripe Checkout wird im nächsten Schritt aktiviert.</p>
      </div>
    </div>
  );
}

/**
 * Placeholder detail view — shows the structure of a product page
 * (image, title, seller, description, price, buy button) with dummy
 * content so clicking a placeholder card on the homepage never lands
 * back on the category grid.
 */
function PlaceholderListing({ id }: { id: string }) {
  const nr = id.split("-").pop() ?? "01";
  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <Link to="/" className="inline-flex items-center gap-1 rounded-full bg-brand-soft px-3 py-1.5 text-xs font-bold text-brand-ink hover:bg-brand hover:text-primary-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Zurück zur Startseite
      </Link>

      <div className="mt-6 grid gap-8 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative flex aspect-square items-center justify-center overflow-hidden rounded-[2rem] border-2 border-dashed border-brand/30 bg-gradient-to-br from-brand-soft/60 via-transparent to-amber-100/40"
        >
          <div className="text-center">
            <div className="text-7xl">📦</div>
            <p className="mt-4 text-xs font-bold uppercase tracking-widest text-brand/70">Platzhalter #{String(nr).padStart(2, "0")}</p>
          </div>
        </motion.div>

        <div>
          <span className="inline-block rounded-full bg-brand-soft px-3 py-1 text-xs font-bold uppercase tracking-widest text-brand">
            Beispiel-Kategorie
          </span>
          <h1 className="mt-2 font-display text-4xl font-black text-brand-ink">
            Hier wohnt bald ein echtes Produkt.
          </h1>
          <div className="mt-2 inline-flex items-center gap-2 text-sm text-muted-foreground">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-brand/15 text-xs font-bold text-brand">C</span>
            von einem Creator, den wir noch suchen
          </div>

          <div className="mt-6 space-y-2">
            <div className="h-3 w-11/12 rounded-full bg-brand/15" />
            <div className="h-3 w-9/12 rounded-full bg-brand/10" />
            <div className="h-3 w-10/12 rounded-full bg-brand/15" />
            <div className="h-3 w-6/12 rounded-full bg-brand/10" />
          </div>

          <div className="mt-8 flex items-end gap-4">
            <div className="font-display text-4xl font-black text-brand">—,— €</div>
            <span className="pb-2 text-xs text-muted-foreground">Preis, sobald ein Creator drückt auf „Veröffentlichen".</span>
          </div>

          <button
            disabled
            className="mt-6 w-full cursor-not-allowed rounded-full bg-brand/60 px-6 py-4 text-base font-bold text-primary-foreground brand-glow"
          >
            In den Warenkorb (bald)
          </button>

          <div className="mt-6 rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
            Das ist ein <strong className="text-brand-ink">Platzhalter-Produkt</strong> — du siehst die Struktur einer Produktseite. Sobald Creator hier reinstellen, ersetzt echtes Zeug diese Ansicht.
          </div>
        </div>
      </div>
    </div>
  );
}
